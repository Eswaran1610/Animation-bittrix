# Motion pipeline: always-on rules

1. Keep plans data-driven: no topic-specific text, colours, timings, scene counts, or audio files in the renderer.
2. Picture and sound use one frame clock. Derive every cue from the scene plan and mix it in Remotion.
3. Every scene has continuous frame-driven motion, camera drift, and a persistent background; never ship a static slideshow.
4. Use overlap transitions rather than fading through black unless the plan explicitly requests black.
5. Render previews at 540×960 and finals at 1080×1920, both at 30 FPS.
6. Run the audio-sync validation after each render; reject a render that fails it.
7. Do not report a video as finished until its rendered output and validation result are checked.
