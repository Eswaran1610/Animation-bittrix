import manifest from './modelLibrary.json';

export interface ModelLibraryEntry {
  /** The exact node name exported inside the shared GLB. */
  node: string;
  scale?: number;
  rotation?: [number, number, number];
}

export const MODEL_LIBRARY_FILE = manifest.library_file;
export const MODEL_LIBRARY = manifest.models as Record<string, ModelLibraryEntry>;

export const getModelLibraryEntry = (modelId: string | undefined): ModelLibraryEntry | undefined => {
  if (!modelId) return undefined;
  return MODEL_LIBRARY[modelId];
};
