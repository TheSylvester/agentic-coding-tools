#!/usr/bin/env node
/**
 * codex-agent — non-interactive Codex CLI wrapper.
 *
 * Symmetric sibling of claude-agent. Same contract:
 *   PROMPT_FILE=task.md node codex-agent.mjs         # brief from file (byte-exact)
 *   node codex-agent.mjs <prompt>                    # args as prompt
 *   cat task.md | node codex-agent.mjs               # from stdin
 *   node codex-agent.mjs --resume <UUID> <follow-up> # resume by id
 *   node codex-agent.mjs --resume latest <follow-up> # resume most recent
 *   node codex-agent.mjs --model <model> <prompt>    # pick a model
 *   node codex-agent.mjs --version                   # diagnostics
 *
 * Runs on Linux, macOS, WSL and Windows (PowerShell, cmd, or Git Bash). It
 * needs only Node 18+ and the `codex` CLI — no bash, GNU grep -P, GNU sort -V,
 * awk or sed.
 *
 * EVERY prompt is delivered on the child's stdin via `codex exec ... -`
 * (verified: a resumed session still recalls context from the first turn).
 * That keeps user text out of argv, so a large brief is byte-exact rather than
 * truncated at the ~128KB MAX_ARG_STRLEN/E2BIG cap, and Windows command-line
 * quoting never applies to it.
 *
 * Environment variables:
 *   PROMPT_FILE     - Read prompt from this file
 *   CODEX_MODEL     - Model to use (passed as --model)
 *   CODEX_SESSION   - Session to resume ("latest" or UUID)
 *   CODEX_HOME      - Codex config/auth dir (default ~/.codex), honored by the CLI
 *   OPENAI_API_KEY  - API key (alternative to OAuth login)
 *   CODEX_API_KEY   - API key for exec mode
 *   AGENT_LOG_DIR   - Where run logs go (default <tmp>/agentic-coding-tools)
 */

import { spawn } from 'node:child_process';
import { createReadStream, mkdirSync, statSync, accessSync, constants, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MIN_VERSION = '0.80.0';
const IS_WIN = process.platform === 'win32';

if (Number(process.versions.node.split('.')[0]) < 18) {
  fail(`node 18+ required (found ${process.versions.node}).`);
}

// --- Small helpers ---------------------------------------------------------

function fail(msg, code = 1) {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(code);
}

/** Locate an executable on PATH. Honors PATHEXT so `codex.cmd` is found on Windows. */
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
 * Algorithm per https://qntm.org/cmd. Needed because Node >= 18.20 refuses to
 * spawn .cmd/.bat without a shell, and npm installs `codex` as codex.cmd on
 * Windows.
 */
function cmdQuote(arg) {
  let s = String(arg);
  s = s.replace(/(\\*)"/g, '$1$1\\"');
  s = s.replace(/(\\*)$/, '$1$1');
  s = `"${s}"`;
  return s.replace(/[><!^&|]/g, '^$&');
}

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

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

/** Run a child, feeding the prompt on stdin, capturing stdout and stderr separately. */
function run(exe, args, input) {
  return new Promise((resolve) => {
    const t = spawnTarget(exe, args);
    const child = spawn(t.file, t.args, { ...t.opts, stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));

    child.on('error', (err) => resolve({ code: 127, stdout, stderr: stderr + err.message }));
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));

    child.stdin.on('error', () => {});
    if (input.file) {
      createReadStream(input.file).pipe(child.stdin);
    } else {
      child.stdin.end(Buffer.from(input.text ?? '', 'utf8'));
    }
  });
}

/** Compare dotted numeric versions. Returns true when a >= b. */
function versionGte(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let k = 0; k < Math.max(pa.length, pb.length); k++) {
    const x = pa[k] ?? 0;
    const y = pb[k] ?? 0;
    if (x !== y) return x > y;
  }
  return true;
}

const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const authFile = path.join(codexHome, 'auth.json');

function hasAuthFile() {
  try {
    return statSync(authFile).size > 0;
  } catch {
    return false;
  }
}

function effectiveAuth() {
  if (process.env.CODEX_API_KEY) return 'CODEX_API_KEY env var';
  if (process.env.OPENAI_API_KEY) return 'OPENAI_API_KEY env var';
  if (hasAuthFile()) return 'OAuth login (ChatGPT)';
  return null;
}

