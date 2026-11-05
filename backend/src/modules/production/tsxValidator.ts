import { transform } from 'esbuild';

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

    // 2. Import allowlist check
    const importRegex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(tsxSource)) !== null) {
      const moduleName = match[1];
      const isAllowed = ALLOWED_MODULE_PREFIXES.some((prefix) =>
        moduleName === prefix || moduleName.startsWith(prefix)
      );
      if (!isAllowed) {
        errors.push(`Module import "${moduleName}" is not allowed in generated Remotion TSX.`);
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

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const tsxValidator = new TsxValidator();
