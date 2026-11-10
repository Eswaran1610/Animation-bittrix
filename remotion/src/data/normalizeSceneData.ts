import type { SceneDataPayload } from "./sceneTypes";

/**
 * Accepts every props shape that exists in this repo today and returns one
 * SceneDataPayload ({ video, scenes }) - or null if nothing valid was passed.
 *
 *   { video, scenes }          <- backend videoRenderer / Composition
 *   { sceneData: {...} }       <- MainVideo
 *   { data: {...} }            <- old universal-motion-pipeline.mjs
 */
const isPayload = (value: unknown): value is SceneDataPayload => {
  const v = value as any;
  return Boolean(
    v &&
      typeof v === "object" &&
      v.video &&
      typeof v.video === "object" &&
      Array.isArray(v.scenes) &&
      v.scenes.length > 0,
  );
};

export const normalizeSceneData = (input: unknown): SceneDataPayload | null => {
  const root = input as any;
  const candidates = [root, root?.sceneData, root?.data, root?.props, root?.inputProps];
  for (const candidate of candidates) {
    if (isPayload(candidate)) return candidate;
  }
  return null;
};

// ids used ONLY by the Studio placeholder. A real render must never contain them.
export const PLACEHOLDER_PROJECT_IDS = ["preview", "studio-placeholder"];

export const isPlaceholderPayload = (payload: SceneDataPayload): boolean => {
  const video = payload.video as any;
  if (PLACEHOLDER_PROJECT_IDS.includes(String(video?.sourceProjectId))) return true;
  return payload.scenes.some((scene: any) =>
    /ready to render\?|studio placeholder/i.test(String(scene?.on_screen_text || "")),
  );
};
