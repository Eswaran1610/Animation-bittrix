export interface VideoTheme {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  archetype: 'kinetic-type' | 'isometric-diagram' | 'data-story' | 'paper-cutout' | 'neo-brutalist' | 'glass-ui' | 'blueprint-technical' | 'retro-terminal';
  palette: {
    bg: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  motionPersonality: 'snappy' | 'fluid' | 'bouncy' | 'precise';
  background: 'grid' | 'particles' | 'gradient-flow' | 'halftone' | 'lines';
  sfxPack: 'digital' | 'organic' | 'cinematic' | 'playful';
  bedMood: string;
}

export const THEME_CATALOG: VideoTheme[] = [
  {
    id: 'character-explainer',
    name: '2D Character Step-by-Step',
    icon: '👤',
    tagline: 'Friendly 2D host guiding through numbered steps',
    description: 'An animated 2D vector host or mascot anchors the screen (35% width) while sequential milestone cards (Step 1, Step 2, Step 3) unfold on the right with checklist badges and speech bubbles.',
    archetype: 'isometric-diagram',
    palette: {
      bg: '#0a1024',
      surface: '#131e3d',
      primary: '#38bdf8',
      accent: '#f59e0b',
      text: '#f8fafc',
    },
    fonts: {
      heading: 'Poppins, Arial, sans-serif',
      body: 'Inter, Arial, sans-serif',
    },
    motionPersonality: 'snappy',
    background: 'grid',
    sfxPack: 'playful',
    bedMood: 'upbeat friendly electronic acoustic',
  },
  {
    id: 'developer-terminal',
    name: 'Modern Tech & Developer Terminal',
    icon: '💻',
    tagline: 'Dark mode IDE, typewriter code & telemetry',
    description: 'Dark-mode hacker/developer terminal with macOS chrome, real-time typewriter CLI code execution, syntax-highlighted tokens, and telemetry status pills.',
    archetype: 'retro-terminal',
    palette: {
      bg: '#0d1117',
      surface: '#161b22',
      primary: '#22c55e',
      accent: '#38bdf8',
      text: '#f0f6fc',
    },
    fonts: {
      heading: 'JetBrains Mono, Courier New, monospace',
      body: 'Fira Code, Courier New, monospace',
    },
    motionPersonality: 'snappy',
    background: 'lines',
    sfxPack: 'digital',
    bedMood: 'focused electronic pulse synth',
  },
  {
    id: 'isometric-architecture',
    name: 'Isometric Cloud & Architecture Flow',
    icon: '🌐',
    tagline: '3D perspective microservices & pulsing data packets',
    description: 'Tilted 3D grid plane showing microservices, databases, and servers communicating with glowing data packets traveling along spline network cables.',
    archetype: 'isometric-diagram',
    palette: {
      bg: '#080d1a',
      surface: '#0f172a',
      primary: '#06b6d4',
      accent: '#f97316',
      text: '#f8fafc',
    },
    fonts: {
      heading: 'Inter, Arial, sans-serif',
      body: 'Roboto, Arial, sans-serif',
    },
    motionPersonality: 'precise',
    background: 'grid',
    sfxPack: 'digital',
    bedMood: 'ambient tech pulse',
  },
  {
    id: 'neo-brutalist',
    name: 'Neo-Brutalist Sticker Pop',
    icon: '⚡',
    tagline: 'Bold thick borders, sticker stamps & high energy',
    description: 'High-contrast, raw, modern internet aesthetic with 3px black borders, vibrant electric blocks, drop shadows, tilted sticker badges, and chunky typography.',
    archetype: 'neo-brutalist',
    palette: {
      bg: '#fffdf0',
      surface: '#ffffff',
      primary: '#ffe600',
      accent: '#ff0055',
      text: '#000000',
    },
    fonts: {
      heading: 'Impact, Archivo Black, sans-serif',
      body: 'Arial, sans-serif',
    },
    motionPersonality: 'bouncy',
    background: 'halftone',
    sfxPack: 'playful',
    bedMood: 'punchy upbeat pop beat',
  },
  {
    id: 'kinetic-typography',
    name: 'Kinetic Typography & Rhythmic Beats',
    icon: '🔤',
    tagline: 'Gigantic expressive typography in fast rhythmic cuts',
    description: 'Pure typography in motion. Fast-paced, punchy, synchronized word-by-word cuts with high-contrast scales, slides, and motion-blur sweeps.',
    archetype: 'kinetic-type',
    palette: {
      bg: '#000000',
      surface: '#111111',
      primary: '#ffffff',
      accent: '#ef4444',
      text: '#ffffff',
    },
    fonts: {
      heading: 'Impact, Trebuchet MS, sans-serif',
      body: 'Arial, sans-serif',
    },
    motionPersonality: 'snappy',
    background: 'lines',
    sfxPack: 'cinematic',
    bedMood: 'rhythmic driving percussive beat',
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism / Minimalist Luxury',
    icon: '💎',
    tagline: 'Translucent frosted glass with soft neon glow',
    description: 'Sleek, airy, frosted-glass UI with soft glowing lights, delicate dividers, thin modern typography, and buttery-smooth floating parallax depth.',
    archetype: 'glass-ui',
    palette: {
      bg: '#080c16',
      surface: 'rgba(255, 255, 255, 0.05)',
      primary: '#818cf8',
      accent: '#c084fc',
      text: '#f1f5f9',
    },
    fonts: {
      heading: 'Inter, Arial, sans-serif',
      body: 'Arial, sans-serif',
    },
    motionPersonality: 'fluid',
    background: 'gradient-flow',
    sfxPack: 'cinematic',
    bedMood: 'ethereal ambient shimmer',
  },
  {
    id: 'data-story',
    name: 'Data Journalism & Dynamic Infographic',
    icon: '📊',
    tagline: 'Live animated charts, counters & map telemetry',
    description: 'Authoritative documentary data presentation with animated bar charts, counting percentage rings, geographic radar pulses, and citation pills.',
    archetype: 'data-story',
    palette: {
      bg: '#0f172a',
      surface: '#1e293b',
      primary: '#2dd4bf',
      accent: '#fbbf24',
      text: '#f8fafc',
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Inter, Arial, sans-serif',
    },
    motionPersonality: 'precise',
    background: 'grid',
    sfxPack: 'digital',
    bedMood: 'measured investigative documentary bed',
  },
  {
    id: 'paper-cutout',
    name: 'Paper Cutout & Handcrafted Collage',
    icon: '✂️',
    tagline: 'Textured paper edges, torn wipes & stop-motion',
    description: 'Organic, artistic stop-motion feeling with torn craft-paper edges, scrapbook cutouts with white borders, handwritten arrows, and warm earthy tones.',
    archetype: 'paper-cutout',
    palette: {
      bg: '#fdf6e2',
      surface: '#fef9ec',
      primary: '#b45309',
      accent: '#047857',
      text: '#1f2937',
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Arial, sans-serif',
    },
    motionPersonality: 'bouncy',
    background: 'halftone',
    sfxPack: 'organic',
    bedMood: 'acoustic warm organic guitar piano',
  },
  {
    id: 'blueprint-technical',
    name: 'Technical Blueprint & CAD Schematic',
    icon: '📐',
    tagline: 'Engineering drafting, coordinate grids & dimensions',
    description: 'High-precision engineering and architectural drafting with deep blueprint blue backgrounds, dimension callout arrows (e.g. 45.2mm), wireframes, and crosshairs.',
    archetype: 'blueprint-technical',
    palette: {
      bg: '#041426',
      surface: '#08203e',
      primary: '#38bdf8',
      accent: '#fbbf24',
      text: '#e0f2fe',
    },
    fonts: {
      heading: 'Courier New, monospace',
      body: 'Arial, sans-serif',
    },
    motionPersonality: 'precise',
    background: 'grid',
    sfxPack: 'digital',
    bedMood: 'precision industrial technical pulse',
  },
  {
    id: 'retro-synthwave',
    name: 'Retro 80s/90s Synthwave & Pixel Arcade',
    icon: '🕹️',
    tagline: 'Neon horizon grid, CRT scanlines & pixel badges',
    description: 'Vibrant 80s neon arcade aesthetic with a perspective horizon grid, glowing magenta/cyan lights, scanlines, pixel art elements, and 8-bit digital badges.',
    archetype: 'retro-terminal',
    palette: {
      bg: '#140727',
      surface: '#240d42',
      primary: '#f43f5e',
      accent: '#06b6d4',
      text: '#fdf4ff',
    },
    fonts: {
      heading: 'Impact, Courier New, monospace',
      body: 'Courier New, monospace',
    },
    motionPersonality: 'snappy',
    background: 'grid',
    sfxPack: 'playful',
    bedMood: 'synthwave 80s retro electronic beat',
  },
];
