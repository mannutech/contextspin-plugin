#!/usr/bin/env node
/**
 * ContextSpin MCP Server
 * Exposes the contextspin daemon and cache as MCP tools.
 * Runs as a stdio server — no external dependencies required.
 */

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { execSync, spawn } from 'child_process';
import readline from 'readline';

const HOME = homedir();
const CACHE_FILE = join(HOME, '.contextspin-cache.json');
const PID_FILE = join(HOME, '.contextspin', 'daemon.pid');

// ── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_snippets',
    description:
      'Get the current context snippets queued in the ContextSpin cache. ' +
      'These are the live snippets that appear in the Claude Code spinner/statusline ' +
      'while Claude is thinking.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_daemon_status',
    description:
      'Check whether the ContextSpin background daemon is running, when it last ' +
      'fetched data, and how many snippets are currently cached.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'start_daemon',
    description: 'Start the ContextSpin background polling daemon.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'stop_daemon',
    description: 'Stop the ContextSpin background polling daemon.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

// ── Tool implementations ─────────────────────────────────────────────────────

function getSnippets() {
  if (!existsSync(CACHE_FILE)) {
    return {
      snippets: [],
      message: 'Cache not found. Run `npx contextspin start` to begin fetching.',
    };
  }
  try {
    const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    return {
      snippets: cache.snippets ?? [],
      updatedAt: cache.updatedAt ?? null,
      count: (cache.snippets ?? []).length,
    };
  } catch {
    return { snippets: [], message: 'Cache file exists but could not be parsed.' };
  }
}

function getDaemonStatus() {
  if (!existsSync(PID_FILE)) {
    return { running: false, message: 'Daemon is not running (no PID file found).' };
  }
  const pid = readFileSync(PID_FILE, 'utf-8').trim();
  try {
    process.kill(parseInt(pid, 10), 0); // throws if process doesn't exist
    const cache = existsSync(CACHE_FILE)
      ? JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
      : null;
    return {
      running: true,
      pid: parseInt(pid, 10),
      lastUpdated: cache?.updatedAt ?? 'unknown',
      snippetCount: cache?.snippets?.length ?? 0,
    };
  } catch {
    return {
      running: false,
      message: `PID file exists (${pid}) but process is not running. Daemon may have crashed.`,
    };
  }
}

function startDaemon() {
  try {
    // Detach so it outlives this MCP server process
    const child = spawn('npx', ['contextspin', 'start', '--silent'], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    return { success: true, message: 'Daemon start command sent.' };
  } catch (e) {
    return { success: false, message: `Failed to start daemon: ${e.message}` };
  }
}

function stopDaemon() {
  try {
    execSync('npx contextspin stop', { stdio: 'ignore' });
    return { success: true, message: 'Daemon stopped.' };
  } catch (e) {
    return { success: false, message: `Failed to stop daemon: ${e.message}` };
  }
}

function dispatchTool(name) {
  switch (name) {
    case 'get_snippets':      return getSnippets();
    case 'get_daemon_status': return getDaemonStatus();
    case 'start_daemon':      return startDaemon();
    case 'stop_daemon':       return stopDaemon();
    default:                  return { error: `Unknown tool: ${name}` };
  }
}

// ── MCP stdio protocol ───────────────────────────────────────────────────────

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function handleMessage(msg) {
  switch (msg.method) {
    case 'initialize':
      send({
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'contextspin', version: '0.1.0' },
        },
      });
      break;

    case 'notifications/initialized':
      // No response needed
      break;

    case 'tools/list':
      send({ jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } });
      break;

    case 'tools/call': {
      const result = dispatchTool(msg.params?.name);
      send({
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
      });
      break;
    }

    default:
      if (msg.id !== undefined) {
        send({
          jsonrpc: '2.0',
          id: msg.id,
          error: { code: -32601, message: `Method not found: ${msg.method}` },
        });
      }
  }
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
let buffer = '';

rl.on('line', (line) => {
  buffer += line;
  try {
    const msg = JSON.parse(buffer);
    buffer = '';
    handleMessage(msg);
  } catch {
    // Incomplete JSON — keep buffering
  }
});
