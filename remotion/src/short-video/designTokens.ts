export const shortVideoCanvas = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

export const shortVideoSafeArea = {
  left: 120,
  right: 120,
  top: 250,
  bottom: 350,
} as const;

export const shortVideoType = {
  display: 'Arial, Helvetica, sans-serif',
  body: 'Arial, Helvetica, sans-serif',
  headline: 108,
  subline: 54,
  caption: 46,
} as const;

export const shortVideoMotion = {
  soft: { damping: 14, stiffness: 90, mass: 0.8 },
  pop: { damping: 10, stiffness: 140, mass: 0.7 },
  snap: { damping: 18, stiffness: 200, mass: 0.7 },
} as const;

export const shortVideoTransitionFrames = 12;

export const shortVideoPalettes = {
  warm: { bg: '#21120c', bg2: '#4a2114', text: '#fff8ee', accent: '#ff9f43', shadow: '#120704' },
  cool: { bg: '#071525', bg2: '#12375b', text: '#f4f9ff', accent: '#55d6ff', shadow: '#020914' },
  fresh: { bg: '#071b18', bg2: '#124d3b', text: '#f4fff8', accent: '#78d64b', shadow: '#02100d' },
  dark: { bg: '#090b18', bg2: '#211744', text: '#faf7ff', accent: '#c084fc', shadow: '#03020a' },
  earth: { bg: '#1b1711', bg2: '#4a3821', text: '#fff7e7', accent: '#e2b56d', shadow: '#0b0804' },
  neon: { bg: '#090b16', bg2: '#151c45', text: '#f8fbff', accent: '#ff5c8a', shadow: '#02030a' },
} as const;

export type ShortVideoPalette = keyof typeof shortVideoPalettes;
