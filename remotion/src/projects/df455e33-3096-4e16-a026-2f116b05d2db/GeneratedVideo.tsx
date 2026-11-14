import React, { useMemo } from 'react';
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  TerminalWindow,
  GlassCard,
  LaserBusLine,
  GitCommitGraph,
  TelemetryPill,
  NetworkNodes,
  MetricBar,
  KineticTitle
} from '../../components/MotionElements';
import { SyncCaptions } from '../../components/SyncCaptions';
import { BittrixOutroExact } from '../../components/BittrixOutroExact';

interface WordCue {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SceneData {
  scene_number: number;
  role: string;
  durationInFrames: number;
  duration_sec: number;
  narration: string;
  on_screen_text: string;
  visual_direction: string;
  template: string;
  themeColor: string;
  words: WordCue[];
}

const SCENES: SceneData[] = [
  {
    scene_number: 1,
    role: "hook",
    durationInFrames: 83,
    duration_sec: 2.77,
    narration: "What makes a plant a fruit?",
    on_screen_text: "What Makes A Fruit?",
    visual_direction: "Dark cinematic vignette with floating luminous cyan particles and a slow camera forward dolly towards a glowing fruit collection.",
    template: "question-hook",
    themeColor: "#f43f5e",
    words: [
      { word: "What", startFrame: 0, endFrame: 13 },
      { word: "makes", startFrame: 14, endFrame: 27 },
      { word: "a", startFrame: 28, endFrame: 38 },
      { word: "plant", startFrame: 39, endFrame: 53 },
      { word: "a", startFrame: 54, endFrame: 65 },
      { word: "fruit?", startFrame: 66, endFrame: 83 }
    ]
  },
  {
    scene_number: 2,
    role: "body",
    durationInFrames: 110,
    duration_sec: 3.67,
    narration: "Every true fruit carries inside seeds.",
    on_screen_text: "Fruits Always Hold Seeds",
    visual_direction: "High-contrast spotlight on a sliced apple with cyan glow highlighting internal dark seed pods.",
    template: "hero-object",
    themeColor: "#38bdf8",
    words: [
      { word: "Every", startFrame: 0, endFrame: 18 },
      { word: "true", startFrame: 19, endFrame: 36 },
      { word: "fruit", startFrame: 37, endFrame: 54 },
      { word: "carries", startFrame: 55, endFrame: 72 },
      { word: "inside", startFrame: 73, endFrame: 90 },
      { word: "seeds.", startFrame: 91, endFrame: 110 }
    ]
  },
  {
    scene_number: 3,
    role: "body",
    durationInFrames: 101,
    duration_sec: 3.37,
    narration: "They all begin as blooming flowers.",
    on_screen_text: "Born From Blooming Flowers",
    visual_direction: "Flow chart pathway tracking left-to-right from flower petals to swelling strawberry fruit under glowing ambient particles.",
    template: "flow-path",
    themeColor: "#f43f5e",
    words: [
      { word: "They", startFrame: 0, endFrame: 16 },
      { word: "all", startFrame: 17, endFrame: 32 },
      { word: "begin", startFrame: 33, endFrame: 50 },
      { word: "as", startFrame: 51, endFrame: 66 },
      { word: "blooming", startFrame: 67, endFrame: 84 },
      { word: "flowers.", startFrame: 85, endFrame: 101 }
    ]
  },
  {
    scene_number: 4,
    role: "body",
    durationInFrames: 124,
    duration_sec: 4.13,
    narration: "Sweet apples, bananas, and juicy berries.",
    on_screen_text: "Sweet Classroom Favorites",
    visual_direction: "Staggered vertical cards sliding from screen bottom, highlighting sweet lunchbox fruit items.",
    template: "card-stack",
    themeColor: "#38bdf8",
    words: [
      { word: "Sweet", startFrame: 0, endFrame: 20 },
      { word: "apples,", startFrame: 21, endFrame: 41 },
      { word: "bananas,", startFrame: 42, endFrame: 62 },
      { word: "and", startFrame: 63, endFrame: 82 },
      { word: "juicy", startFrame: 83, endFrame: 102 },
      { word: "berries.", startFrame: 103, endFrame: 124 }
    ]
  },
  {
    scene_number: 5,
    role: "body",
    durationInFrames: 133,
    duration_sec: 4.43,
    narration: "Wait! Is a tomato actually fruit?",
    on_screen_text: "Is Tomato A Fruit?",
    visual_direction: "Split-screen comparison dividing culinary vegetable assumptions on the left from botanical evidence on the right.",
    template: "split-compare",
    themeColor: "#f43f5e",
    words: [
      { word: "Wait!", startFrame: 0, endFrame: 22 },
      { word: "Is", startFrame: 23, endFrame: 44 },
      { word: "a", startFrame: 45, endFrame: 66 },
      { word: "tomato", startFrame: 67, endFrame: 88 },
      { word: "actually", startFrame: 89, endFrame: 110 },
      { word: "fruit?", startFrame: 111, endFrame: 133 }
    ]
  },
  {
    scene_number: 6,
    role: "body",
    durationInFrames: 145,
    duration_sec: 4.83,
    narration: "Yes! Tomatoes hold tiny seeds inside.",
    on_screen_text: "Surprise Inside The Kitchen",
    visual_direction: "High-intensity spotlight focusing on the internal jelly chambers of a tomato, glowing with cyan outline overlays.",
    template: "hero-center",
    themeColor: "#38bdf8",
    words: [
      { word: "Yes!", startFrame: 0, endFrame: 24 },
      { word: "Tomatoes", startFrame: 25, endFrame: 49 },
      { word: "hold", startFrame: 50, endFrame: 74 },
      { word: "tiny", startFrame: 75, endFrame: 98 },
      { word: "seeds", startFrame: 99, endFrame: 122 },
      { word: "inside.", startFrame: 123, endFrame: 145 }
    ]
  },
  {
    scene_number: 7,
    role: "body",
    durationInFrames: 100,
    duration_sec: 3.33,
    narration: "Cucumbers and peppers are fruits too!",
    on_screen_text: "Cucumbers Are Fruits Too",
    visual_direction: "Dramatic showcase card displaying multiple surprising savory botanical fruits side by side under cinematic spotlights.",
    template: "fact-card",
    themeColor: "#f43f5e",
    words: [
      { word: "Cucumbers", startFrame: 0, endFrame: 16 },
      { word: "and", startFrame: 17, endFrame: 33 },
      { word: "peppers", startFrame: 34, endFrame: 50 },
      { word: "are", startFrame: 51, endFrame: 67 },
      { word: "fruits", startFrame: 68, endFrame: 83 },
      { word: "too!", startFrame: 84, endFrame: 100 }
    ]
  },
  {
    scene_number: 8,
    role: "body",
    durationInFrames: 97,
    duration_sec: 3.23,
    narration: "Roots and leaves are true vegetables.",
    on_screen_text: "Botanical Versus Vegetable",
    visual_direction: "Official glowing botanical badge stamping approval on true science classification over squash cross-section.",
    template: "data-badge",
    themeColor: "#38bdf8",
    words: [
      { word: "Roots", startFrame: 0, endFrame: 16 },
      { word: "and", startFrame: 17, endFrame: 32 },
      { word: "leaves", startFrame: 33, endFrame: 48 },
      { word: "are", startFrame: 49, endFrame: 64 },
      { word: "true", startFrame: 65, endFrame: 80 },
      { word: "vegetables.", startFrame: 81, endFrame: 97 }
    ]
  },
  {
    scene_number: 9,
    role: "cta",
    durationInFrames: 112,
    duration_sec: 3.73,
    narration: "Follow Bittrix Technologies for more interesting concepts.",
    on_screen_text: "Spot Seeds And Learn!",
    "visual_direction": "High-energy cinematic finale banner punching forward into safe area with glowing particles and celebratory pulsing badge.",
    template: "cta-outro",
    themeColor: "#5b1a78",
    words: [
      { word: "Follow", startFrame: 0, endFrame: 18 },
      { word: "Bittrix", startFrame: 19, endFrame: 38 },
      { word: "Technologies", startFrame: 39, endFrame: 60 },
      { word: "for", startFrame: 61, endFrame: 74 },
      { word: "more", startFrame: 75, endFrame: 88 },
      { word: "interesting", startFrame: 89, endFrame: 100 },
      { word: "concepts.", startFrame: 101, endFrame: 112 }
    ]
  }
];

export default function GeneratedCliVideo() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Compute Scene Start Ranges
  const sceneRanges = useMemo(() => {
    let accumulated = 0;
    return SCENES.map((scene) => {
      const start = accumulated;
      const end = accumulated + scene.durationInFrames;
      accumulated = end;
      return { ...scene, start, end };
    });
  }, []);

