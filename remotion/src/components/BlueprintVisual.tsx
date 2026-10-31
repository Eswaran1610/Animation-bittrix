import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BlueprintObject, VisualBlueprint } from '../data/sceneTypes';
import { springPresets } from '../theme';
import { assetSource } from '../assetSource';

interface BlueprintVisualProps {
  blueprint: VisualBlueprint;
  imageAssets?: Record<string, string>;
}

const objectStyle = (object: BlueprintObject, frame: number, fps: number, index: number): React.CSSProperties => {
  const entrance = spring({ frame: frame - index * 5, fps, config: springPresets.bouncy });
  const motion = object.motion || '';
  const drift = Math.sin(frame * 0.035 + index) * (motion.match(/float|drift|orbit/i) ? 18 : 5);
  const spinning = motion.match(/rotate|spin|orbit|revolve/i);
  const rotation = (object.rotation || 0) + (spinning ? frame * (0.45 + index * 0.08) : 0);
  const depth = 18 + Math.sin(frame * 0.025 + index) * 12;
  const scale = (object.scale || 1) * interpolate(entrance, [0, 1], [0.35, 1]);
  return {
    position: 'absolute',
    left: `${Math.max(0, Math.min(1, object.x)) * 100}%`,
    top: `${Math.max(0, Math.min(1, object.y)) * 100}%`,
    transform: `translate(-50%, -50%) translate3d(0, ${drift}px, ${depth}px) rotateX(${Math.sin(frame * 0.018 + index) * 5}deg) rotateY(${spinning ? frame * 0.35 : Math.sin(frame * 0.02 + index) * 8}deg) rotateZ(${rotation}deg) scale(${scale})`,
    opacity: entrance,
    transformOrigin: 'center',
    transformStyle: 'preserve-3d',
    perspective: '900px',
  };
};

const renderShapes = (object: BlueprintObject, fallbackColor: string) => {
  const spec = object.render_spec;
  return <>
    {spec.rects?.map((shape, i) => <rect key={`r-${i}`} {...shape} />)}
    {spec.circles?.map((shape, i) => <circle key={`c-${i}`} {...shape} />)}
    {spec.paths?.map((shape, i) => <path key={`p-${i}`} {...shape} />)}
    {spec.polygons?.map((shape, i) => <polygon key={`g-${i}`} {...shape} />)}
    {spec.lines?.map((shape, i) => <line key={`l-${i}`} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={shape.stroke || fallbackColor} strokeWidth={shape.strokeWidth || 3} strokeDasharray={shape.dash} opacity={shape.opacity} />)}
  </>;
};

/** Transparent SVG layers create data-driven depth without a repeated card. */
const VectorObject: React.FC<{ object: BlueprintObject; frame: number; fps: number; index: number }> = ({ object, frame, fps, index }) => {
  const spec = object.render_spec;
  const viewBox = spec.viewBox || [0, 0, 1000, 700];
  const color = object.color || '#38bdf8';
  const style = objectStyle(object, frame, fps, index);
  const width = 260 + (index % 3) * 90;
  const height = 180 + (index % 2) * 70;
  return <div style={{ ...style, width, height, filter: `drop-shadow(0 0 18px ${color}66)` }}>
    {[4, 3, 2, 1, 0].map((layer) => (
      <svg key={layer} viewBox={viewBox.join(' ')} width="100%" height="100%" style={{ position: 'absolute', inset: 0, transform: `translate3d(${layer * 4}px, ${layer * 4}px, ${-layer * 7}px)`, opacity: layer === 0 ? 1 : 0.18 }}>
        {renderShapes(object, color)}
      </svg>
    ))}
  </div>;
};

