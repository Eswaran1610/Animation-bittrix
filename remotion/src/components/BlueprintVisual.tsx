import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { Img, cancelRender, continueRender, delayRender, interpolate, prefetch, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BlueprintObject, StyleBrief, VisualBlueprint } from '../data/sceneTypes';
import { springPresets } from '../theme';
import { assetSource } from '../assetSource';
import { MODEL_LIBRARY_FILE, ModelLibraryEntry, getModelLibraryEntry } from '../data/modelLibrary';

interface BlueprintVisualProps {
  blueprint: VisualBlueprint;
  imageAssets?: Record<string, string>;
  durationInFrames: number;
  styleBrief?: StyleBrief;
  globalFrame?: number;
}

/**
 * A data-neutral 3D anchor keeps every technical blueprint feeling like one
 * cohesive animation: information emerges from and returns to a live core,
 * instead of sitting on a static slide.
 */
const KineticCore: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const spin = frame * 0.42;
  const breathe = 1 + Math.sin(frame * 0.075) * 0.055;
  const glow = 32 + Math.sin(frame * 0.09) * 12;
  return <div style={{ position: 'absolute', left: '50%', top: '55%', width: 220, height: 220, transform: `translate(-50%, -50%) scale(${breathe})`, transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
    {[0, 1, 2].map((layer) => <div key={layer} style={{ position: 'absolute', inset: 0, borderRadius: 38, border: `2px solid ${color}${layer === 0 ? 'dd' : '55'}`, background: layer === 0 ? `linear-gradient(135deg, #ffffff66 0%, ${color}cc 34%, ${color}44 66%, #090d18 100%)` : `${color}22`, boxShadow: layer === 0 ? `0 0 ${glow}px ${color}aa, inset 18px 18px 28px #ffffff33, inset -22px -22px 34px #0009` : 'none', transform: `translate3d(${layer * 11}px, ${layer * 11}px, ${-layer * 24}px) rotateX(${58 + Math.sin(frame * .03) * 10}deg) rotateY(${spin}deg) rotateZ(${Math.sin(frame * .025) * 8}deg)` }} />)}
    <div style={{ position: 'absolute', inset: '27%', borderRadius: '50%', background: '#ffffffcc', boxShadow: `0 0 28px 12px ${color}`, transform: `translateZ(34px) scale(${1 + Math.sin(frame * .13) * .18})` }} />
  </div>;
};

const ParticleField: React.FC<{ frame: number; color: string }> = ({ frame, color }) => <>
  {Array.from({ length: 28 }, (_, index) => {
    const baseX = (index * 37) % 94 + 3;
    const baseY = (index * 61) % 86 + 7;
    const travel = frame * (0.18 + (index % 4) * 0.035);
    const x = baseX + Math.sin(travel + index) * (4 + index % 5);
    const y = baseY + Math.cos(travel * .83 + index) * (5 + index % 4);
    const size = 2 + index % 4;
    return <span key={index} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: '50%', background: index % 3 === 0 ? '#ffffff' : color, opacity: .24 + (index % 5) * .12, boxShadow: `0 0 ${size * 3}px ${color}`, transform: `scale(${.8 + Math.sin(frame * .1 + index) * .35})` }} />;
  })}
</>;

