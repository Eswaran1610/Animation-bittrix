import os from 'os';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Dynamically resolves CLI executable paths across different environments,
 * office vs. home machines, and various user home directories.
 */
export function resolveCliBinary(name: 'claude' | 'agy' | string): string {
  const envVar = name === 'claude' ? 'CLAUDE_BIN' : name === 'agy' ? 'AGY_BIN' : undefined;
  if (envVar && process.env[envVar]) {
    return process.env[envVar]!;
  }

  const home = os.homedir();
  const candidates = [
    path.join(home, '.local', 'bin', name),
    path.join(home, '.local', 'npm', 'bin', name),
    path.join('/usr', 'local', 'bin', name),
    path.join('/usr', 'bin', name),
    path.join('/bin', name),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {}
    }
  }

  try {
    const stdout = execSync(`which ${name}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const trimmed = stdout.trim();
    if (trimmed) return trimmed;
  } catch {}

  return name;
}
