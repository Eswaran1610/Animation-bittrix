// Remotion Theme & Motion Presets according to SKILL.md Step 6

export const springPresets = {
  snappy: { damping: 12, mass: 0.5, stiffness: 140 },
  soft: { damping: 18, mass: 1, stiffness: 80 },
  bouncy: { damping: 8, mass: 0.6, stiffness: 120 },
  smooth: { damping: 20, mass: 1, stiffness: 60 }
};

export const palettes = {
  default: {
    bg: '#05070f',
    primary: '#38bdf8',
    secondary: '#818cf8',
    accent: '#c084fc',
    text: '#ffffff',
    subtext: '#94a3b8',
    cardBg: 'rgba(22, 32, 50, 0.7)',
    border: 'rgba(56, 189, 248, 0.3)'
  },
  solar: {
    bg: '#090503',
    primary: '#fbbf24',
    secondary: '#f97316',
    accent: '#ef4444',
    text: '#ffffff',
    subtext: '#cbd5e1',
    cardBg: 'rgba(40, 20, 10, 0.7)',
    border: 'rgba(251, 191, 36, 0.4)'
  },
  emerald: {
    bg: '#020d0a',
    primary: '#34d399',
    secondary: '#10b981',
    accent: '#059669',
    text: '#ffffff',
    subtext: '#94a3b8',
    cardBg: 'rgba(6, 40, 25, 0.7)',
    border: 'rgba(52, 211, 153, 0.4)'
  }
};
