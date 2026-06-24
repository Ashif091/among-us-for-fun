/**
 * 🎮 Among Us Game - Full Launcher
 * Starts backend + frontend + Cloudflare tunnels
 * Run with: npm start  (from the root folder)
 */

const { spawn, execSync } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const SERVER_DIR = path.join(ROOT, 'server');
const CLIENT_DIR = path.join(ROOT, 'client');

// ── Colors ──────────────────────────────────────────────────────
const c = {
  reset:   '\x1b[0m',
  bright:  '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
};

function tag(label, color) {
  return `${color}${c.bright}[${label}]${c.reset}`;
}

function info(label, color, msg) {
  console.log(`${tag(label, color)} ${msg}`);
}

function banner(lines) {
  const width = 64;
  const bar = '═'.repeat(width);
  console.log(`\n${c.cyan}${c.bright}╔${bar}╗${c.reset}`);
  for (const { text, color } of lines) {
    const raw = text.replace(/\x1b\[[0-9;]*m/g, ''); // strip ansi for padding calc
    const pad = Math.max(0, width - 2 - raw.length);
    console.log(`${c.cyan}${c.bright}║  ${c.reset}${color || ''}${text}${c.reset}${' '.repeat(pad)}${c.cyan}${c.bright}║${c.reset}`);
  }
  console.log(`${c.cyan}${c.bright}╚${bar}╝${c.reset}\n`);
}

// ── Helpers ─────────────────────────────────────────────────────
function extractCloudflareUrl(text) {
  const m = text.match(/https:\/\/[a-z0-9][a-z0-9\-]+\.trycloudflare\.com/i);
  return m ? m[0] : null;
}

function waitForUrl(proc, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for Cloudflare URL (60s)')),
      timeoutMs
    );

    function check(data) {
      const url = extractCloudflareUrl(data.toString());
      if (url) {
        clearTimeout(timer);
        proc.stderr.removeListener('data', check);
        proc.stdout.removeListener('data', check);
        resolve(url);
      }
    }

    proc.stderr.on('data', check);
    proc.stdout.on('data', check);
  });
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function killPort(port) {
  try {
    // Windows: find and kill process using the port
    const result = execSync(
      `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %a`,
      { shell: 'cmd.exe', stdio: 'pipe' }
    );
  } catch (_) {
    // Port wasn't in use — that's fine
  }
}

// ── Process tracking ────────────────────────────────────────────
const procs = [];

function spawnProc(cmd, args, opts = {}) {
  const p = spawn(cmd, args, { shell: true, ...opts });
  procs.push(p);
  return p;
}

function killAll() {
  for (const p of procs) {
    try { p.kill('SIGTERM'); } catch (_) {}
  }
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.clear();
  console.log(`\n${c.cyan}${c.bright}  🎮  AMONG US — Full Stack Launcher${c.reset}\n`);

  // ── 0. Free ports ─────────────────────────────────────────────
  info('SETUP', c.yellow, 'Freeing ports 3001 and 5173...');
  killPort(3001);
  killPort(5173);
  await delay(1500);

  // ── 1. Start backend ──────────────────────────────────────────
  info('SERVER', c.blue, 'Starting NestJS backend on port 3001...');
  const server = spawnProc('npm', ['run', 'dev'], { cwd: SERVER_DIR });

  server.stdout.on('data', d =>
    process.stdout.write(`${tag('SERVER', c.blue)} ${c.dim}${d.toString().trimEnd()}${c.reset}\n`)
  );
  server.stderr.on('data', d =>
    process.stderr.write(`${tag('SERVER', c.blue)} ${c.dim}${d.toString().trimEnd()}${c.reset}\n`)
  );

  info('SETUP', c.yellow, 'Waiting 7s for server to boot...');
  await delay(7000);

  // ── 2. Cloudflare tunnel for backend ──────────────────────────
  info('TUNNEL', c.magenta, 'Opening Cloudflare tunnel → backend :3001 ...');
  const serverTunnel = spawnProc('cloudflared', ['tunnel', '--url', 'http://localhost:3001']);

  let backendUrl;
  try {
    backendUrl = await waitForUrl(serverTunnel);
    info('TUNNEL', c.green, `✅ Backend URL ready: ${c.bright}${backendUrl}${c.reset}`);
  } catch (e) {
    info('ERROR', c.red, `❌ ${e.message}`);
    info('HINT', c.yellow,
      'Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation'
    );
    killAll();
    process.exit(1);
  }

  // ── 3. Start frontend with injected backend URL ───────────────
  info('CLIENT', c.cyan, `Starting Vite frontend on :5173 ...`);
  info('CLIENT', c.cyan, `  VITE_SERVER_URL → ${backendUrl}`);

  const client = spawnProc('npm', ['run', 'dev'], {
    cwd: CLIENT_DIR,
    env: { ...process.env, VITE_SERVER_URL: backendUrl },
  });

  client.stdout.on('data', d =>
    process.stdout.write(`${tag('CLIENT', c.cyan)} ${c.dim}${d.toString().trimEnd()}${c.reset}\n`)
  );
  client.stderr.on('data', d =>
    process.stderr.write(`${tag('CLIENT', c.cyan)} ${c.dim}${d.toString().trimEnd()}${c.reset}\n`)
  );

  info('SETUP', c.yellow, 'Waiting 6s for client to boot...');
  await delay(6000);

  // ── 4. Cloudflare tunnel for frontend ─────────────────────────
  info('TUNNEL', c.magenta, 'Opening Cloudflare tunnel → frontend :5173 ...');
  const clientTunnel = spawnProc('cloudflared', ['tunnel', '--url', 'http://localhost:5173']);

  let frontendUrl;
  try {
    frontendUrl = await waitForUrl(clientTunnel);
    info('TUNNEL', c.green, `✅ Frontend URL ready: ${c.bright}${frontendUrl}${c.reset}`);
  } catch (e) {
    info('ERROR', c.red, `❌ ${e.message}`);
    killAll();
    process.exit(1);
  }

  // ── 5. Final summary banner ───────────────────────────────────
  banner([
    { text: '🎮  GAME IS LIVE!', color: c.bright + c.green },
    { text: '' },
    { text: `🌐  PLAY  →  ${frontendUrl}`, color: c.bright + c.green },
    { text: '' },
    { text: `⚙️   API   →  ${backendUrl}`, color: c.blue },
    { text: '' },
    { text: 'Share the 🌐 PLAY link with your friends!', color: c.yellow },
    { text: 'Press  Ctrl + C  to stop everything.', color: c.dim },
    { text: '' },
  ]);

  // ── 6. Graceful shutdown ──────────────────────────────────────
  process.on('SIGINT', () => {
    console.log(`\n${c.yellow}${c.bright}🛑 Shutting down all processes...${c.reset}`);
    killAll();
    setTimeout(() => process.exit(0), 1000);
  });

  process.on('SIGTERM', () => {
    killAll();
    process.exit(0);
  });
}

main().catch(err => {
  console.error(`\n${c.red}${c.bright}Fatal: ${err.message}${c.reset}`);
  killAll();
  process.exit(1);
});
