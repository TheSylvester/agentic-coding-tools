#!/usr/bin/env node
/**
 * claude-agent — non-interactive Claude Code CLI wrapper.
 *
 * Symmetric sibling of codex-agent. Same contract:
 *   PROMPT_FILE=task.md node claude-agent.mjs         # brief from file (byte-exact)
 *   node claude-agent.mjs <prompt>                    # args as prompt
 *   cat task.md | node claude-agent.mjs               # from stdin
 *   node claude-agent.mjs --resume <UUID> <follow-up> # TRUE resume (keeps context)
 *   node claude-agent.mjs --resume latest <follow-up> # resume most recent in cwd
 *   node claude-agent.mjs --session-id <UUID> ...     # pre-assign id
 *   node claude-agent.mjs --model sonnet ...          # model alias or full id
 *   node claude-agent.mjs --monitor ...               # live phase/liveness on stderr
 *   node claude-agent.mjs --version                   # diagnostics
 *
 * Runs on Linux, macOS, WSL and Windows (PowerShell, cmd, or Git Bash). It
 * needs only Node 18+ and the `claude` CLI — no bash, jq, python3, uuidgen,
 * GNU grep or GNU sort.
 *
 * EVERY prompt is delivered on the child's stdin, including resume follow-ups
 * (verified: a resumed session still recalls context set in the first turn).
 * That keeps user text out of argv entirely, which sidesteps both the ~128KB
 * MAX_ARG_STRLEN/E2BIG cap and Windows command-line quoting.
 *
 * Environment variables:
 *   PROMPT_FILE            - Read prompt from this file (preferred for big briefs)
 *   CLAUDE_MODEL           - Model alias/id (passed as --model). Omit for default.
 *   CLAUDE_SESSION         - Session to resume ("latest" or UUID)
 *   CLAUDE_SESSION_ID      - Pre-assign this UUID (must be a valid UUID)
 *   CLAUDE_PERMISSION_MODE - Default bypassPermissions (non-interactive needs it)
 *   CLAUDE_MONITOR=1       - Enable the live monitor on stderr (= --monitor)
 *   AGENT_LOG_DIR          - Where run logs go (default <tmp>/agentic-coding-tools)
 */

import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream, mkdirSync, statSync, accessSync, constants, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMonitor } from './claude-monitor.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const IS_WIN = process.platform === 'win32';

if (Number(process.versions.node.split('.')[0]) < 18) {
  fail(`node 18+ required (found ${process.versions.node}).`);
}

// --- Small helpers ---------------------------------------------------------

function fail(msg, code = 1) {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(code);
}

/** Locate an executable on PATH. Honors PATHEXT so `claude.cmd` is found on Windows. */
function which(cmd) {
  const exts = IS_WIN
    ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
    : [''];
  const looksLikePath = cmd.includes('/') || (IS_WIN && cmd.includes('\\'));
  const candidates = looksLikePath
    ? [cmd]
    : (process.env.PATH || '').split(IS_WIN ? ';' : ':').filter(Boolean).map((d) => path.join(d, cmd));

  for (const base of candidates) {
    for (const ext of exts) {
      const p = base + ext;
      try {
        if (!statSync(p).isFile()) continue;
        if (!IS_WIN) accessSync(p, constants.X_OK);
        return p;
      } catch {
        /* keep looking */
      }
    }
  }
  return null;
}

/**
 * Quote one argument for a cmd.exe command line.
 * Algorithm per https://qntm.org/cmd — the same one cross-spawn uses. Needed
 * because Node >= 18.20 refuses to spawn .cmd/.bat without a shell, and npm
 * installs `claude` as claude.cmd on Windows.
 */