const objectStyle = (object: BlueprintObject, frame: number, fps: number, index: number, durationInFrames: number, personality: StyleBrief['motionPersonality'] = 'fluid'): React.CSSProperties => {
  const springConfig = springPresets.snappy;
  const motion = object.motion || '';
  const plan = object.motion_plan;
  const isText = object.render_spec.type === 'text';
  const smoothstep = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const isContinuing = (plan?.enter_frame === 0) || /hold|remain|stay|still|continuous|settle|gentle/i.test(motion);
  const stagger = Math.max(0, Math.min(20, plan?.stagger_frames ?? 5));
  const entranceFrame = frame - (plan?.enter_frame ?? index * stagger) - index * stagger;
  const entrance = isContinuing
    ? 1
    : isText
      ? smoothstep(entranceFrame / 12)
      : spring({ frame: entranceFrame, fps, config: springConfig });
  const textSlideY = (isText && !isContinuing) ? interpolate(entrance, [0, 1], [30, 0]) : 0;
  const movementStart = Math.min(durationInFrames - 1, plan?.hold_start_frame ?? plan?.enter_frame ?? 8 + index * 4);
  const movementEnd = Math.max(movementStart + 1, plan?.hold_end_frame ?? durationInFrames - 10);
  const movementProgress = smoothstep((frame - movementStart) / (movementEnd - movementStart));
  const x = interpolate(movementProgress, [0, 1], [object.x, object.to_x ?? object.x]);
  const y = interpolate(movementProgress, [0, 1], [object.y, object.to_y ?? object.y]);
  const idle = plan?.idle || (motion.match(/orbit/i) ? 'orbit' : motion.match(/float|drift/i) ? 'float' : motion.match(/pulse|glow/i) ? 'pulse' : 'drift');
  // Every object has a substantial but controlled idle path. Static data from
  // a blueprint must still read as motion graphics, not a glowing slide.
  const driftMultiplier = personality === 'snappy' ? 0.75 : personality === 'precise' ? 0.5 : personality === 'bouncy' ? 1.25 : 1;
  const driftAmplitude = (idle === 'float' || idle === 'drift' || idle === 'orbit' ? 42 : 22) * driftMultiplier;
  const drift = Math.sin(frame * 0.045 + index * 1.7) * driftAmplitude;
  const lateralDrift = Math.cos(frame * 0.037 + index * 1.3) * driftAmplitude * 0.72;
  const spinning = motion.match(/rotate|spin|orbit|revolve/i);
  const rotation = (object.rotation || 0) + (spinning ? frame * (0.45 + index * 0.08) : 0);
  const depth = 18 + Math.sin(frame * 0.025 + index) * 12;
  const idleScale = 1 + Math.sin(frame * 0.055 + index * 1.4) * (idle === 'pulse' ? 0.07 : 0.035);
  // Seamless object continuity: no exit shrinking so objects hold stably across scene transitions
  const exit = 1;
  const scale = (object.scale || 1) * idleScale * (isContinuing ? 1 : interpolate(entrance, [0, 1], [0.5, 1])) * exit;
  return {
    position: 'absolute',
    left: `${Math.max(0, Math.min(1, x)) * 100}%`,
    top: `${Math.max(0, Math.min(1, y)) * 100}%`,
    transform: `translate(-50%, -50%) translate3d(${lateralDrift}px, ${drift + textSlideY}px, ${depth}px) rotateX(${Math.sin(frame * 0.028 + index) * 8}deg) rotateY(${spinning ? frame * 0.55 : Math.sin(frame * 0.032 + index) * 12}deg) rotateZ(${rotation}deg) scale(${scale})`,
    opacity: entrance,
    transformOrigin: 'center',
    transformStyle: 'preserve-3d',
    perspective: '900px',
  };
};

const renderShapes = (object: BlueprintObject, fallbackColor: string, drawProgress = 1) => {
  const spec = object.render_spec;
  return <>
    {spec.rects?.map((shape, i) => <rect key={`r-${i}`} {...shape} />)}
    {spec.circles?.map((shape, i) => <circle key={`c-${i}`} {...shape} />)}
    {spec.paths?.map((shape, i) => <path key={`p-${i}`} {...shape} pathLength={1} strokeDasharray={shape.stroke ? '1' : undefined} strokeDashoffset={shape.stroke ? 1 - drawProgress : undefined} />)}
    {spec.polygons?.map((shape, i) => <polygon key={`g-${i}`} {...shape} />)}
    {spec.lines?.map((shape, i) => <line key={`l-${i}`} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={shape.stroke || fallbackColor} strokeWidth={shape.strokeWidth || 3} strokeDasharray={shape.dash} opacity={shape.opacity} />)}
  </>;
};