const ThreeDObject: React.FC<{ object: BlueprintObject; frame: number; fps: number; index: number }> = ({ object, frame, fps, index }) => {
  const color = object.color || '#38bdf8';
  const primitive = object.render_spec.primitive || 'sphere';
  const style = objectStyle(object, frame, fps, index);
  const spin = frame * (0.55 + index * 0.07);
  const node = (key: string, left: string, top: string, size = 22) => <span key={key} style={{ position: 'absolute', left, top, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 30% 25%, #fff, ${color} 25%, #05070f 100%)`, boxShadow: `0 0 18px ${color}` }} />;

  if (primitive === 'cube') {
    const face = (key: string, transform: string, background: string) => <span key={key} style={{ position: 'absolute', inset: 0, width: 150, height: 150, border: `2px solid ${color}`, background, backfaceVisibility: 'hidden', transform }} />;
    return <div style={{ ...style, width: 150, height: 150, transform: `${style.transform} rotateX(${spin * 0.6}deg) rotateY(${spin}deg)` }}><div style={{ width: 150, height: 150, position: 'relative', transformStyle: 'preserve-3d' }}>{face('front', 'translateZ(75px)', `${color}44`)}{face('back', 'rotateY(180deg) translateZ(75px)', `${color}22`)}{face('right', 'rotateY(90deg) translateZ(75px)', `${color}33`)}{face('left', 'rotateY(-90deg) translateZ(75px)', `${color}22`)}{face('top', 'rotateX(90deg) translateZ(75px)', `${color}55`)}{face('bottom', 'rotateX(-90deg) translateZ(75px)', `${color}11`)}</div></div>;
  }
  if (primitive === 'torus') return <div style={{ ...style, width: 210, height: 210, border: `22px solid ${color}`, borderRadius: '50%', boxShadow: `inset 0 0 28px ${color}, 0 0 28px ${color}88`, background: 'transparent', transform: `${style.transform} rotateX(${58 + Math.sin(frame * 0.02) * 12}deg) rotateY(${spin}deg)` }} />;
  if (primitive === 'cylinder') return <div style={{ ...style, width: 150, height: 210, borderRadius: '50% / 15%', border: `3px solid ${color}`, background: `linear-gradient(90deg, ${color}22, ${color}aa 48%, ${color}22)`, boxShadow: `0 0 30px ${color}77`, transform: `${style.transform} rotateY(${spin}deg)` }}><span style={{ position: 'absolute', inset: '-3px 0 auto', height: 42, border: `3px solid ${color}`, borderRadius: '50%', background: `${color}33` }} /></div>;
  if (primitive === 'molecule') return <div style={{ ...style, width: 240, height: 190, transform: `${style.transform} rotateY(${spin}deg)` }}><div style={{ position: 'absolute', left: 56, top: 62, width: 125, height: 65, border: `3px solid ${color}99`, borderRadius: '50%', transform: 'rotate(-25deg)', boxShadow: `0 0 20px ${color}55` }} />{node('center', '44%', '35%', 48)}{node('a', '4%', '44%')}{node('b', '78%', '18%')}{node('c', '68%', '72%')}</div>;
  return <div style={{ ...style, width: 190, height: 190, borderRadius: '50%', background: `radial-gradient(circle at 28% 22%, #ffffff 0%, ${color} 16%, ${color}88 42%, #05070f 78%)`, boxShadow: `0 0 45px ${color}aa, inset -22px -18px 28px #000b`, transform: `${style.transform} rotateY(${spin}deg)` }}><span style={{ position: 'absolute', inset: '18% 8%', border: `2px solid ${color}99`, borderRadius: '50%', transform: `rotate(${spin * 0.7}deg)` }} /></div>;
};

const BlueprintObjectView: React.FC<{ object: BlueprintObject; frame: number; fps: number; index: number; imageAssets: Record<string, string> }> = ({ object, frame, fps, index, imageAssets }) => {
  const color = object.color || '#38bdf8';
  const style = objectStyle(object, frame, fps, index);
  const spec = object.render_spec;
  // AGY may phrase an object query slightly differently from the scene-level
  // query that produced the downloaded file. Prefer the exact match, then use
  // the first scene asset so a verified imported image never degrades to text.
  const imageUrl = (spec.asset_query ? imageAssets[spec.asset_query] : undefined) || Object.values(imageAssets)[0];
  if (spec.type === '3d') return <ThreeDObject object={object} frame={frame} fps={fps} index={index} />;
  if (spec.type === 'image' && imageUrl) {
    const clipPath = index % 3 === 0 ? 'circle(48% at 50% 50%)' : index % 3 === 1 ? 'polygon(8% 0, 92% 0, 100% 82%, 50% 100%, 0 82%)' : 'inset(0 round 28px 4px 28px 4px)';
    return <div style={{ ...style, width: 300 + (index % 2) * 100, height: 210, clipPath, border: `2px solid ${color}`, boxShadow: `0 0 32px ${color}77`, overflow: 'hidden' }}><Img src={assetSource(imageUrl)} alt={object.label || 'AGY-selected asset'} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `saturate(1.25) contrast(1.08) hue-rotate(${index * 9}deg)` }} /><div style={{ position: 'absolute', left: '10%', bottom: '8%', color: '#fff', fontSize: '14px', fontWeight: 800, textShadow: `0 2px 14px #000, 0 0 12px ${color}` }}>{object.label}</div></div>;
  }
  if (spec.type === 'vector') return <VectorObject object={object} frame={frame} fps={fps} index={index} />;
  const text = spec.text || object.label || object.id;
  return <div style={{ ...style, minWidth: 130, maxWidth: 330, padding: '9px 0', color: '#f8fafc', textAlign: 'center', fontWeight: 900, fontSize: `${18 + (index % 3) * 5}px`, letterSpacing: '0.04em', textShadow: `0 0 18px ${color}, 0 4px 18px #000`, borderBottom: `3px solid ${color}`, background: `linear-gradient(90deg, transparent, ${color}33, transparent)` }}>{text}</div>;
};

export const BlueprintVisual: React.FC<BlueprintVisualProps> = ({ blueprint, imageAssets = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', perspective: '1200px', transformStyle: 'preserve-3d' }}>{blueprint.objects.map((object, index) => <BlueprintObjectView key={object.id} object={object} frame={frame} fps={fps} index={index} imageAssets={imageAssets} />)}</div>;
};
