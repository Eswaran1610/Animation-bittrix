# Style Guide — Fruit Nutrition Short

- Canvas: 1920x1080, 30fps, 20 seconds.
- Palette: midnight `#07111f`, ink `#0f172a`, white `#f8fafc`, apple green `#78d64b`, citrus orange `#ff9f43`, guava pink `#ff5c8a`, electric blue `#55d6ff`.
- Typography: system sans stack, heavy uppercase display text, compact eyebrow labels, high-contrast captions.
- Motion: spring entrances, clamped interpolate zoom/pan, 10-frame cross-fade transitions, no CSS animation or transition.
- Visual language: dark editorial card, oversized fruit cutouts, thin grid lines, neon accent rings, soft radial glow.
- Safe area: 96px minimum horizontal margin; important text stays inside the center 80%.
- Audio: generated procedural music bed at 0.3 maximum volume, generated short whoosh at each scene cut, existing local narration kept at its native speed.
- Assets: local SVG illustrations and one verified local orange photograph, all loaded through `staticFile()` and rendered using `<Img>`.