/** Transparent SVG layers create data-driven depth without a repeated card. */
const VectorObject: React.FC<{ object: BlueprintObject; frame: number; fps: number; index: number; durationInFrames: number; personality?: StyleBrief['motionPersonality'] }> = ({ object, frame, fps, index, durationInFrames, personality = 'fluid' }) => {
  const spec = object.render_spec;
  const viewBox = spec.viewBox || [0, 0, 1000, 700];
  const color = object.color || '#38bdf8';
  const style = objectStyle(object, frame, fps, index, durationInFrames, personality);
  const width = 620 + (index % 3) * 120;
  const height = 430 + (index % 2) * 110;
  const drawProgress = interpolate(frame, [0, Math.min(durationInFrames - 1, 30)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div style={{ ...style, width, height, filter: `drop-shadow(0 0 18px ${color}66)` }}>
    {[4, 3, 2, 1, 0].map((layer) => (
      <svg key={layer} viewBox={viewBox.join(' ')} width="100%" height="100%" style={{ position: 'absolute', inset: 0, transform: `translate3d(${layer * 4}px, ${layer * 4}px, ${-layer * 7}px)`, opacity: layer === 0 ? 1 : 0.18 }}>
        {renderShapes(object, color, drawProgress)}
      </svg>
    ))}
  </div>;
};

const ThreeDObject: React.FC<{ object: BlueprintObject; frame: number; fps: number; index: number; durationInFrames: number; personality?: StyleBrief['motionPersonality'] }> = ({ object, frame, fps, index, durationInFrames, personality = 'fluid' }) => {
  const color = object.color || '#38bdf8';
  const primitive = object.render_spec.primitive || 'sphere';
  const style = objectStyle(object, frame, fps, index, durationInFrames, personality);
  const spin = frame * (0.55 + index * 0.07);
  const node = (key: string, left: string, top: string, size = 22) => <span key={key} style={{ position: 'absolute', left, top, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 30% 25%, #fff, ${color} 25%, #05070f 100%)`, boxShadow: `0 0 18px ${color}` }} />;

 if (primitive === 'cube') {
   const face = (key: string, transform: string, background: string) => <span key={key} style={{ position: 'absolute', inset: 0, width: 150, height: 150, border: `2px solid ${color}`, background, backfaceVisibility: 'hidden', transform }} />;
   return <div style={{ ...style, width: 150, height: 150, transform: `${style.transform} rotateX(${spin * 0.6}deg) rotateY(${spin}deg)` }}><div style={{ width: 150, height: 150, position: 'relative', transformStyle: 'preserve-3d' }}>{face('front', 'translateZ(75px)', `${color}44`)}{face('back', 'rotateY(180deg) translateZ(75px)', `${color}22`)}{face('right', 'rotateY(90deg) translateZ(75px)', `${color}33`)}{face('left', 'rotateY(-90deg) translateZ(75px)', `${color}22`)}{face('top', 'rotateX(90deg) translateZ(75px)', `${color}55`)}{face('bottom', 'rotateX(-90deg) translateZ(75px)', `${color}11`)}</div></div>;
 }
  if (primitive === 'keyboard') {
    const rows = [
      ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'],
      ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '['],
      ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '↵'],
      ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
      ['Ctrl', 'Fn', 'Alt', 'Space', 'Alt', '←', '↓', '→'],
    ];
    return <div style={{ ...style, width: 380, height: 210, transform: `${style.transform} rotateX(56deg)` }}>
      <div style={{ position: 'absolute', inset: 0, padding: 14, border: `3px solid ${color}`, borderRadius: 22, background: `linear-gradient(145deg, ${color}99, #07101ddd 58%, #02040a)`, boxShadow: `0 18px 32px #000b, 0 0 32px ${color}88`, transformStyle: 'preserve-3d' }}>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 12, height: 5, borderRadius: 99, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 14px ${color}` }} />
        <div style={{ position: 'relative', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5, transform: `translateZ(12px)` }}>
          {rows.map((row, rowIndex) => <div key={rowIndex} style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {row.map((keyLabel, keyIndex) => {
              const isSpace = keyLabel === 'Space';
              const keyWidth = isSpace ? 104 : keyLabel.length > 3 ? 38 : 24;
              const keyLift = Math.sin(frame * 0.08 + rowIndex * 0.7 + keyIndex) * 1.5;
              return <span key={`${rowIndex}-${keyIndex}`} style={{ width: keyWidth, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: '#fff', fontSize: 7, fontWeight: 800, background: `linear-gradient(145deg, #ffffffaa, ${color}99 35%, #101827)`, border: `1px solid ${color}bb`, boxShadow: `0 ${3 + keyLift}px 0 #02040a, 0 0 8px ${color}55`, transform: `translateY(${keyLift}px)` }}>{keyLabel}</span>;
            })}
          </div>)}
        </div>
      </div>
    </div>;
  }
 if (primitive === 'torus') return <div style={{ ...style, width: 210, height: 210, border: `22px solid ${color}`, borderRadius: '50%', boxShadow: `inset 0 0 28px ${color}, 0 0 28px ${color}88`, background: 'transparent', transform: `${style.transform} rotateX(${58 + Math.sin(frame * 0.02) * 12}deg) rotateY(${spin}deg)` }} />;
  if (primitive === 'cylinder') return <div style={{ ...style, width: 150, height: 210, borderRadius: '50% / 15%', border: `3px solid ${color}`, background: `linear-gradient(90deg, ${color}22, ${color}aa 48%, ${color}22)`, boxShadow: `0 0 30px ${color}77`, transform: `${style.transform} rotateY(${spin}deg)` }}><span style={{ position: 'absolute', inset: '-3px 0 auto', height: 42, border: `3px solid ${color}`, borderRadius: '50%', background: `${color}33` }} /></div>;
  if (primitive === 'molecule') return <div style={{ ...style, width: 240, height: 190, transform: `${style.transform} rotateY(${spin}deg)` }}><div style={{ position: 'absolute', left: 56, top: 62, width: 125, height: 65, border: `3px solid ${color}99`, borderRadius: '50%', transform: 'rotate(-25deg)', boxShadow: `0 0 20px ${color}55` }} />{node('center', '44%', '35%', 48)}{node('a', '4%', '44%')}{node('b', '78%', '18%')}{node('c', '68%', '72%')}</div>;
  return <div style={{ ...style, width: 190, height: 190, borderRadius: '50%', background: `radial-gradient(circle at 28% 22%, #ffffff 0%, ${color} 16%, ${color}88 42%, #05070f 78%)`, boxShadow: `0 0 45px ${color}aa, inset -22px -18px 28px #000b`, transform: `${style.transform} rotateY(${spin}deg)` }}><span style={{ position: 'absolute', inset: '18% 8%', border: `2px solid ${color}99`, borderRadius: '50%', transform: `rotate(${spin * 0.7}deg)` }} /></div>;
};

