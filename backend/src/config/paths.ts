import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = path.resolve(configDirectory, '../../..');
const backendDirectory = path.join(defaultProjectRoot, 'backend');

// Load the backend-local environment regardless of the directory used to start Node.
dotenv.config({ path: path.join(backendDirectory, '.env') });

const configuredRoot = process.env.PROJECT_ROOT
  ? path.resolve(defaultProjectRoot, process.env.PROJECT_ROOT)
  : defaultProjectRoot;
const configuredBackendDirectory = path.join(configuredRoot, 'backend');
const configuredMediaDirectory = process.env.MEDIA_DIR
  ? path.resolve(configuredBackendDirectory, process.env.MEDIA_DIR)
  : path.join(configuredBackendDirectory, 'media');

export const projectPaths = {
  root: configuredRoot,
  backendMedia: configuredMediaDirectory,
  remotionRoot: path.join(configuredRoot, 'remotion'),
  remotionPublic: path.join(configuredRoot, 'remotion', 'public'),
  renderDataDir: path.join(configuredMediaDirectory, 'render-data'),
  renderData(projectId: string, renderType: 'preview' | 'final', version: number) {
    return path.join(this.renderDataDir, `${projectId}_${renderType}_v${version}.json`);
  },
};
