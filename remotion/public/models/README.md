# Shared 3D model library

Keep reusable objects in one file: `library.glb`.

1. Export one GLB containing named nodes such as `banana`, `keyboard`, `phone`, and `mouse`.
2. Copy it to this directory as `library.glb`.
3. Register each node in `remotion/src/data/modelLibrary.json`:

```json
{
  "version": 1,
  "library_file": "models/library.glb",
  "models": {
    "banana": { "node": "banana", "scale": 1 },
    "keyboard": { "node": "keyboard", "scale": 1 }
  }
}
```

Codex can then return multiple objects in one scene, for example one `banana` and one
`keyboard`, by setting each object's `render_spec.model_id`. Objects not registered
or not installed continue to use the procedural renderer.
