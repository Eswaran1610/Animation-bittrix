import React from "react";
import { Composition, getInputProps, getRemotionEnvironment } from "remotion";
import { MainComposition } from "./Composition";
import { SceneDataPayload } from "./data/sceneTypes";
import { isPlaceholderPayload, normalizeSceneData } from "./data/normalizeSceneData";

const STUDIO_PLACEHOLDER_PROPS: SceneDataPayload = {
  video: {
    title: "Studio Placeholder",
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 150,
    targetDurationSec: 5,
    style: "cinematic-neon",
    generatedBy: "codex",
    sourceProjectId: "studio-placeholder",
    previewVersion: 1,
    scriptVersion: 1,
  },
  scenes: [
    {
      id: "studio-placeholder-1",
      scene_number: 1,
      role: "hook",
      title: "Studio Placeholder",
      subtitle: "",
      on_screen_text: "STUDIO PLACEHOLDER",
      visual_direction: "",
      motion_cue: "",
      continuity_to_next: "",
      duration_sec: 5,
      durationInFrames: 150,
      themeColor: "#7c4dff",
      narration: "Studio placeholder.",
    } as any,
  ],
};

const calcTimelineDuration = (scenes: any[] = []) =>
  scenes.reduce((total, scene) => total + (scene.durationInFrames || (scene as any).frames || 90), 0) || 900;

export const Root: React.FC = () => {
  const isStudio = getRemotionEnvironment().isStudio;
  const rawInput = getInputProps();
  const realSceneData = normalizeSceneData(rawInput);

  if (!isStudio && realSceneData && isPlaceholderPayload(realSceneData)) {
    throw new Error("[Root] Scene data is the Studio placeholder. Refusing to render it as a real video.");
  }

  const resolvedProps: SceneDataPayload = realSceneData ?? STUDIO_PLACEHOLDER_PROPS;
  const mainFps = resolvedProps.video?.fps || 30;
  const mainDuration = resolvedProps.video?.durationInFrames || calcTimelineDuration(resolvedProps.scenes);

  return (
    <Composition
      id="MainComposition"
      component={MainComposition as unknown as React.FC<Record<string, unknown>>}
      defaultProps={resolvedProps as unknown as Record<string, unknown>}
      durationInFrames={mainDuration}
      fps={mainFps}
      width={resolvedProps.video?.width || 1080}
      height={resolvedProps.video?.height || 1920}
    />
  );
};
