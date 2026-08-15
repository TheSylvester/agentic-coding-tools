#!/usr/bin/env node
/**
 * claude-monitor.mjs — liveness monitor for a `claude -p` stream-json run.
 *
 * Two ways to use it:
 *
 *   1. As a module (how claude-agent.mjs uses it — no pipes, no `tee`):
 *        import { createMonitor } from './claude-monitor.mjs';
 *        const mon = createMonitor();
 *        mon.line(rawNdjsonLine);   // for every line
 *        mon.close();               // when the stream ends
 *
 *   2. As a standalone filter, reading NDJSON on stdin:
 *        claude -p --output-format stream-json ... | node claude-monitor.mjs
 *        node claude-monitor.mjs < sample.ndjson
 *
 * Status lines go to stderr so they never contaminate the reply on stdout.
 *
 * KEY INSIGHT (empirically established, claude 2.1.178):
 *   The token stream is silent during tool execution, BUT for Bash/agent tools
 *   the stream brackets the opaque gap with:
 *     system/task_started      (carries tool_use_id, task_type, description)
 *     system/task_notification (status:"completed", same task_id/tool_use_id)
 *   So a stall inside a *bracketed* tool is detectable: we are legitimately BUSY
 *   between task_started and its matching task_notification, regardless of how
 *   long the silence lasts (up to the tool's own runtime). We only flag a stall
 *   if (a) we're in a bracketed tool past TOOL_HARD_STALL, or (b) we're in any
 *   other phase silent past that phase's threshold with no boundary event.
 *
 * Phases:
 *   init            — before first assistant token
 *   thinking        — assistant text/thinking/tool-arg deltas streaming
 *   tool:<name>     — between task_started and matching task_notification
 *   tool-dispatch   — assistant emitted tool_use (message_stop) but task_started
 *                     not yet seen (the ~ttft_ms lead, normally ~3s)
 *   idle-between    — tool finished (task_notification / tool_result), waiting
 *                     for next assistant message
 *   hook:<name>     — a hook is running (system/hook_started w/o hook_response)
 *   done            — result event seen
 */

import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

const TICK_MS = 3000; // heartbeat print cadence

// Per-phase silence thresholds (ms) after which we DECLARE A STALL.
// Justification from measured timing (8s & 15s sleep runs, claude 2.1.178):
//   - thinking deltas arrive sub-second to ~1s apart while generating; a true
//     generation stall would mean >~30s with no delta and no boundary -> STALL.
//   - tool-dispatch lead (message_stop -> task_started) measured ~3s (== ttft_ms);
//     allow generous 30s before suspecting the dispatch itself wedged.
//   - tool:<name> (bracketed): silence is EXPECTED for the tool's full runtime.
//     We do not stall on silence alone; we stall only past a hard ceiling
//     (TOOL_HARD_STALL) since even bracketed tools shouldn't run forever
//     unbounded for a monitor's purposes. Tune to the longest legit tool you run.
//   - idle-between: next message_start measured ~1.8-5.7s after tool_result;
//     30s with nothing -> STALL.
//   - hook:<name>: a slow Stop hook was measured ~9.9s; allow 60s.
const STALL_MS = {
  init: 60000,
  thinking: 30000,
  'tool-dispatch': 30000,
  'idle-between': 30000,
  hook: 60000,
};
const TOOL_HARD_STALL = 600000; // 10 min ceiling for a single bracketed tool

/**
 * Create a monitor instance. Feed it raw NDJSON lines; it prints phase and
 * liveness transitions to stderr.
 *
 * @param {object} [opts]
 * @param {(msg: string) => void} [opts.write] Where status lines go (default stderr).
 * @param {number} [opts.tickMs] Heartbeat cadence.
 */
