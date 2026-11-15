import path from 'path';
import { readFileSync } from 'fs';
import { projectPaths } from '../../config/paths.js';

/** One style of the claude-drawing skill (.agents/skills/claude-drawing/styles.json). */
export interface DrawingStyle {
  id: string;        // lib module name, e.g. "comic"
  name: string;
  label: string;
  module: string;    // relative to the skill dir, e.g. "lib/comic.py"
  cls: string;       // painter class, e.g. "ComicCover"
  example: string;   // quality-reference example script, relative to the skill dir
  summary: string;
}

export const drawingSkillDir = () => path.join(projectPaths.root, '.agents', 'skills', 'claude-drawing');

let cache: DrawingStyle[] | undefined;

export const listDrawingStyles = (): DrawingStyle[] => {
  if (!cache) {
    cache = JSON.parse(readFileSync(path.join(drawingSkillDir(), 'styles.json'), 'utf8')) as DrawingStyle[];
  }
  return cache;
};

export const getDrawingStyle = (id?: string | null): DrawingStyle | undefined =>
  id ? listDrawingStyles().find((s) => s.id === id) : undefined;
