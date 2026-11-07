import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';

/**
 * Trend Research Stage
 *
 * content (from user) -> CLI agent researches the content across multiple sources
 * AND current motion-graphics trends (Claude / Claude Code style product videos)
 * -> backend saves the result as `suggestion.txt` -> the plan agent (AGY/Codex)
 * receives that file as input for the scene plan.
 *
 * Nothing here is keyed to a topic: no domain regexes, no fixed palettes, no
 * fixed scene lists. All domain/trend knowledge comes from the agent's live
 * research for THIS submission. If research fails, the result says so; it never
 * substitutes invented content.
 */

export interface TextRunner {
  runText(prompt: string, opts: { timeoutMs: number; projectId?: string }): Promise<string>;
}

export interface TrendBriefResult {
  status: 'fresh' | 'reused' | 'unavailable';
  text: string; // contents of suggestion.txt ('' when unavailable)
  filePath?: string;
  sourceCount: number;
  warning?: string;
}

const REQUIRED_SECTIONS = [
  'TOPIC BRIEF',
  'VERIFIED FACTS',
  'TREND SIGNALS',
  'MOTION TECHNIQUES',
  'SCENE SUGGESTIONS',
  'ASSET CANDIDATES',
  'AUDIO DIRECTION',
  'AVOID',
];

const MIN_PREFERRED_SOURCE_DOMAINS = 4;
const MIN_ACCEPTABLE_SOURCE_DOMAINS = 2;
const MAX_BRIEF_CHARS = 9000; // keeps the downstream planning prompt bounded

const countDistinctDomains = (text: string): number => {
  const hosts = new Set<string>();
  for (const m of text.matchAll(/https?:\/\/[^\s)>\]"']+/gi)) {
    try {
      hosts.add(new URL(m[0]).hostname.replace(/^www\./, ''));
    } catch {
      /* ignore malformed URL */
    }
  }
  return hosts.size;
};

const missingSections = (text: string): string[] =>
  REQUIRED_SECTIONS.filter(
    (s) =>
      !new RegExp(
        `(?:^|\\n)\\s*(?:#{1,4}\\s*)?(?:(?:section|part|step)?\\s*\\d+[\\.:\\)]\\s*)?\\**${s}\\**\\s*:?`,
        'im',
      ).test(text),
  );

export class TrendResearchService {
  briefPath(projectId: string): string {
    return path.join(projectPaths.backendMedia, 'projects', projectId, 'research', 'suggestion.txt');
  }

  private async loadSkill(): Promise<string> {
    const skillPath = path.join(projectPaths.root, '.agents/skills/motion-trend-researcher/SKILL.md');
    try {
      return await readFile(skillPath, 'utf8');
    } catch {
      return ''; // the prompt below is self-sufficient; the skill only adds depth
    }
  }

  buildPrompt(content: string, skill: string, today: string, feedback?: string): string {
    return `You are a motion-graphics research analyst. Today's date is ${today}.
You have live web search. USE IT. Do not answer from memory.

${skill ? `FOLLOW THIS SKILL:\n${skill}\n\n` : ''}USER SUBMISSION (the only source of subject matter; do not assume a domain):
"""
${content}
"""
${feedback ? `\nREVISION FEEDBACK FROM THE HUMAN REVIEWER (address it):\n${feedback}\n` : ''}
TASK
1. Research the submission itself across at least ${MIN_PREFERRED_SOURCE_DOMAINS} distinct authoritative websites. Cross-check facts; note any disagreement.
2. Research CURRENT motion-graphics trends relevant to this subject: modern vertical reel-style explainers (1080x1920, 20-40s), Claude/Anthropic product demo motion styles (kinetic reveals, floating UI cards, code/terminal stages, node-edge flow paths, springy easing, camera pushes, continuous timeline flow without jarring slide breaks). Extract TECHNIQUES only.
3. CRITICAL RULE: The bracketed examples in the guide (such as websites->laptop, save hours->pocket watch, agency promos, purple accent) are reference logic ONLY. Do NOT hardcode or copy those specific topics, palettes, or assets. Everything must be dynamically derived from THIS user submission.
4. Asset candidates: Find concrete or metaphoric hero objects (>40% frame width) and secondary objects (<15% frame width) with direct HTTPS URLs, source page, license and attribution. If none is verifiable, specify "use authored vector" with shape/text specs.
5. Decide what fits THIS content. Different content must lead to completely different design choices, layouts, and palettes.

OUTPUT: plain text only, no JSON, no code fences. Use exactly these section headings, each on its own line:
${REQUIRED_SECTIONS.map((s) => `${s}:`).join('\n')}

Rules per section:
- TOPIC BRIEF: 3-5 lines. What the video must teach and for whom. Include recommended single accent color + neutral background chosen for THIS topic.
- VERIFIED FACTS: bullets, each ending with (source URL).
- TREND SIGNALS: bullets, each with the technique, where it was seen, approximate date, and (source URL).
- MOTION TECHNIQUES: concrete, implementable in Remotion (spring values, timing in frames at 30 fps, camera moves, kinetic text reveal with spoken timestamp alignment). Continuous timeline flow (no slideshow cuts or blank blackouts).
- SCENE SUGGESTIONS: 7-9 scenes for a 20-30s vertical reel. For each scene: beat number, keyword, layout template (hero-center | frame-cutout | card-stack | big-statement | split-compare | data-badge | code-or-ui-stage | flow-path), hero asset, motion entrance/loop, and audio cue.
- ASSET CANDIDATES: per item: what it is, direct URL, source page, license, attribution. Or "use authored vector".
- AUDIO DIRECTION: bed mood suited to topic, SFX per motion event (whoosh, pop, tick, riser, impact), ducking guidance.
- AVOID: clichés, stale trends, generic glowing balls/circles as hero assets when a real object exists, unverifiable claims, hardcoded agency examples.
Keep the whole answer under ${Math.round(MAX_BRIEF_CHARS * 0.9)} characters.`;
  }

