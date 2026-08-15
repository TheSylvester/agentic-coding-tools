#!/usr/bin/env node
/**
 * Installer for the agentic-coding-tools skills.
 *
 *   npx github:TheSylvester/agentic-coding-tools            # all skills, user scope
 *   npx github:TheSylvester/agentic-coding-tools handoff    # just one
 *   npx github:TheSylvester/agentic-coding-tools --project  # into ./.claude/skills
 *
 * Zero dependencies, Node 18+, works the same on Linux, macOS, WSL and Windows.
 *
 * Skill bodies ship with the default path `~/.claude/skills/...` in their
 * example commands, which is correct for a hand-copied install. When you
 * install somewhere else — or on Windows, where `~` does not expand in
 * PowerShell or cmd — the installer rewrites that prefix to the real absolute
 * install directory, so every command in the installed SKILL.md is runnable
 * as written.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(REPO_ROOT, 'skills');
const DEFAULT_PREFIX = '~/.claude/skills';

if (Number(process.versions.node.split('.')[0]) < 18) {
  console.error(`Error: node 18+ required (found ${process.versions.node}).`);
  process.exit(1);
}

// --- Parse arguments -------------------------------------------------------

const argv = process.argv.slice(2);
const opts = { force: false, dryRun: false, list: false, help: false, dir: '', project: false };
const requested = [];

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--force' || a === '-f') opts.force = true;
  else if (a === '--dry-run' || a === '-n') opts.dryRun = true;
  else if (a === '--list' || a === '-l') opts.list = true;
  else if (a === '--help' || a === '-h') opts.help = true;
  else if (a === '--project' || a === '-p') opts.project = true;
  else if (a === '--dir' || a === '-d') {
    if (i + 1 >= argv.length) {
      console.error('Error: --dir requires a path');
      process.exit(2);
    }
    opts.dir = argv[++i];
  } else if (a.startsWith('-')) {
    console.error(`Error: unknown flag ${a} (try --help)`);
    process.exit(2);
  } else requested.push(a);
}

function available() {
  if (!existsSync(SOURCE_DIR)) return [];
  return readdirSync(SOURCE_DIR)
    .filter((n) => existsSync(path.join(SOURCE_DIR, n, 'SKILL.md')))
    .sort();
}

function describe(name) {
  try {
    const text = readFileSync(path.join(SOURCE_DIR, name, 'SKILL.md'), 'utf8');
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) return '';
    // Grab `description:` including simple YAML folded/multiline forms.
    const m = fm[1].match(/^description:\s*(.*)$/m);
    if (!m) return '';
    let value = m[1].trim();
    if (value === '>' || value === '|' || value === '>-' || value === '|-') {
      const after = fm[1].slice(fm[1].indexOf(m[0]) + m[0].length);
      value = after.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join(' ');
    }
    value = value.replace(/^["']|["']$/g, '');
    return value.length > 100 ? value.slice(0, 97) + '...' : value;
  } catch {
    return '';
  }
}

if (opts.help) {
  console.log(`
agentic-coding-tools installer

Usage:
  npx github:TheSylvester/agentic-coding-tools [skills...] [options]

Options:
  -l, --list        List the available skills and exit
  -p, --project     Install into ./.claude/skills instead of your home directory
  -d, --dir <path>  Install into an explicit directory
  -f, --force       Overwrite skills that are already installed
  -n, --dry-run     Show what would happen, change nothing
  -h, --help        Show this message

With no skill names, every skill is installed.
Default target: ${DEFAULT_PREFIX}
`);
  process.exit(0);
}

if (opts.list) {
  console.log('Available skills:\n');
  for (const name of available()) {
    const d = describe(name);
    console.log(`  ${name.padEnd(16)} ${d}`);
  }
  console.log('');
  process.exit(0);
}

// --- Work out the target directory ----------------------------------------

let targetDir;
if (opts.dir) targetDir = path.resolve(opts.dir);
else if (opts.project) targetDir = path.resolve(process.cwd(), '.claude', 'skills');
else targetDir = path.join(os.homedir(), '.claude', 'skills');

const all = available();
if (all.length === 0) {
  console.error(`Error: no skills found in ${SOURCE_DIR}`);
  process.exit(1);
}

const unknown = requested.filter((n) => !all.includes(n));
if (unknown.length) {
  console.error(`Error: unknown skill(s): ${unknown.join(', ')}`);
  console.error(`Available: ${all.join(', ')}`);
  process.exit(2);
}

const selected = requested.length ? requested : all;

// --- Install ---------------------------------------------------------------

/**
 * Rewrite the documented default path prefix to the real install directory.
 * Forward slashes are used even on Windows: node, PowerShell and cmd all accept
 * them inside a quoted path, and they avoid backslash escaping in markdown.
 */
function bakePaths(skillDir, installRoot) {
  const rootForDocs = installRoot.split(path.sep).join('/');
  if (rootForDocs === DEFAULT_PREFIX) return;

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const before = readFileSync(p, 'utf8');
        const after = before.split(DEFAULT_PREFIX).join(rootForDocs);
        if (after !== before) writeFileSync(p, after, 'utf8');
      }
    }
  };
  walk(skillDir);
}

console.log(`\nInstalling into ${targetDir}\n`);

let installed = 0;
let skipped = 0;

for (const name of selected) {
  const src = path.join(SOURCE_DIR, name);
  const dest = path.join(targetDir, name);
  const exists = existsSync(dest);

  if (exists && !opts.force) {
    console.log(`  skip     ${name}  (already installed - use --force to overwrite)`);
    skipped++;
    continue;
  }

  if (opts.dryRun) {
    console.log(`  ${exists ? 'replace' : 'install'}  ${name}  (dry run)`);
    installed++;
    continue;
  }

  try {
    if (exists) {
      if (!statSync(dest).isDirectory()) {
        console.log(`  skip     ${name}  (${dest} exists and is not a directory)`);
        skipped++;
        continue;
      }
      rmSync(dest, { recursive: true, force: true });
    }
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
    bakePaths(dest, targetDir);
    console.log(`  ${exists ? 'replace' : 'install'}  ${name}`);
    installed++;
  } catch (err) {
    console.error(`  FAILED   ${name}: ${err.message}`);
    skipped++;
  }
}

console.log(
  `\n${opts.dryRun ? 'Would install' : 'Installed'} ${installed} skill(s)` +
    (skipped ? `, skipped ${skipped}` : '') +
    `.\n`
);

if (!opts.dryRun && installed > 0) {
  const needCli = selected.some((n) => n === 'claude-agent' || n === 'codex-agent' || n === 'fusionthink');
  if (needCli) {
    console.log('These skills shell out to vendor CLIs. Install what you plan to use:');
    if (selected.includes('claude-agent') || selected.includes('fusionthink')) {
      console.log('  npm install -g @anthropic-ai/claude-code');
    }
    if (selected.includes('codex-agent') || selected.includes('fusionthink')) {
      console.log('  npm install -g @openai/codex   &&   codex login');
    }
    console.log('');
  }
  console.log('Restart Claude Code (or run /reload) to pick up the new skills.\n');
}