function cmdQuote(arg) {
  let s = String(arg);
  s = s.replace(/(\\*)"/g, '$1$1\\"'); // escape embedded quotes
  s = s.replace(/(\\*)$/, '$1$1'); // escape trailing backslashes
  s = `"${s}"`;
  return s.replace(/[><!^&|]/g, '^$&'); // escape cmd metacharacters
}

/** Build spawn arguments that work for .cmd/.bat shims as well as real exes. */
function spawnTarget(exePath, args) {
  if (IS_WIN && /\.(cmd|bat)$/i.test(exePath)) {
    const line = [exePath.replace(/[><!^&|]/g, '^$&'), ...args.map(cmdQuote)].join(' ');
    return {
      file: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', `"${line}"`],
      opts: { windowsVerbatimArguments: true },
    };
  }
  return { file: exePath, args, opts: {} };
}

/** Read all of stdin as UTF-8. */
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Run a child, feeding it the prompt on stdin.
 *
 * @param {string} exe        resolved executable path
 * @param {string[]} args     argv (never contains user prose)
 * @param {object} input      {file} to stream, or {text} to write
 * @param {(line:string)=>void} [onStdoutLine] called per stdout line if set;
 *                            when set, stdout is NOT buffered into the result
 */
function run(exe, args, input, onStdoutLine) {
  return new Promise((resolve) => {
    const t = spawnTarget(exe, args);
    const child = spawn(t.file, t.args, { ...t.opts, stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let pending = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (d) => (stderr += d));

    if (onStdoutLine) {
      child.stdout.on('data', (d) => {
        pending += d;
        let nl;
        while ((nl = pending.indexOf('\n')) !== -1) {
          onStdoutLine(pending.slice(0, nl));
          pending = pending.slice(nl + 1);
        }
      });
    } else {
      child.stdout.on('data', (d) => (stdout += d));
    }

    child.on('error', (err) => resolve({ code: 127, stdout, stderr: stderr + err.message }));
    child.on('close', (code) => {
      if (onStdoutLine && pending) onStdoutLine(pending);
      resolve({ code: code ?? 1, stdout, stderr });
    });

    // Deliver the prompt. EPIPE is normal if the child exits early.
    child.stdin.on('error', () => {});
    if (input.file) {
      createReadStream(input.file).pipe(child.stdin);
    } else {
      child.stdin.end(Buffer.from(input.text ?? '', 'utf8'));
    }
  });
}

// --- Parse flags -----------------------------------------------------------

let model = process.env.CLAUDE_MODEL || '';
let resume = process.env.CLAUDE_SESSION || '';
let sessionId = process.env.CLAUDE_SESSION_ID || '';
const permissionMode = process.env.CLAUDE_PERMISSION_MODE || 'bypassPermissions';
let monitorOn = process.env.CLAUDE_MONITOR === '1';
let showVersion = false;

const argv = process.argv.slice(2);
function needValue(flag, i) {
  if (i + 1 >= argv.length) fail(`${flag} requires a value`, 2);
  return argv[i + 1];
}

let i = 0;
for (; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--version' || a === '-v') { showVersion = true; continue; }
  if (a === '--model' || a === '-m') { model = needValue(a, i); i++; continue; }
  if (a === '--resume' || a === '-r') { resume = needValue(a, i); i++; continue; }
  if (a === '--session-id') { sessionId = needValue(a, i); i++; continue; }
  if (a === '--monitor') { monitorOn = true; continue; }
  if (a === '--') { i++; break; }
  if (a.startsWith('-')) {
    // A flag is a single dash-prefixed token with no whitespace (--resume, -m).
    // A prompt that merely starts with '-' (e.g. the markdown bullet
    // "- the info above is good") contains whitespace — treat it as the prompt.
    if (/\s/.test(a)) break;
    fail(
      `unknown flag: ${a} (use -- before a single-token prompt starting with '-', ` +
        `or pass it via PROMPT_FILE/stdin)`,
      2
    );
  }
  break;
}
const rest = argv.slice(i);

// --- Diagnostics -----------------------------------------------------------

const claudeBin = which('claude');

if (showVersion) {
  process.stdout.write('claude-agent wrapper (node)\n');
  process.stdout.write(`node: ${process.version} on ${process.platform}\n`);
  if (!claudeBin) {
    process.stdout.write('claude CLI: NOT INSTALLED  (npm install -g @anthropic-ai/claude-code)\n');
    process.exit(0);
  }
  const { stdout } = await run(claudeBin, ['--version'], { text: '' });
  process.stdout.write(`claude CLI: ${stdout.trim() || 'unknown'} (at ${claudeBin})\n`);
  process.exit(0);
}

if (!claudeBin) {
  fail('claude not found. Install with: npm install -g @anthropic-ai/claude-code');
}

// --- Resolve the prompt source: PROMPT_FILE > args > stdin -----------------

let promptFile = '';
let promptText = '';

if (process.env.PROMPT_FILE) {
  promptFile = process.env.PROMPT_FILE;
  try {
    accessSync(promptFile, constants.R_OK);
  } catch {
    fail(`PROMPT_FILE not readable: ${promptFile}`);
  }
} else if (rest.length > 0) {
  promptText = rest.join(' ');
} else if (!process.stdin.isTTY) {
  promptText = await readStdin();
  // Guard the detached-parent case: stdin is a closed pipe or /dev/null, so we
  // would otherwise bill a turn on an empty prompt.
  if (promptText.trim() === '') {
    fail('no prompt: stdin was empty. Pass a prompt as arguments or set PROMPT_FILE.');
  }
} else {
  process.stderr.write('Usage: PROMPT_FILE=task.md claude-agent\n');
  process.stderr.write(
    '       claude-agent [--model M] [--resume latest|UUID] [--session-id UUID] [--monitor] <prompt>\n'
  );
  process.exit(1);
}

// --- Pre-assign a session id so the CALLER owns the handle up-front --------
// The orchestrator knows the UUID before the call returns, so it can monitor
// or resume without waiting for output. Only for NEW sessions — a pre-set id
// collides on resume.
if (!resume && !sessionId) sessionId = randomUUID();

// --- Persistent output file (survives task cleanup) ------------------------

const outputDir = process.env.AGENT_LOG_DIR || path.join(os.tmpdir(), 'agentic-coding-tools');
mkdirSync(outputDir, { recursive: true, mode: 0o700 });
const stamp = `${Math.floor(Date.now() / 1000)}-${process.pid}`;
const outputFile = path.join(outputDir, `claude-agent-${stamp}.log`);
process.stderr.write(`[output_file: ${outputFile}]\n`);

/** Emit the clean reply + session id. Identical contract in both modes. */
function emitResult(clean, sid) {
  // Exactly one blank line before [session_id:], matching codex-agent byte for
  // byte. fusionthink parses these.
  const body = `${String(clean).replace(/\s+$/, '')}\n\n[session_id: ${sid}]\n`;
  process.stdout.write(body);
  try {
    writeFileSync(outputFile, body, 'utf8');
  } catch (err) {
    process.stderr.write(`Warning: could not write ${outputFile}: ${err.message}\n`);
  }
}

function sessionArgs() {
  if (!resume) return ['--session-id', sessionId];
  return resume === 'latest' ? ['--continue'] : ['--resume', resume];
}

const input = promptFile ? { file: promptFile } : { text: promptText };

// ===========================================================================
// MONITOR MODE — stream-json with live liveness on stderr.
// The raw NDJSON is written to a sibling .ndjson file and simultaneously fed
// to the monitor in-process, so there is no `tee`, no pipeline, and no
// PIPESTATUS to recover. $outputFile still holds the CLEAN reply, byte-identical
// to default mode, so callers never branch on mode.
// ===========================================================================
if (monitorOn) {
  const ndjsonFile = outputFile.replace(/\.log$/, '.ndjson');
  process.stderr.write(`[ndjson_file: ${ndjsonFile}]\n`);

  const monitor = createMonitor();
  const ndjson = createWriteStream(ndjsonFile, { encoding: 'utf8' });
  let resultLine = '';

  const args = [
    '-p',
    '--output-format', 'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--include-hook-events',
    '--permission-mode', permissionMode,
    ...(model ? ['--model', model] : []),
    ...sessionArgs(),
  ];

  const { code, stderr } = await run(claudeBin, args, input, (line) => {
    ndjson.write(line + '\n');
    monitor.line(line);
    if (line.includes('"type":"result"')) resultLine = line;
  });

  monitor.close();
  await new Promise((r) => ndjson.end(r));

  if (code !== 0) {
    process.stderr.write(stderr);
    process.exit(code);
  }
  if (!resultLine) {
    process.stderr.write(stderr);
    fail('no terminal result event in stream.');
  }

  let parsed = {};
  try {
    parsed = JSON.parse(resultLine);
  } catch {
    fail('could not parse the terminal result event.');
  }
  emitResult(parsed.result ?? '', parsed.session_id || sessionId);
  process.exit(0);
}

// ===========================================================================
// DEFAULT MODE — `--output-format json` returns one object carrying .result
// (the clean final reply) and .session_id. No transcript scraping, and no jq
// or python3 needed: Node parses it natively.
// ===========================================================================
const args = [
  '-p',
  '--permission-mode', permissionMode,
  '--output-format', 'json',
  ...(model ? ['--model', model] : []),
  ...sessionArgs(),
];

const { code, stdout, stderr } = await run(claudeBin, args, input);

if (code !== 0) {
  process.stderr.write(stderr);
  process.exit(code);
}

let parsed = {};
try {
  parsed = JSON.parse(stdout);
} catch {
  process.stderr.write(stderr);
  fail(`could not parse the claude JSON result. Raw output:\n${stdout}`);
}

emitResult(parsed.result ?? '', parsed.session_id || sessionId);
process.exit(0);
