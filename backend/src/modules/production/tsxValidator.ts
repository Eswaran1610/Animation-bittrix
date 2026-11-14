import path from 'path';
import { existsSync } from 'fs';
import { transform } from 'esbuild';
import { projectPaths } from '../../config/paths.js';

export interface TsxValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const FORBIDDEN_PATTERNS = [
  /\bprocess\.(?:env|exit|kill|argv|cwd)\b/,
  /\bchild_process\b/,
  /\beval\s*\(/,
  /\bFunction\s*\(/,
  /\bglobalThis\b/,
  /\b__dirname\b/,
  /\b__filename\b/,
  /\bwindow\.(?:location|localStorage|sessionStorage|indexedDB)\b/,
  /\bdocument\.(?:cookie|location)\b/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bWorker\b/,
  /\bimport\s*\(/,
  /\b(?:setTimeout|setInterval|requestAnimationFrame)\s*\(/,
  /\bnode:/,
  /\bfrom\s+['"]fs['"]/,
  /\bfrom\s+['"]net['"]/,
  /\bfrom\s+['"]http['"]/,
  /\bfrom\s+['"]https['"]/,
];

const ALLOWED_MODULE_PREFIXES = [
  'react',
  'remotion',
  '@remotion/',
  'lucide-react',
  'three',
  '@react-three/',
  './',
  '../',
];

export class TsxValidator {
  async validate(tsxSource: string, options?: { maxFrames?: number; fps?: number }): Promise<TsxValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!tsxSource || typeof tsxSource !== 'string' || tsxSource.trim().length === 0) {
      return { valid: false, errors: ['Generated TSX source code is empty.'], warnings };
    }

    if (tsxSource.length > 250_000) {
      errors.push(`Generated TSX source is excessively large (${tsxSource.length} bytes, limit: 250,000 bytes).`);
    }

    // 1. Security & Forbidden Sandbox API check
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(tsxSource)) {
        errors.push(`TSX contains forbidden runtime or platform access matching pattern: ${pattern.toString()}`);
      }
    }

    // 2. Import allowlist and real disk resolution check
    const importRegex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(tsxSource)) !== null) {
      const moduleName = match[1];
      const isAllowed = ALLOWED_MODULE_PREFIXES.some((prefix) =>
        moduleName === prefix || moduleName.startsWith(prefix)
      );
      if (!isAllowed) {
        errors.push(`Module import "${moduleName}" is not allowed in generated Remotion TSX.`);
        continue;
      }

      // If it's a relative path, verify it physically resolves on disk
      if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
        const candidates = [
          path.resolve(projectPaths.remotionRoot, 'src', moduleName),
          path.resolve(projectPaths.remotionRoot, 'src/projects/sample', moduleName),
          path.resolve(projectPaths.remotionRoot, 'src', moduleName.replace(/^\.\.\/\.\.\//, './')),
          path.resolve(projectPaths.remotionRoot, 'src', moduleName.replace(/^\.\//, '../../')),
        ];
        const extensions = ['', '.tsx', '.ts', '.jsx', '.js', '/index.ts', '/index.tsx'];
        const resolved = candidates.some((base) => extensions.some((ext) => existsSync(base + ext)));
        if (!resolved) {
          errors.push(`Relative import "${moduleName}" could not be resolved to any existing component or file on disk.`);
        }
      }
    }

    // 3. Export validation: must export a default component or GeneratedCliVideo
    const hasDefaultExport = /export\s+default\s+(?:function|class|const|let|var)?\s*\w*/.test(tsxSource);
    const hasNamedGeneratedCliVideo = /export\s+(?:const|function)\s+GeneratedCliVideo\b/.test(tsxSource);
    if (!hasDefaultExport && !hasNamedGeneratedCliVideo) {
      errors.push('TSX must have a default export or export GeneratedCliVideo as a React component.');
    }

    // 4. In-memory TypeScript & JSX syntax compilation check via esbuild
    try {
      await transform(tsxSource, {
        loader: 'tsx',
        target: 'es2022',
        jsx: 'automatic',
        sourcemap: false,
      });
    } catch (syntaxErr: any) {
      const msg = syntaxErr.errors?.[0]?.text || syntaxErr.message || 'Syntax/Type compilation error';
      const line = syntaxErr.errors?.[0]?.location?.line;
      const column = syntaxErr.errors?.[0]?.location?.column;
      const loc = line ? ` (line ${line}, col ${column})` : '';
      errors.push(`TSX syntax/compilation failed${loc}: ${msg}`);
    }

    // 5. Deterministic Remotion animation conventions
    if (!tsxSource.includes('useCurrentFrame') && !tsxSource.includes('MainVideo')) {
      warnings.push('TSX does not directly call useCurrentFrame(). Ensure animation is deterministic.');
    }

    // 6. Anti-Placeholder and Anti-Meta-Clutter check (Corrections 2 & 8)
    const FORBIDDEN_TEXT_PATTERNS = [
      /\bplaceholder\b/i,
      /\blorem\s+ipsum\b/i,
      /\bready\s+to\s+render\b/i,
      /\bscene\s+\d+\s+placeholder\b/i,
      /\bRemotion\.init\b/i,
      /~\/pipeline\//i,
      /\bengine\.render\b/i,
      /\bCORE\s+ARCHITECTURE\b/i,
      /\bCORE\s+EXPLAINER\b/i,
    ];

    for (const pattern of FORBIDDEN_TEXT_PATTERNS) {
      if (pattern.test(tsxSource)) {
        errors.push(`TSX contains forbidden placeholder or pipeline meta-clutter text matching: ${pattern.toString()}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateScenePlan(scenes: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!Array.isArray(scenes) || scenes.length === 0) {
      return { valid: false, errors: ['Scene plan must be a non-empty array of scenes.'] };
    }

    let repeatCount = 1;
    let lastVisualType = '';

    scenes.forEach((scene, index) => {
      const vType = scene.visual_type || scene.template || 'callout';
      if (vType === lastVisualType) {
        repeatCount++;
        if (repeatCount >= 3) {
          errors.push(`Visual type "${vType}" is repeated across 3 consecutive scenes (scenes ${index - 1}, ${index}, ${index + 1}). Vary the visual idea per sentence.`);
        }
      } else {
        repeatCount = 1;
        lastVisualType = vType;
      }

      // Check for placeholder or tool words
      const text = `${scene.narration || ''} ${scene.on_screen_text || ''} ${JSON.stringify(scene.nodes || [])}`;
      if (/\b(?:placeholder|lorem\s+ipsum|ready\s+to\s+render|todo:)\b/i.test(text)) {
        errors.push(`Scene ${index + 1} contains placeholder text.`);
      }
      if (/\b(?:Remotion\.init|~\/pipeline\/|engine\.render)\b/i.test(text)) {
        errors.push(`Scene ${index + 1} contains pipeline or tool meta-clutter.`);
      }

      // Check that stat-counter has a source url
      if (vType === 'stat-counter' && scene.stat_value && !scene.source_url) {
        errors.push(`Scene ${index + 1} has a numerical statistic "${scene.stat_value}" without a verified source_url.`);
      }
    });

    return { valid: errors.length === 0, errors };
  }
}

export const tsxValidator = new TsxValidator();
