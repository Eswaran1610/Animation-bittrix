import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const isWindows = process.platform === 'win32';
const python = isWindows ? 'python' : 'python3';
const environment = path.join(root, '.venv-motion-checks');
const environmentPython = path.join(environment, isWindows ? 'Scripts/python.exe' : 'bin/python');
const requirements = path.join(root, 'scripts', 'motion-checks-requirements.txt');

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with code ${result.status}`);
};

if (!existsSync(environmentPython)) {
  console.log('Creating local motion-validation environment…');
  run(python, ['-m', 'venv', '--system-site-packages', environment]);
}
console.log('Installing motion-validation dependencies…');
run(environmentPython, ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', requirements]);
console.log('Motion validation is ready.');