const SharedModel: React.FC<{ entry?: ModelLibraryEntry; modelUrl?: string; frame: number; color: string }> = ({ entry, modelUrl, frame, color }) => {
  const gltf = useLoader(GLTFLoader, assetSource(modelUrl || MODEL_LIBRARY_FILE));
  const model = useMemo(() => {
    const namedNode = entry?.node ? gltf.scene.getObjectByName(entry.node) : null;
    const clone = (namedNode || gltf.scene).clone(true);
    clone.traverse((child) => {
      if ('isMesh' in child && child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [entry?.node, gltf.scene]);
  const spin = frame * 0.012;
  const fitScale = useMemo(() => {
    if (entry) return entry.scale || 1;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const largestDimension = Math.max(size.x, size.y, size.z, 0.001);
    return 2.2 / largestDimension;
  }, [entry, model]);
  const center = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(model);
    return bounds.getCenter(new THREE.Vector3());
  }, [model]);
  return <group rotation={entry?.rotation || [0, 0, 0]}>
    <primitive object={model} scale={fitScale} position={entry ? [0, 0, 0] : [-center.x * fitScale, -center.y * fitScale, -center.z * fitScale]} rotation={[0, spin, 0]} />
    <pointLight color={color} intensity={0.4} distance={5} />
  </group>;
};

class Model3DErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[PLAYBOOK QA FAIL] Downloaded 3D model failed to load: ${error.message}`);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const Model3DObject: React.FC<{ object: BlueprintObject; frame: number; fps: number; index: number; durationInFrames: number; personality?: StyleBrief['motionPersonality'] }> = ({ object, frame, fps, index, durationInFrames, personality = 'fluid' }) => {
  const modelId = object.render_spec.model_id;
  const entry = getModelLibraryEntry(modelId);
  const modelUrl = object.render_spec.model_url;
  if ((!modelId || !entry) && !modelUrl) {
    return <ThreeDObject object={object} frame={frame} fps={fps} index={index} durationInFrames={durationInFrames} personality={personality} />;
  }
  const color = object.color || '#38bdf8';
  const style = objectStyle(object, frame, fps, index, durationInFrames, personality);
  const fallback = modelUrl
    ? <div style={{ ...style, width: 300, padding: 12, color: '#fecaca', background: '#450a0a', border: '2px solid #ef4444', borderRadius: 10, fontSize: 14, fontWeight: 800, textAlign: 'center' }}>3D MODEL FAILED TO LOAD: {object.label || object.id}</div>
    : <ThreeDObject object={object} frame={frame} fps={fps} index={index} durationInFrames={durationInFrames} personality={personality} />;
  return <Model3DErrorBoundary fallback={fallback}>
    <Suspense fallback={fallback}>
      <div style={{ ...style, width: 360, height: 360, background: 'transparent' }}>
        <ThreeCanvas width={360} height={360} camera={{ position: [0, 0, 4], fov: 35 }} dpr={1} gl={{ alpha: true, antialias: true }} style={{ width: '100%', height: '100%' }}>
          <ambientLight intensity={1.25} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} color={color} />
          <directionalLight position={[-3, 1, 2]} intensity={1.1} color="#ffffff" />
          <SharedModel entry={entry} modelUrl={modelUrl} frame={frame} color={color} />
        </ThreeCanvas>
      </div>
    </Suspense>
  </Model3DErrorBoundary>;
};

const BlueprintAssetPreloader: React.FC<{ blueprint: VisualBlueprint; imageAssets: Record<string, string> }> = ({ blueprint, imageAssets }) => {
  const assets = useMemo(() => {
    const values = blueprint.objects.flatMap((object) => {
      const spec = object.render_spec;
      const image = spec.asset_url || (spec.asset_query ? imageAssets[spec.asset_query] : undefined);
      const model = spec.type === '3d' ? (spec.model_url || MODEL_LIBRARY_FILE) : undefined;
      return [image, model].filter((asset): asset is string => Boolean(asset));
    });
    return Array.from(new Set(values));
  }, [blueprint.objects, imageAssets]);
  const [handle] = useState(() => delayRender('Preloading blueprint assets'));

  useEffect(() => {
    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        cancelRender(new Error(`Blueprint asset preload timed out after 30000ms (${assets.length} assets)`));
      }
    }, 30000);
    const requests = assets.map((asset) => prefetch(assetSource(asset), { method: 'blob-url' }));
    Promise.all(requests.map((request) => request.waitUntilDone()))
      .then(() => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          continueRender(handle);
        }
      })
      .catch((error) => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          cancelRender(error);
        }
      });
    return () => {
      finished = true;
      clearTimeout(timeout);
    };
  }, [assets, handle]);

  return null;
};

const BlueprintObjectView: React.FC<{ object: BlueprintObject; frame: number; fps: number; index: number; durationInFrames: number; imageAssets: Record<string, string>; personality?: StyleBrief['motionPersonality']; palette?: StyleBrief['palette']; archetype?: StyleBrief['archetype'] }> = ({ object, frame, fps, index, durationInFrames, imageAssets, personality = 'fluid', palette, archetype }) => {
  const color = object.color || (index % 2 ? palette?.accent : palette?.primary) || '#38bdf8';
  const style = objectStyle(object, frame, fps, index, durationInFrames, personality);
  const spec = object.render_spec;
  // A specifically requested query must resolve to its own fetched image; do
  // not silently show a different object's asset when that query is missing.
  // Never substitute another object's image. A local asset must be tied to
  // this exact blueprint object or the render should fail preflight.
  const imageUrl = spec.asset_url || (spec.asset_query ? imageAssets[spec.asset_query] : undefined);
  if (spec.type === '3d') return <Model3DObject object={object} frame={frame} fps={fps} index={index} durationInFrames={durationInFrames} personality={personality} />;
  if (spec.type === 'image' && imageUrl) {
    const clipPath = index % 3 === 0 ? 'circle(48% at 50% 50%)' : index % 3 === 1 ? 'polygon(8% 0, 92% 0, 100% 82%, 50% 100%, 0 82%)' : 'inset(0 round 28px 4px 28px 4px)';
    const imageRadius = archetype === 'neo-brutalist' ? '0' : archetype === 'paper-cutout' ? '18px 5px 18px 5px' : '28px 4px 28px 4px';
    return <div style={{ ...style, width: 300 + (index % 2) * 100, height: 210, clipPath, border: `2px solid ${color}`, borderRadius: imageRadius, boxShadow: archetype === 'paper-cutout' ? `14px 14px 0 ${color}99` : `0 0 32px ${color}77`, overflow: 'hidden' }}><Img src={assetSource(imageUrl)} alt={object.label || 'Codex-selected asset'} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: archetype === 'paper-cutout' ? 'saturate(0.9) contrast(1.08)' : `saturate(1.25) contrast(1.08) hue-rotate(${index * 9}deg)` }} /><div style={{ position: 'absolute', left: '10%', bottom: '8%', color: palette?.text || '#fff', fontSize: '14px', fontWeight: 800, textShadow: `0 2px 14px #000, 0 0 12px ${color}` }}>{object.label}</div></div>;
  }
  if (spec.type === 'vector') return <VectorObject object={object} frame={frame} fps={fps} index={index} durationInFrames={durationInFrames} personality={personality} />;
  const text = spec.text || object.label || object.id;
  return <div style={{ ...style, minWidth: 130, maxWidth: 330, padding: '9px 0', color: '#f8fafc', textAlign: 'center', fontWeight: 900, fontSize: `${18 + (index % 3) * 5}px`, letterSpacing: '0.04em', textShadow: `0 0 18px ${color}, 0 4px 18px #000`, borderBottom: `3px solid ${color}`, background: `linear-gradient(90deg, transparent, ${color}33, transparent)` }}>{text}</div>;
};

