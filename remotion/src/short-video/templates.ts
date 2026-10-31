export const SHORT_VIDEO_TEMPLATES = [
  'hero-object', 'split-compare', 'stat-callout', 'list-reveal', 'quote-focus',
  'timeline', 'steps-numbered', 'map-pin', 'chart-bar', 'before-after',
  'question-hook', 'cta-outro', 'product-showcase', 'fact-card', 'icon-grid',
] as const;

export type ShortVideoTemplate = typeof SHORT_VIDEO_TEMPLATES[number];

export const STYLE_PACKS = ['nature', 'tech', 'finance', 'history', 'kids', 'motivation', 'health'] as const;
export type ShortVideoStylePack = typeof STYLE_PACKS[number];

export const templateRegistry: Record<ShortVideoTemplate, { label: string; purpose: string }> = {
  'hero-object': { label: 'Hero object', purpose: 'One subject with a clear entrance and float.' },
  'split-compare': { label: 'Split compare', purpose: 'Two choices shown in a direct comparison.' },
  'stat-callout': { label: 'Stat callout', purpose: 'One meaningful number with visual emphasis.' },
  'list-reveal': { label: 'List reveal', purpose: 'Short items stagger in with an icon.' },
  'quote-focus': { label: 'Quote focus', purpose: 'A memorable line receives the whole frame.' },
  timeline: { label: 'Timeline', purpose: 'Events or stages progress along a path.' },
  'steps-numbered': { label: 'Numbered steps', purpose: 'A process is taught one step at a time.' },
  'map-pin': { label: 'Map pin', purpose: 'A place or location is highlighted.' },
  'chart-bar': { label: 'Bar chart', purpose: 'Values compare through animated bars.' },
  'before-after': { label: 'Before and after', purpose: 'A change is shown with a visual wipe.' },
  'question-hook': { label: 'Question hook', purpose: 'A question creates an immediate opening.' },
  'cta-outro': { label: 'CTA outro', purpose: 'A concise, animated action prompt.' },
  'product-showcase': { label: 'Product showcase', purpose: 'A subject rotates inside a designed frame.' },
  'fact-card': { label: 'Fact card', purpose: 'A surprising fact gets a focused card.' },
  'icon-grid': { label: 'Icon grid', purpose: 'Several related concepts are grouped clearly.' },
};

export const stylePackForTopic = (topic: string): ShortVideoStylePack => {
  const value = topic.toLowerCase();
  if (/nature|food|fruit|plant|animal/.test(value)) return 'nature';
  if (/tech|ai|software|code|robot/.test(value)) return 'tech';
  if (/finance|business|money|market/.test(value)) return 'finance';
  if (/history|war|ancient|culture/.test(value)) return 'history';
  if (/kid|child|school|learn|education/.test(value)) return 'kids';
  if (/motivat|mindset|success|inspir/.test(value)) return 'motivation';
  return 'health';
};
