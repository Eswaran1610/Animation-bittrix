import { z } from 'zod';
import { shortVideoCanvas, shortVideoTransitionFrames } from './designTokens';
import { SHORT_VIDEO_TEMPLATES, STYLE_PACKS } from './templates';

const TemplateSchema = z.enum(SHORT_VIDEO_TEMPLATES);
const PaletteSchema = z.enum(['warm', 'cool', 'fresh', 'dark', 'earth', 'neon']);
const StylePackSchema = z.enum(STYLE_PACKS);

export const ShortVideoSceneSchema = z.object({
  id: z.string().min(1),
  durationInFrames: z.number().int().min(75).max(150),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  template: TemplateSchema,
  words: z.array(z.string().min(1)).min(1).max(6),
  subtitle: z.string().optional(),
  detail: z.string().optional(),
  items: z.array(z.string()).max(6).optional(),
  labels: z.array(z.string()).max(2).optional(),
  icons: z.array(z.string()).max(6).optional(),
  numbers: z.array(z.string()).max(6).optional(),
  values: z.array(z.number().min(1).max(100)).max(5).optional(),
  metric: z.object({ value: z.string(), label: z.string() }).optional(),
  quote: z.string().optional(),
  attribution: z.string().optional(),
  fact: z.string().optional(),
  icon: z.string().optional(),
  label: z.string().optional(),
  cta: z.string().optional(),
  narrationDurationSec: z.number().positive().optional(),
});

export const ShortVideoPropsSchema = z.object({
  width: z.literal(shortVideoCanvas.width),
  height: z.literal(shortVideoCanvas.height),
  fps: z.literal(shortVideoCanvas.fps),
  durationInFrames: z.number().int().positive(),
  palette: PaletteSchema,
  stylePack: StylePackSchema,
  music: z.string(),
  whoosh: z.string(),
  narration: z.string(),
  scenes: z.array(ShortVideoSceneSchema).min(7).max(9),
}).superRefine((props, ctx) => {
  const duration = props.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0) - Math.max(0, props.scenes.length - 1) * shortVideoTransitionFrames;
  if (props.durationInFrames !== duration) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['durationInFrames'], message: 'Must equal scene frames minus transition overlaps.' });
  const durationSeconds = duration / shortVideoCanvas.fps;
  if (durationSeconds < 25 || durationSeconds > 40) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['durationInFrames'], message: 'Must be between 25 and 40 seconds.' });
  if (!['question-hook', 'hero-object'].includes(props.scenes[0]?.template)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scenes', 0, 'template'], message: 'First scene must be a hook.' });
  if (props.scenes.at(-1)?.template !== 'cta-outro') ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scenes', props.scenes.length - 1, 'template'], message: 'Last scene must be a CTA outro.' });
  for (let index = 2; index < props.scenes.length; index += 1) {
    if (props.scenes[index].template === props.scenes[index - 1].template && props.scenes[index].template === props.scenes[index - 2].template) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scenes', index, 'template'], message: 'No more than two identical templates in a row.' });
  }
});

export type ShortVideoScene = z.infer<typeof ShortVideoSceneSchema>;
export type ShortVideoProps = z.infer<typeof ShortVideoPropsSchema>;

export const SHORT_VIDEO_DEFAULT_PROPS: ShortVideoProps = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 888,
  palette: 'fresh',
  stylePack: 'nature',
  music: 'audio/short-video-bed.wav',
  whoosh: 'audio/short-video-whoosh.wav',
  narration: 'audio/3311b5df-aac8-4499-9e72-0098f32f146c_narration.mp3',
  scenes: [
    { id: 'hook', durationInFrames: 90, accent: '#55d6ff', template: 'question-hook', words: ['WHICH', 'CHOICE', 'WINS?'], subtitle: 'The answer is easier to see than to guess.' },
    { id: 'hero', durationInFrames: 150, accent: '#78d64b', template: 'hero-object', words: ['START', 'WITH', 'THE', 'SUBJECT'], subtitle: 'Make the main idea impossible to miss.', icon: '✦' },
    { id: 'stat', durationInFrames: 150, accent: '#ff9f43', template: 'stat-callout', words: ['THE', 'SIGNAL'], subtitle: 'One strong number gives the viewer a useful anchor.', metric: { value: '3x', label: 'more memorable when visual' } },
    { id: 'steps', durationInFrames: 150, accent: '#c084fc', template: 'steps-numbered', words: ['SHOW', 'THE', 'WHY'], subtitle: 'Turn the explanation into a sequence.', items: ['Name the idea', 'Animate the change', 'Land the takeaway'] },
    { id: 'fact', durationInFrames: 150, accent: '#55d6ff', template: 'fact-card', words: ['ONE', 'LAST', 'FACT'], subtitle: 'A focused fact earns the final beat.', fact: 'Clarity beats clutter.' },
    { id: 'grid', durationInFrames: 150, accent: '#78d64b', template: 'icon-grid', words: ['MAKE', 'IT', 'MEMORABLE'], subtitle: 'Group the ideas into a clean visual pattern.', items: ['Signal', 'Context', 'Action'], icons: ['✦', '◉', '◆'] },
    { id: 'cta', durationInFrames: 120, accent: '#ff5c8a', template: 'cta-outro', words: ['SAVE', 'THIS', 'IDEA'], subtitle: 'Keep the useful part and come back to it.', cta: 'SAVE THIS VIDEO' },
  ],
};