export const BlueprintVisual: React.FC<BlueprintVisualProps> = ({ blueprint, imageAssets = {}, durationInFrames, styleBrief, globalFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ambientFrame = globalFrame ?? frame;
  const scan = (ambientFrame * 9) % 1400 - 180;
  const coreColor = blueprint.objects[0]?.color || styleBrief?.palette.primary || '#8b5cf6';
  const accentColor = styleBrief?.palette.accent || '#F59E0B';
  const background = styleBrief?.background || 'grid';
  const backgroundStyle = background === 'halftone'
    ? { backgroundImage: `radial-gradient(${accentColor}66 2px, transparent 2px)`, backgroundSize: '22px 22px', backgroundPosition: `${ambientFrame * 0.4}px ${ambientFrame * 0.2}px` }
    : background === 'lines'
      ? { backgroundImage: `repeating-linear-gradient(${45 + Math.sin(ambientFrame * 0.01) * 10}deg, ${coreColor}22 0 2px, transparent 2px 26px)`, backgroundPosition: `${ambientFrame * 1.2}px ${ambientFrame * 0.6}px` }
      : background === 'gradient-flow'
        ? { background: `radial-gradient(circle at ${35 + Math.sin(ambientFrame * 0.02) * 20}% ${30 + Math.cos(ambientFrame * 0.017) * 15}%, ${coreColor}44, transparent 48%), linear-gradient(135deg, ${styleBrief?.palette.bg || '#05070f'}, ${accentColor}33)` }
        : { backgroundImage: background === 'particles' ? undefined : `linear-gradient(${coreColor}28 1px, transparent 1px), linear-gradient(90deg, ${coreColor}28 1px, transparent 1px)`, backgroundSize: '72px 72px', backgroundPosition: `${ambientFrame * 1.8}px ${ambientFrame * 1.1}px` };
  const archetypeStyle = styleBrief?.archetype === 'neo-brutalist'
    ? { border: `4px solid ${styleBrief.palette.text}`, boxShadow: `12px 12px 0 ${accentColor}` }
    : styleBrief?.archetype === 'glass-ui'
      ? { backdropFilter: 'blur(4px)', backgroundColor: `${styleBrief.palette.bg}55` }
      : styleBrief?.archetype === 'retro-terminal'
        ? { fontFamily: 'Courier New, monospace', filter: 'contrast(1.12)' }
        : styleBrief?.archetype === 'paper-cutout'
          ? { filter: 'saturate(0.82)', transform: `rotate(${Math.sin(ambientFrame * 0.012) * 0.5}deg)` }
          : {};
  return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', perspective: '1200px', transformStyle: 'preserve-3d', ...archetypeStyle }}>
    <div style={{ position: 'absolute', inset: 0, opacity: 0.18, maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)', ...backgroundStyle }} />
    {(background === 'particles' || styleBrief?.archetype === 'isometric-diagram' || styleBrief?.archetype === 'data-story') && <ParticleField frame={ambientFrame} color={accentColor} />}
    {!blueprint.objects.some((obj) => obj.render_spec.type === '3d' || obj.render_spec.type === 'image' || (obj.render_spec.type === 'vector' && ((obj.render_spec.paths?.length ?? 0) > 0 || (obj.render_spec.circles?.length ?? 0) > 0 || (obj.render_spec.rects?.length ?? 0) > 0))) && (
      <KineticCore frame={ambientFrame} color={coreColor} />
    )}
    <BlueprintAssetPreloader blueprint={blueprint} imageAssets={imageAssets} />
    <div style={{ position: 'absolute', top: 0, bottom: 0, width: 96, left: scan, opacity: 0.14, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent)', transform: 'skewX(-16deg)' }} />
    {blueprint.objects.map((object, index) => <BlueprintObjectView key={object.id} object={object} frame={frame} fps={fps} index={index} durationInFrames={durationInFrames} imageAssets={imageAssets} personality={styleBrief?.motionPersonality} palette={styleBrief?.palette} archetype={styleBrief?.archetype} />)}
  </div>;
};