  // Determine active scene
  const activeSceneIndex = useMemo(() => {
    const idx = sceneRanges.findIndex((s) => frame >= s.start && frame < s.end);
    return idx !== -1 ? idx : sceneRanges.length - 1;
  }, [frame, sceneRanges]);

  const currentScene = sceneRanges[activeSceneIndex];
  const sceneFrame = frame - currentScene.start;

  // Global Continuous Camera Coordinates
  const cameraTransforms = useMemo(() => {
    const targetScales = [1.0, 1.06, 0.98, 1.05, 1.08, 1.02, 1.04, 0.96, 1.0];
    const targetXs = [0, -30, 25, -20, 35, -15, 20, -10, 0];
    const targetYs = [0, -25, 20, -15, -30, 15, -20, 25, 0];

    const currentScale = targetScales[activeSceneIndex] || 1.0;
    const nextScale = targetScales[Math.min(activeSceneIndex + 1, targetScales.length - 1)];

    const currentX = targetXs[activeSceneIndex] || 0;
    const nextX = targetXs[Math.min(activeSceneIndex + 1, targetXs.length - 1)];

    const currentY = targetYs[activeSceneIndex] || 0;
    const nextY = targetYs[Math.min(activeSceneIndex + 1, targetYs.length - 1)];

    const progress = Math.min(1, Math.max(0, sceneFrame / currentScene.durationInFrames));
    const smoothProgress = interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });

    const camX = interpolate(smoothProgress, [0, 1], [currentX, nextX]);
    const camY = interpolate(smoothProgress, [0, 1], [currentY, nextY]);
    const camScale = interpolate(smoothProgress, [0, 1], [currentScale, nextScale]);

    return { camX, camY, camScale };
  }, [activeSceneIndex, sceneFrame, currentScene]);

  // Floating Micro Particles Simulation
  const particles = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => ({
      id: i,
      x: (i * 97) % 1080,
      y: (i * 137) % 1920,
      size: (i % 4) + 2,
      speed: 0.8 + (i % 5) * 0.4,
      color: i % 2 === 0 ? '#38bdf8' : '#f43f5e',
      opacity: 0.2 + (i % 6) * 0.12
    }));
  }, []);

  // Background subtle drift
  const bgDriftY = (frame * 0.6) % 80;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07080e',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* 1. PARTICLES & DYNAMIC GRID CANVAS */}
      <div
        style={{
          position: 'absolute',
          inset: -200,
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(244, 63, 94, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.08) 0%, transparent 55%),
            linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
          backgroundPosition: `0 0, 0 0, 0px ${bgDriftY}px, 0px 0px`,
          pointerEvents: 'none'
        }}
      />

      {/* Floating Particles */}
      {particles.map((p) => {
        const py = (p.y + frame * p.speed) % 1920;
        const px = p.x + Math.sin((frame + p.id * 10) / 40) * 14;
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: px,
              top: py,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              pointerEvents: 'none'
            }}
          />
        );
      })}

      {/* 2. LIVING CAMERA STAGE */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate3d(${cameraTransforms.camX}px, ${cameraTransforms.camY}px, 0) scale(${cameraTransforms.camScale})`,
          transformOrigin: '540px 960px',
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* HUD TELEMETRY HEADER */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 54,
            right: 54,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 30
          }}
        >
          <TelemetryPill
            label="SPECIMEN / BOTANY"
            value={`STAGE 0${currentScene.scene_number}`}
            status="active"
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '8px 16px',
              borderRadius: 24,
              backdropFilter: 'blur(12px)'
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: currentScene.themeColor,
                boxShadow: `0 0 10px ${currentScene.themeColor}`
              }}
            />
            <span
              style={{
                fontSize: 14,
                letterSpacing: 2,
                color: '#ffffff',
                fontFamily: 'monospace',
                textTransform: 'uppercase'
              }}
            >
              {currentScene.template}
            </span>
          </div>
        </div>

        {/* SCENE DIRECTED CONTENT WORKSPACES */}

        {/* SCENE 1: QUESTION HOOK */}
        {activeSceneIndex === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 54px'
            }}
          >
            <KineticTitle
              title="BOTANICAL PARADOX"
              subtitle="WHAT MAKES A PLANT A FRUIT?"
              badge="SCIENCE DISCOVERY"
              accentColor="#f43f5e"
            />
            <div style={{ marginTop: 40, width: '100%', maxWidth: 880 }}>
              <GlassCard
                title="CLASSIFICATION CRITERIA"
                subtitle="Biochemical Taxonomy Engine v4.2"
                accentColor="#f43f5e"
              >
                <div style={{ padding: '24px 10px' }}>
                  <TerminalWindow
                    title="specimen_query.sh"
                    lines={[
                      '$ inspect --botanical-type plant.organ',
                      'Scanning reproductive structures...',
                      '+ Ovary wall: swollen pericarp detected',
                      '+ Dispersal mechanism: active seed envelope',
                      '> STATUS: CLASSIFICATION CHALLENGED'
                    ]}
                  />
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* SCENE 2: HERO OBJECT (SLICED SEED CONTAINER) */}
        {activeSceneIndex === 1 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 54px'
            }}
          >
            <KineticTitle
              title="ANATOMY OF A FRUIT"
              subtitle="SEED CARRIER MATRIX"
              badge="BOTANICAL RULE #1"
              accentColor="#38bdf8"
            />
            <div style={{ marginTop: 36, width: '100%', maxWidth: 880 }}>
              <GlassCard
                title="SPECIMEN CROSS-SECTION [APPLE]"
                subtitle="High-Contrast X-Ray Seed Pod Telemetry"
                accentColor="#38bdf8"
              >
                <div
                  style={{
                    position: 'relative',
                    height: 280,
                    margin: '20px 0',
                    background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)',
                    borderRadius: 16,
                    border: '1px solid rgba(56,189,248,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="240" height="240" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
                    <circle cx="100" cy="100" r="48" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                    {/* Seed Pods */}
                    {[-30, 0, 30].map((rot, idx) => (
                      <ellipse
                        key={idx}
                        cx="100"
                        cy={80 + idx * 20}
                        rx="7"
                        ry="14"
                        fill="#f43f5e"
                        transform={`rotate(${rot} 100 ${80 + idx * 20})`}
                        filter="drop-shadow(0 0 6px #f43f5e)"
                      />
                    ))}
                  </svg>
                  <div style={{ position: 'absolute', bottom: 16, right: 20 }}>
                    <TelemetryPill label="SEED COUNT" value="5 PODS DETECTED" status="active" />
                  </div>
                </div>
                <MetricBar label="Seed Enclosure Confidence" value={100} maxValue={100} unit="%" color="#38bdf8" />
              </GlassCard>
            </div>
          </div>
        )}

        {/* SCENE 3: FLOW PATH (FLOWER TO FRUIT EVOLUTION) */}
        {activeSceneIndex === 2 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 54px'
            }}
          >
            <KineticTitle
              title="METAMORPHOSIS"
              subtitle="FROM FLOWER OVARY TO FRUIT"
              badge="DEVELOPMENTAL MORPH"
              accentColor="#f43f5e"
            />
            <div style={{ marginTop: 30, width: '100%', maxWidth: 880 }}>
              <GlassCard
                title="DEVELOPMENT PIPELINE"
                subtitle="Ovary Swelling and Petal Drop Workflow"
                accentColor="#f43f5e"
              >
                <div style={{ padding: '20px 0' }}>
                  <GitCommitGraph
                    commits={[
                      { hash: 'flwr-01', message: 'Blooming Blossom Petals', branch: 'flower' },
                      { hash: 'poln-02', message: 'Pollination Verified', branch: 'fertilize' },
                      { hash: 'ovry-03', message: 'Ovary Cell Expansion', branch: 'swelling' },
                      { hash: 'frut-04', message: 'Full Fruit Matrix Formed', branch: 'mature' }
                    ]}
                  />
                  <div style={{ marginTop: 24 }}>
                    <LaserBusLine
                      startX={40}
                      startY={20}
                      endX={800}
                      endY={20}
                      progress={interpolate(sceneFrame, [0, 80], [0, 1], { extrapolateRight: 'clamp' })}
                      color="#f43f5e"
                    />
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* SCENE 4: CARD STACK (SWEET FAVORITES) */}
        {activeSceneIndex === 3 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 54px'
            }}
          >
            <KineticTitle
              title="CULINARY STANDARD"
              subtitle="SWEET CLASSROOM BASICS"
              badge="CONVENTIONAL APPLES & BERRIES"
              accentColor="#38bdf8"
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginTop: 36,
                width: '100%',
                maxWidth: 880
              }}
            >
              {[
                { name: 'Apple Specimen', sugar: 'High Fructose', seedType: 'Pips in Core', color: '#f43f5e' },
                { name: 'Banana Cluster', sugar: 'Starch to Sucrose', seedType: 'Micro Seeds', color: '#38bdf8' },
                { name: 'Juicy Berry Array', sugar: 'Antioxidant Pulp', seedType: 'External Achenes', color: '#f43f5e' }
              ].map((item, idx) => {
                const cardEntrance = spring({
                  frame: Math.max(0, sceneFrame - idx * 10),
                  fps,
                  config: { damping: 14, stiffness: 130 }
                });
                return (
                  <div
                    key={idx}
                    style={{
                      transform: `translateY(${interpolate(cardEntrance, [0, 1], [60, 0])}px)`,
                      opacity: cardEntrance
                    }}
                  >
                    <GlassCard title={item.name} subtitle={item.sugar} accentColor={item.color}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#fff', fontSize: 16 }}>Botanical Payload:</span>
                        <TelemetryPill label="SEEDS" value={item.seedType} status="active" />
                      </div>
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCENE 5: SPLIT COMPARE (TOMATO PARADOX) */}
        {activeSceneIndex === 4 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 54px'
            }}
          >
            <KineticTitle
              title="THE GREAT DEBATE"
              subtitle="IS TOMATO ACTUALLY A FRUIT?"
              badge="CULINARY VS SCIENCE"
              accentColor="#f43f5e"
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
                marginTop: 36,
                width: '100%',
                maxWidth: 900
              }}
            >
              <GlassCard
                title="KITCHEN VIEW"
                subtitle="Culinary Vegetable"
                accentColor="rgba(255,255,255,0.4)"
              >
                <div style={{ padding: '16px 0', minHeight: 180 }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.5 }}>
                    Savory dinner dish usage. Cooked with garlic, onions, and spices.
                  </p>
                  <div style={{ marginTop: 20 }}>
                    <TelemetryPill label="STATUS" value="VEGETABLE RULE" status="idle" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard
                title="BOTANICAL VIEW"
                subtitle="True Biological Fruit"
                accentColor="#f43f5e"
              >
                <div style={{ padding: '16px 0', minHeight: 180 }}>
                  <p style={{ color: '#fff', fontSize: 16, lineHeight: 1.5 }}>
                    Formed from single flower ovary. Packed with viable internal seeds.
                  </p>
                  <div style={{ marginTop: 20 }}>
                    <TelemetryPill label="EVIDENCE" value="DEFINITIVE FRUIT" status="active" />
                  </div>
                </div>
              </GlassCard>
            </div>
            <div style={{ marginTop: 30, width: '100%', maxWidth: 900 }}>
              <MetricBar label="Botanical Alignment" value={100} maxValue={100} unit="%" color="#f43f5e" />
            </div>
          </div>
        )}

        {/* SCENE 6: HERO CENTER (TOMATO SEED CHAMBERS) */}
        {activeSceneIndex === 5 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 54px'
            }}
          >
            <KineticTitle
              title="SURPRISE DISCOVERY"
              subtitle="INTERNAL SEED CHAMBERS"
              badge="VERIFIED TRUTH"
              accentColor="#38bdf8"
            />
            <div style={{ marginTop: 36, width: '100%', maxWidth: 880 }}>
              <GlassCard
                title="MICRO-INSPECTION: LYCOPERSICON ESCULENTUM"
                subtitle="Locular Cavities and Seed Matrix"
                accentColor="#38bdf8"
              >
                <div style={{ padding: '10px 0' }}>
                  <TerminalWindow
                    title="seed_chamber_analyzer.ts"
                    lines={[
                      '$ inspect-cross-section --target "Tomato"',
                      'Locular Gel Matrix: Present',
                      '+ Discovered: 48 Seed Embarkments in Gel Cavities',
                      '+ Tissue Type: Swollen Pericarp Wall',
                      'BOTANICAL VERDICT: 100% TRUE BERRY / FRUIT'
                    ]}
                  />
                  <div style={{ marginTop: 24 }}>
                    <NetworkNodes
                      nodes={[
                        { id: '1', label: 'Pericarp', x: 60, y: 70 },
                        { id: '2', label: 'Gel Chamber', x: 260, y: 70 },
                        { id: '3', label: 'True Seed', x: 460, y: 70 },
                        { id: '4', label: 'Fruit Verdict', x: 660, y: 70 }
                      ]}
                      connections={[
                        { from: '1', to: '2' },
                        { from: '2', to: '3' },
                        { from: '3', to: '4' }
                      ]}
                    />
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* SCENE 7: FACT CARD (CUCUMBERS & PEPPERS) */}
        {activeSceneIndex === 6 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 54px'
            }}
          >
            <KineticTitle
              title="BOTANICAL SURPRISES"
              subtitle="CUCUMBERS & PEPPERS ARE FRUITS!"
              badge="EXPANDED TAXONOMY"
              accentColor="#f43f5e"
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
                marginTop: 36,
                width: '100%',
                maxWidth: 900
              }}
            >
              <GlassCard title="CUCUMBER" subtitle="Family: Cucurbitaceae" accentColor="#38bdf8">
                <div style={{ padding: '16px 0' }}>
                  <p style={{ color: '#fff', fontSize: 16 }}>Pepo fruit with thick rind and central seeded flesh.</p>
                  <div style={{ marginTop: 14 }}>
                    <TelemetryPill label="TYPE" value="PEPO FRUIT" status="active" />
                  </div>
                </div>
              </GlassCard>
              <GlassCard title="BELL PEPPER" subtitle="Family: Solanaceae" accentColor="#f43f5e">
                <div style={{ padding: '16px 0' }}>
                  <p style={{ color: '#fff', fontSize: 16 }}>Hollow berry packed with central placenta seeds.</p>
                  <div style={{ marginTop: 14 }}>
                    <TelemetryPill label="TYPE" value="BERRY FRUIT" status="active" />
                  </div>
                </div>
              </GlassCard>
            </div>
            <div style={{ marginTop: 24, width: '100%', maxWidth: 900 }}>
              <MetricBar label="Kitchen Produce Reclassified as Fruits" value={85} maxValue={100} unit="%" color="#f43f5e" />
            </div>
          </div>
        )}

        {/* SCENE 8: DATA BADGE (TRUE VEGETABLES) */}
        {activeSceneIndex === 7 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 54px'
            }}
          >
            <KineticTitle
              title="REAL VEGETABLES"
              subtitle="ROOTS, STEMS, & LEAVES"
              badge="STRICT BIOLOGY"
              accentColor="#38bdf8"
            />
            <div style={{ marginTop: 36, width: '100%', maxWidth: 880 }}>
              <GlassCard
                title="THE NO-SEED DEFINITION"
                subtitle="Vegetative Plant Organs"
                accentColor="#38bdf8"
              >
                <div style={{ padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24 }}>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ color: '#38bdf8', fontSize: 20, margin: '0 0 8px 0' }}>CARROTS</h4>
                      <TelemetryPill label="PART" value="TAP ROOT" status="active" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ color: '#38bdf8', fontSize: 20, margin: '0 0 8px 0' }}>SPINACH</h4>
                      <TelemetryPill label="PART" value="LEAF BLADE" status="active" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ color: '#38bdf8', fontSize: 20, margin: '0 0 8px 0' }}>CELERY</h4>
                      <TelemetryPill label="PART" value="PETIOLE STEM" status="active" />
                    </div>
                  </div>
                  <TerminalWindow
                    title="vegetable_matrix.log"
                    lines={[
                      '> Root/Leaf/Stem Analysis complete.',
                      '- Seed pods absent',
                      '- Flower ovary absent',
                      'STATUS: CERTIFIED 100% PURE VEGETABLE'
                    ]}
                  />
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* SCENE 9: BITTRIX TECHNOLOGIES OUTRO */}
        {activeSceneIndex === 8 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BittrixOutroExact />
          </div>
        )}
      </div>

      {/* 3. SYNCHRONIZED KARAOKE CAPTIONS TIER */}
      {/* Placed strictly in safe zone above bottom UI */}
      <div
        style={{
          position: 'absolute',
          bottom: 220,
          left: 54,
          right: 54,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 50,
          pointerEvents: 'none'
        }}
      >
        <SyncCaptions
          words={currentScene.words}
          currentFrame={sceneFrame}
          accentColor={currentScene.themeColor}
        />
      </div>

      {/* Subtle Bottom Border Vignette */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 140,
          background: 'linear-gradient(to top, rgba(7, 8, 14, 0.95), transparent)',
          pointerEvents: 'none',
          zIndex: 40
        }}
      />
    </AbsoluteFill>
  );
}