  async prepare(opts: {
    projectId: string;
    content: string;
    runner: TextRunner;
    timeoutMs: number;
    deadlineAt?: number;
    feedback?: string;
    reuseExisting?: boolean;
  }): Promise<TrendBriefResult> {
    const { projectId, content, runner, timeoutMs, feedback, deadlineAt } = opts;
    const filePath = this.briefPath(projectId);

    // Narration/visual revisions reuse the saved research unless the reviewer changed the topic.
    if (opts.reuseExisting && existsSync(filePath)) {
      try {
        const text = await readFile(filePath, 'utf8');
        return { status: 'reused', text, filePath, sourceCount: countDistinctDomains(text) };
      } catch (err: any) {
        console.warn(`[TrendResearch] Could not read saved brief; refreshing it: ${err?.message || err}`);
      }
    }

    const skill = await this.loadSkill();
    const today = new Date().toISOString().slice(0, 10);
    let prompt = this.buildPrompt(content, skill, today, feedback);

    realtime.publish({
      type: 'pipeline_progress',
      projectId,
      stage: 'research',
      progress: 12,
      status: 'Researching content sources and current motion trends...',
    });

    let lastProblem = '';
    let candidateText = '';
    let candidateDomains = 0;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const remainingMs = deadlineAt ? deadlineAt - Date.now() : timeoutMs;
      if (remainingMs < 15000) {
        lastProblem = 'shared generation deadline leaves insufficient time for trend research';
        break;
      }
      try {
        let text = (await runner.runText(prompt, { timeoutMs: Math.min(timeoutMs, remainingMs), projectId })).trim();
        text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
        if (text.length > MAX_BRIEF_CHARS) text = text.slice(0, MAX_BRIEF_CHARS);

        const missing = missingSections(text);
        const domains = countDistinctDomains(text);
        if (missing.length === 0 && domains >= MIN_PREFERRED_SOURCE_DOMAINS) {
          await mkdir(path.dirname(filePath), { recursive: true });
          await writeFile(filePath, text + '\n', 'utf8');
          return { status: 'fresh', text, filePath, sourceCount: domains };
        }

        if (domains >= MIN_ACCEPTABLE_SOURCE_DOMAINS && missing.length <= 2 && (!candidateText || domains > candidateDomains)) {
          candidateText = text;
          candidateDomains = domains;
        }

        lastProblem = [
          missing.length ? `missing sections: ${missing.join(', ')}` : '',
          domains < MIN_PREFERRED_SOURCE_DOMAINS ? `only ${domains} distinct source domains (need ${MIN_PREFERRED_SOURCE_DOMAINS})` : '',
        ].filter(Boolean).join('; ');
        prompt = `${this.buildPrompt(content, skill, today, feedback)}\n\nYOUR PREVIOUS ANSWER WAS REJECTED: ${lastProblem}. Run the web searches again and return the complete corrected text.`;
      } catch (err: any) {
        lastProblem = err?.message || String(err);
        break; // CLI failure (quota, auth, timeout): a retry will not help
      }
    }

    if (candidateText && candidateDomains >= MIN_ACCEPTABLE_SOURCE_DOMAINS) {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, candidateText + '\n', 'utf8');
      console.log(`[TrendResearch] Saved resilient trend brief with ${candidateDomains} source domains.`);
      return { status: 'fresh', text: candidateText, filePath, sourceCount: candidateDomains };
    }

    const warning = `Trend research unavailable: ${lastProblem}`;
    console.warn(`[TrendResearch] ${warning}`);
    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'research', progress: 14, status: warning });
    return { status: 'unavailable', text: '', sourceCount: 0, warning };
  }

  /** Text inserted into the planning prompt. Empty brief => explicit "no brief" instruction, not invented content. */
  formatForPlanPrompt(result: TrendBriefResult): string {
    if (result.status === 'unavailable') {
      return `TREND RESEARCH BRIEF: UNAVAILABLE (${result.warning}). Do your own live web research for this submission and for current motion trends. Do not rely on memory.`;
    }
    return `TREND RESEARCH BRIEF (saved as suggestion.txt; research already done, ${result.sourceCount} source domains).
Treat it as strong input, but verify any asset URL and any fact you build a scene on. If a suggestion conflicts with the renderer contract, the renderer contract wins.
--------------------------------------------------------------------------------
${result.text}
--------------------------------------------------------------------------------`;
  }
}

export const trendResearchService = new TrendResearchService();