export function createMonitor(opts = {}) {
  const write = opts.write || ((msg) => process.stderr.write(msg + '\n'));
  const tickMs = opts.tickMs ?? TICK_MS;

  let phase = 'init';
  let phaseLabel = 'init';
  let phaseStart = Date.now();
  let lastLine = Date.now();
  const activeTools = new Map(); // tool_use_id -> name (bracketed, running)
  const activeHooks = new Map(); // hook_id -> name
  let t0 = Date.now();
  let stalled = false;
  let closed = false;

  const tplus = () => '+' + Math.round((Date.now() - t0) / 1000) + 's';
  const elapsedPhase = () => Math.round((Date.now() - phaseStart) / 1000);

  function classify() {
    if (phase === 'tool') return 'BUSY (running tool)';
    if (phase === 'thinking') return 'BUSY (generating)';
    if (phase === 'tool-dispatch') return 'BUSY (dispatching tool)';
    if (phase === 'hook') return 'BUSY (hook)';
    if (phase === 'idle-between') return 'IDLE (between tool rounds)';
    if (phase === 'done') return 'DONE';
    return 'STARTING';
  }

  function thresholdFor() {
    if (phase === 'tool') return TOOL_HARD_STALL;
    if (phase === 'hook') return STALL_MS.hook;
    return STALL_MS[phaseLabel] ?? STALL_MS[phase] ?? 30000;
  }

  function emit(reason) {
    const sinceLine = Math.round((Date.now() - lastLine) / 1000);
    const status = stalled ? 'STALLED!!' : classify();
    // ASCII only: an em dash renders as mojibake when stderr is redirected
    // under a legacy Windows console code page, which is the normal case here.
    write(
      `[t${tplus()}] phase=${phaseLabel} elapsed_in_phase=${elapsedPhase()}s ` +
        `silent_for=${sinceLine}s - ${status}` +
        (reason === 'TICK' ? '' : ` (${reason})`)
    );
  }

  function setPhase(p, label) {
    if (p !== phase || label !== phaseLabel) {
      phase = p;
      phaseLabel = label || p;
      phaseStart = Date.now();
      stalled = false;
      emit('PHASE');
    }
  }

  // Heartbeat + stall detection. unref() so a live timer never keeps the
  // process alive past the run itself.
  const timer = setInterval(() => {
    if (phase === 'done' || closed) return;
    const silentMs = Date.now() - lastLine;
    const wasStalled = stalled;
    // A bracketed tool is BUSY no matter the silence (until hard ceiling).
    if (silentMs > thresholdFor()) stalled = true;
    if (stalled && !wasStalled) emit('STALL-DETECTED');
    else emit('TICK');
  }, tickMs);
  timer.unref?.();

  function handle(obj) {
    lastLine = Date.now();
    if (stalled) stalled = false; // any line clears a prior stall flag
    const type = obj.type;

    if (type === 'system') {
      const st = obj.subtype;
      if (st === 'init') {
        t0 = Date.now();
        setPhase('init', 'init');
        return;
      }
      if (st === 'task_started') {
        activeTools.set(obj.tool_use_id, obj.task_type || 'tool');
        setPhase('tool', 'tool:' + (obj.task_type || obj.description || 'tool'));
        return;
      }
      if (st === 'task_notification' && obj.status === 'completed') {
        activeTools.delete(obj.tool_use_id);
        if (activeTools.size === 0) setPhase('idle-between', 'idle-between');
        return;
      }
      if (st === 'hook_started') {
        activeHooks.set(obj.hook_id, obj.hook_name || obj.hook_event || 'hook');
        setPhase('hook', 'hook:' + (obj.hook_name || obj.hook_event || 'hook'));
        return;
      }
      if (st === 'hook_response') {
        activeHooks.delete(obj.hook_id);
        if (activeHooks.size === 0 && phase === 'hook') {
          setPhase('idle-between', 'idle-between');
        }
        return;
      }
      // status / task_notification(other) — just a liveness heartbeat
      return;
    }

    if (type === 'stream_event') {
      const e = obj.event || {};
      if (
        e.type === 'content_block_delta' ||
        e.type === 'content_block_start' ||
        e.type === 'message_start'
      ) {
        // assistant is producing tokens (text, thinking, or tool-arg json)
        if (activeTools.size === 0 && activeHooks.size === 0) {
          setPhase('thinking', 'thinking');
        }
        return;
      }
      if (e.type === 'message_stop') {
        // assistant turn ended. If a tool_use was the last block, we now wait
        // for task_started (the ~ttft lead). Mark tool-dispatch unless already
        // inside a tool.
        if (activeTools.size === 0 && activeHooks.size === 0) {
          setPhase('tool-dispatch', 'tool-dispatch');
        }
        return;
      }
      return;
    }

    if (type === 'assistant') return; // consolidated; deltas already handled
    if (type === 'user') {
      // tool_result delivered
      if (activeTools.size === 0) setPhase('idle-between', 'idle-between');
      return;
    }
    if (type === 'rate_limit_event') return;

    if (type === 'result') {
      setPhase('done', 'done');
      write(
        `[t${tplus()}] RESULT subtype=${obj.subtype} is_error=${obj.is_error} ` +
          `session_id=${obj.session_id} num_turns=${obj.num_turns} ` +
          `duration_ms=${obj.duration_ms} total_cost_usd=${obj.total_cost_usd}`
      );
      return;
    }
  }

  return {
    /** Feed one raw NDJSON line. Non-JSON lines are ignored. */
    line(raw) {
      const s = String(raw).trim();
      if (!s) return;
      let obj;
      try {
        obj = JSON.parse(s);
      } catch {
        return;
      }
      handle(obj);
    },
    /** Stop the heartbeat and report if the stream died before `done`. */
    close() {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      if (phase !== 'done') emit('STREAM-CLOSED');
    },
    get phase() {
      return phaseLabel;
    },
  };
}

// --- Standalone mode: read NDJSON from stdin -------------------------------
// Only runs when this file is executed directly, never when imported.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const monitor = createMonitor();
  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => monitor.line(line));
  rl.on('close', () => {
    monitor.close();
    process.exit(0);
  });
}
