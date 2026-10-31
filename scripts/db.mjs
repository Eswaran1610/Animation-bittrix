import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const databaseDirectory = path.join(repositoryRoot, 'database');
const pgDataDirectory = path.join(databaseDirectory, 'pgdata');
const port = Number(process.env.PGPORT || 5434);
const host = process.env.PGHOST || '127.0.0.1';

function commandAvailable(command, args = ['--version']) {
  const result = spawnSync(command, args, { stdio: 'ignore', windowsHide: true });
  return !result.error && result.status === 0;
}

function dockerComposeAvailable() {
  return commandAvailable('docker', ['compose', 'version']);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      stdio: 'inherit',
      windowsHide: true,
      ...options,
    });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

function portIsOpen() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function start() {
  if (await portIsOpen()) {
    console.log(`PostgreSQL is already reachable at ${host}:${port}.`);
    return;
  }

  if (dockerComposeAvailable()) {
    await run('docker', ['compose', '-f', path.join(repositoryRoot, 'docker-compose.yml'), 'up', '-d', 'postgres']);
    console.log(`PostgreSQL started through Docker on port ${port}.`);
    return;
  }

  if (commandAvailable('pg_ctl') && existsSync(pgDataDirectory)) {
    await run('pg_ctl', [
      '-D', pgDataDirectory,
      '-o', `-p ${port} -k ${os.tmpdir()}`,
      '-l', path.join(databaseDirectory, 'postgres.log'),
      'start',
    ]);
    console.log(`PostgreSQL started natively on port ${port}.`);
    return;
  }

  throw new Error('PostgreSQL is unavailable. Install Docker Desktop (recommended) or install PostgreSQL and initialize database/pgdata.');
}

async function stop() {
  if (dockerComposeAvailable()) {
    await run('docker', ['compose', '-f', path.join(repositoryRoot, 'docker-compose.yml'), 'stop', 'postgres']).catch(() => undefined);
  }
  if (commandAvailable('pg_ctl') && existsSync(pgDataDirectory)) {
    await run('pg_ctl', ['-D', pgDataDirectory, 'stop']).catch(() => undefined);
  }
  console.log('PostgreSQL stop requested.');
}

async function status() {
  console.log((await portIsOpen()) ? `PostgreSQL is reachable at ${host}:${port}.` : `No PostgreSQL service is reachable at ${host}:${port}.`);
}

const action = process.argv[2] || 'status';
if (action === 'start') await start();
else if (action === 'stop') await stop();
else if (action === 'status') await status();
else throw new Error(`Unknown database action: ${action}`);