async function showDiagnostics(out = process.stderr) {
  const w = (s) => out.write(s + '\n');
  w('');
  w('=== Diagnostics ===');
  const bin = which('codex');
  if (!bin) {
    w('codex CLI: NOT INSTALLED');
    w('  Install with: npm install -g @openai/codex');
    return;
  }
  const { stdout } = await run(bin, ['--version'], { text: '' });
  const m = stdout.match(/[0-9]+\.[0-9]+\.[0-9]+/);
  const version = m ? m[0] : 'unknown';
  w(`codex CLI: v${version} (at ${bin})`);
  w(`  Min required: v${MIN_VERSION}`);
  if (version !== 'unknown' && !versionGte(version, MIN_VERSION)) {
    w('  WARNING: Version too old! Run: npm install -g @openai/codex@latest');
  }
  w('');
  w('Authentication:');
  w(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'set' : 'not set'}`);
  w(`  CODEX_API_KEY: ${process.env.CODEX_API_KEY ? 'set' : 'not set'}`);
  w(`  OAuth login: ${authFile} (${hasAuthFile() ? 'exists' : 'missing'})`);
  w('');
  w('Effective auth:');
  w(`  ${effectiveAuth() || "NONE - run 'codex login' to authenticate"}`);
}

// --- Parse flags -----------------------------------------------------------

let model = process.env.CODEX_MODEL || '';
let resume = process.env.CODEX_SESSION || '';
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
  if (a === '--') { i++; break; }
  break;
}
const rest = argv.slice(i);

if (showVersion) {
  process.stdout.write('codex-agent wrapper (node)\n');
  process.stdout.write(`node: ${process.version} on ${process.platform}\n`);
  await showDiagnostics(process.stdout);
  process.exit(0);
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
  if (promptText.trim() === '') {
    fail('no prompt: stdin was empty. Pass a prompt as arguments or set PROMPT_FILE.');
  }
} else {
  process.stderr.write('Usage: codex-agent [--model <model>] [--resume latest|<UUID>] <prompt>\n');
  process.stderr.write('       codex-agent --version\n');
  process.stderr.write('       PROMPT_FILE=task.md codex-agent\n');
  process.stderr.write('       cat task.md | codex-agent\n');
  process.exit(1);
}

const codexBin = which('codex');
if (!codexBin) {
  process.stderr.write('Error: codex command not found. Install with: npm install -g @openai/codex\n');
  await showDiagnostics();
  process.exit(1);
}

if (!effectiveAuth()) {
  process.stderr.write('Error: No authentication configured.\n');
  await showDiagnostics();
  process.exit(1);
}

// --- Build the command -----------------------------------------------------
// The trailing "-" tells codex to read the prompt from stdin.

let args;
if (resume) {
  args = ['exec', 'resume', '--dangerously-bypass-approvals-and-sandbox'];
  if (model) args.push('-m', model);
  if (resume === 'latest') args.push('--last');
  else args.push(resume);
  args.push('-');
} else {
  args = ['exec', '--dangerously-bypass-approvals-and-sandbox', '--skip-git-repo-check'];
  if (model) args.push('-m', model);
  args.push('-');
}

// --- Persistent output file (survives task cleanup) ------------------------

const outputDir = process.env.AGENT_LOG_DIR || path.join(os.tmpdir(), 'agentic-coding-tools');
mkdirSync(outputDir, { recursive: true, mode: 0o700 });
const stamp = `${Math.floor(Date.now() / 1000)}-${process.pid}`;
const outputFile = path.join(outputDir, `codex-agent-${stamp}.log`);
process.stderr.write(`[output_file: ${outputFile}]\n`);

// --- Run -------------------------------------------------------------------
// stdout and stderr are captured SEPARATELY. In codex >= ~0.100 the final agent
// message goes to stdout while the header, transcript replay and "tokens used"
// footer go to stderr. Merging them made the reply and the footer interleave
// nondeterministically, so scraping the reply back out sometimes came up empty.

const input = promptFile ? { file: promptFile } : { text: promptText };
const { code, stdout, stderr } = await run(codexBin, args, input);

// Strip CR so line anchors still match output from a native-Windows codex build.
const response = stdout.replace(/\r/g, '');
const stderrContent = stderr.replace(/\r/g, '');

if (code !== 0) {
  process.stderr.write(stderrContent);
  await showDiagnostics();
  process.exit(code);
}

// Session id lives in the stderr header ("session id: <uuid>"). Search stdout
// too in case an older codex build emits the header there. A plain JS regex
// replaces `grep -oP ... \K`, which BSD/macOS grep cannot run at all.
const sidMatch = `${stderrContent}\n${response}`.match(/session id:\s*([0-9A-Fa-f-]+)/);
const sessionId = sidMatch ? sidMatch[1] : '';

// stdout is normally already the clean final reply. Only fall back to scraping
// if this codex build dumped its footer onto stdout (legacy all-on-stdout
// format), detected by a standalone "tokens used" line appearing in stdout.
let cleanOutput;
if (/^tokens used$/m.test(response)) {
  const lines = response.split('\n');
  const start = lines.findIndex((l) => l === 'tokens used');
  cleanOutput = lines
    .slice(start + 1)
    .filter((l) => !/^[0-9,]+$/.test(l)) // skip the token-count number
    .join('\n');
} else {
  cleanOutput = response;
}

// Last resort: if we somehow ended up empty, surface stderr so nothing is lost.
if (cleanOutput.trim() === '') cleanOutput = stderrContent;

// Trim trailing newlines so the separator before [session_id:] is exactly one
// blank line, matching claude-agent byte for byte. fusionthink parses these.
cleanOutput = cleanOutput.replace(/\s+$/, '');

const body = sessionId ? `${cleanOutput}\n\n[session_id: ${sessionId}]\n` : `${cleanOutput}\n`;
process.stdout.write(body);
try {
  writeFileSync(outputFile, body, 'utf8');
} catch (err) {
  process.stderr.write(`Warning: could not write ${outputFile}: ${err.message}\n`);
}

// Explicit success. The bash version ended on a conditional whose false branch
// made a fully successful run exit 1 whenever the session id was missing.
process.exit(0);
