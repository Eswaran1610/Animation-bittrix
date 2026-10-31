import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const remotionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(remotionRoot, 'node_modules', '.bin', 'remotion');
const command = process.argv[2];
const userArgs = process.argv.slice(3);

if (!command) {
  console.error('Usage: npm run compositions:host | npm run render:host');
  process.exit(1);
}

const hasFlag = (name) => userArgs.some((arg) => arg === name || arg.startsWith(`${name}=`));
const findBrowser = () => {
  const configured = process.env.REMOTION_BROWSER_EXECUTABLE;
  if (configured && fs.existsSync(configured)) return configured;
  for (const candidate of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable']) {
    if (fs.existsSync(candidate)) return candidate;
  }
  try {
    return execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim() || undefined;
  } catch {
    return undefined;
  }
};

const args = [...userArgs];
if (['compositions', 'render', 'preview'].includes(command) && !hasFlag('--port')) {
  args.push('--port', process.env.REMOTION_PORT || '3000');
}
if (['compositions', 'render', 'preview'].includes(command) && !hasFlag('--chrome-mode')) {
  args.push('--chrome-mode', process.env.REMOTION_CHROME_MODE || 'headless-shell');
}
const browser = findBrowser();
if (browser && !hasFlag('--browser-executable')) args.push('--browser-executable', browser);

const child = spawn(cli, [command, ...args], { cwd: remotionRoot, stdio: 'inherit', env: process.env });
child.on('error', (error) => {
  console.error(`Unable to start Remotion CLI: ${error.message}`);
  process.exit(1);
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
