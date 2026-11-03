export type RenderFailureTag = 'asset' | 'timeout' | 'gl' | 'memory' | 'audio-sync' | 'quality-gate' | 'props-invalid' | 'unknown';

const MAX_LOG_CHARS = 12000;

const tail = (value: unknown) => String(value || '').slice(-MAX_LOG_CHARS);

export const classifyRenderFailure = (error: unknown): RenderFailureTag => {
  const message = String((error as any)?.message || error || '').toLowerCase();
  if (/asset|image|model|glb|file does not exist|enoent|decode/.test(message)) return 'asset';
  if (/audio-sync|verify_sync|cue manifest|audible hit|dead-air/.test(message)) return 'audio-sync';
  if (/quality gate|quality-gate|text overflow|zone overlap|canvas bounds/.test(message)) return 'quality-gate';
  if (/props-invalid|invalid props|schema|preflight|scene plan|missing .*props/.test(message)) return 'props-invalid';
  if (/out of memory|oom|memory limit|heap out of memory/.test(message)) return 'memory';
  if (/webgl|gpu|gl=|angle|chromium.*gl|gpu process|three/.test(message)) return 'gl';
  if (/timeout|timed out|deadline exceeded|frame.*took/.test(message)) return 'timeout';
  return 'unknown';
};

export class RenderDiagnosticError extends Error {
  readonly tag: RenderFailureTag;
  readonly stdout: string;
  readonly stderr: string;
  readonly retryAttempt: number;

  constructor(message: string, options: { tag?: RenderFailureTag; stdout?: unknown; stderr?: unknown; retryAttempt?: number } = {}) {
    super(message);
    this.name = 'RenderDiagnosticError';
    this.tag = options.tag || classifyRenderFailure(message);
    this.stdout = tail(options.stdout);
    this.stderr = tail(options.stderr);
    this.retryAttempt = options.retryAttempt || 0;
  }
}

export const diagnosticError = (error: unknown, fallbackTag?: RenderFailureTag, retryAttempt = 0): RenderDiagnosticError => {
  const source = error as any;
  return new RenderDiagnosticError(String(source?.message || error || 'Unknown render failure'), {
    tag: fallbackTag || classifyRenderFailure(error),
    stdout: source?.stdout,
    stderr: source?.stderr,
    retryAttempt,
  });
};

export const formatRenderFailure = (error: unknown): string => {
  const diagnostic = error instanceof RenderDiagnosticError ? error : diagnosticError(error);
  const sections = [
    `[${diagnostic.tag}] ${diagnostic.message}`,
    `retry_attempt=${diagnostic.retryAttempt}`,
  ];
  if (diagnostic.stdout) sections.push(`--- stdout (tail ${MAX_LOG_CHARS} chars) ---\n${diagnostic.stdout}`);
  if (diagnostic.stderr) sections.push(`--- stderr (tail ${MAX_LOG_CHARS} chars) ---\n${diagnostic.stderr}`);
  return sections.join('\n');
};

export const isRetryableRenderFailure = (error: unknown): boolean => {
  const tag = error instanceof RenderDiagnosticError ? error.tag : classifyRenderFailure(error);
  return tag === 'timeout' || tag === 'memory' || tag === 'gl';
};
