import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { StyleProfile, WebsiteView } from '../data/sceneTypes';
import { springPresets } from '../theme';

interface WebsiteVisitVisualProps {
  view: WebsiteView;
  accent: string;
  imageAssets?: Record<string, string>;
  styleProfile?: StyleProfile;
}

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const panelStyle = (accent: string, index: number): React.CSSProperties => ({
  background: index % 2 === 0 ? '#ffffff' : '#f1f7fb',
  border: `1px solid ${accent}35`,
  borderTop: `4px solid ${accent}`,
  borderRadius: 14,
  padding: '18px 20px',
  boxShadow: '0 10px 28px rgba(15, 23, 42, .08)',
});

export const WebsiteVisitVisual: React.FC<WebsiteVisitVisualProps> = ({ view, accent, imageAssets = {}, styleProfile }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const entrance = spring({ frame, fps: 30, config: springPresets.soft });
  const contentY = interpolate(frame, [0, 24, durationInFrames - 24, durationInFrames], [36, 0, 0, -18], clamp);
  const cursorX = interpolate(frame, [0, durationInFrames], [8, 86], clamp);
  const cursorY = interpolate(frame, [0, durationInFrames], [74, 42], clamp);
  const pageAccent = view.panels[0]?.accent || accent;
  const panels = view.panels.slice(0, 4);
  const importedImage = Object.values(imageAssets)[0];
  const family = styleProfile?.family || 'editorial-paper';
  const darkChrome = family === 'cinematic-neon' || family === 'technical-terminal';
  const frameRadius = family === 'playful-pop' ? 30 : family === 'technical-terminal' ? 8 : 18;
  const chromeSurface = darkChrome ? '#111827' : family === 'playful-pop' ? '#fff1f2' : '#e8eef4';
  const addressSurface = darkChrome ? '#1f2937' : '#ffffff';
  const frameSurface = family === 'playful-pop' ? '#fff7ed' : '#f7fbff';

  return (
    <div style={{ position: 'absolute', inset: 0, perspective: '1400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', width: '92%', height: '96%', overflow: 'hidden',
        background: frameSurface, border: `1px solid ${darkChrome ? styleProfile?.primary || accent : '#cbd5e1'}`,
        borderRadius: frameRadius,
        boxShadow: '0 24px 70px rgba(15, 23, 42, .32)',
        transform: `translateY(${contentY}px) rotateX(${interpolate(entrance, [0, 1], [7, 0])}deg)`,
        opacity: entrance,
      }}>
        <div style={{ height: 38, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: chromeSurface, borderBottom: '1px solid #cbd5e1' }}>
          {['#fb7185', '#fbbf24', '#34d399'].map((color) => <span key={color} style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />)}
          <div style={{ marginLeft: 12, flex: 1, height: 23, borderRadius: 7, background: addressSurface, color: darkChrome ? '#cbd5e1' : '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', padding: '0 12px', fontFamily: 'Arial, sans-serif' }}>
            <span style={{ color: '#16a34a', marginRight: 7 }}>●</span>{view.url}{view.route === '/' ? '' : view.route}
          </div>
        </div>

        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', background: darkChrome ? '#0f172a' : '#ffffff', borderBottom: '1px solid #e2e8f0', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ color: darkChrome ? '#f8fafc' : '#0f172a', fontWeight: 900, fontSize: 21, letterSpacing: '-.04em' }}>{view.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</div>
          <div style={{ display: 'flex', gap: 22, color: darkChrome ? '#cbd5e1' : '#475569', fontSize: 12, fontWeight: 700 }}>
            {view.nav_items.slice(0, 5).map((item) => <span key={item}>{item}</span>)}
          </div>
          <div style={{ borderRadius: 999, padding: '8px 15px', color: '#ffffff', background: pageAccent, fontSize: 11, fontWeight: 800 }}>{view.cta}</div>
        </div>

        <div style={{ position: 'absolute', top: 90, right: 0, bottom: 0, left: 0, overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
          {view.layout_variant === 'hero' && (
            <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 22, padding: '30px 42px', background: 'linear-gradient(135deg, #ffffff 0%, #effaff 55%, #eaf5ff 100%)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: `translateX(${interpolate(entrance, [0, 1], [-35, 0])}px)` }}>
                <div style={{ color: pageAccent, fontSize: 12, letterSpacing: 2.5, fontWeight: 900, textTransform: 'uppercase' }}>{view.hero_label}</div>
                <div style={{ color: '#0f172a', fontSize: 42, lineHeight: 1.04, fontWeight: 900, maxWidth: 570, marginTop: 12 }}>{view.hero_heading}</div>
                <div style={{ color: '#475569', fontSize: 16, lineHeight: 1.45, maxWidth: 520, marginTop: 15 }}>{view.hero_body}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  <div style={{ color: '#ffffff', background: pageAccent, borderRadius: 8, padding: '11px 18px', fontWeight: 800, fontSize: 13 }}>{view.cta}</div>
                  <div style={{ color: pageAccent, border: `1px solid ${pageAccent}66`, borderRadius: 8, padding: '11px 18px', fontWeight: 800, fontSize: 13 }}>Explore</div>
                </div>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: 285, height: 285, borderRadius: '50%', border: `18px solid ${pageAccent}22`, boxShadow: `0 0 0 28px ${pageAccent}10`, transform: `rotate(${frame * .7}deg)` }} />
                <div style={{ position: 'absolute', width: 185, height: 185, borderRadius: '50%', background: `radial-gradient(circle at 35% 25%, #fff, ${pageAccent} 38%, #0f172a 100%)`, boxShadow: `0 22px 50px ${pageAccent}66`, transform: `scale(${1 + Math.sin(frame * .06) * .04})` }} />
                {panels.slice(0, 3).map((panel, index) => <div key={panel.title} style={{ position: 'absolute', top: `${25 + index * 26}%`, left: `${index % 2 ? 56 : 8}%`, color: '#0f172a', background: '#ffffffee', border: `1px solid ${panel.accent}66`, borderRadius: 9, padding: '8px 11px', fontSize: 11, fontWeight: 800, boxShadow: '0 8px 22px #0f172a18' }}>{panel.title}</div>)}
              </div>
            </div>
          )}

          {view.layout_variant === 'about-grid' && (
            <div style={{ height: '100%', padding: '28px 42px', background: '#f8fafc' }}>
              <div style={{ color: '#0f172a', fontSize: 28, fontWeight: 900 }}>{view.hero_heading}</div>
              <div style={{ color: '#64748b', fontSize: 14, marginTop: 7, maxWidth: 700 }}>{view.hero_body}</div>
              <div style={{ display: 'grid', gridTemplateColumns: importedImage ? '1.35fr 1fr 1fr' : 'repeat(4, 1fr)', gap: 13, marginTop: 25, transform: `translateY(${interpolate(frame, [0, 25], [35, 0], clamp)}px)` }}>
                {importedImage && <div style={{ minHeight: 130, borderRadius: 14, overflow: 'hidden', border: `2px solid ${pageAccent}55`, background: '#ffffff', boxShadow: '0 10px 28px rgba(15, 23, 42, .08)' }}><Img src={staticFile(importedImage)} alt="Imported educational website visual" style={{ width: '100%', height: '100%', minHeight: 130, objectFit: 'cover', display: 'block' }} /></div>}
                {panels.map((panel, index) => <div key={panel.title} style={{ ...panelStyle(panel.accent, index), minHeight: 130, transform: `translateY(${Math.sin(frame * .035 + index) * 5}px)` }}><div style={{ color: panel.accent, fontSize: 20, fontWeight: 900 }}>0{index + 1}</div><div style={{ color: '#0f172a', fontSize: 15, fontWeight: 900, marginTop: 13 }}>{panel.title}</div><div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.4, marginTop: 8 }}>{panel.body}</div></div>)}
              </div>
              <div style={{ marginTop: 25, height: 7, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}><div style={{ width: `${interpolate(frame, [0, durationInFrames], [8, 92], clamp)}%`, height: '100%', background: `linear-gradient(90deg, ${pageAccent}, #38bdf8)`, borderRadius: 99 }} /></div>
            </div>
          )}

          {view.layout_variant === 'product-split' && (
            <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '.8fr 1.2fr', background: '#0f172a' }}>
              <div style={{ padding: '42px 30px', background: `linear-gradient(160deg, ${pageAccent}, #0f172a 76%)`, color: '#ffffff' }}>
                <div style={{ fontSize: 11, letterSpacing: 2.5, fontWeight: 900, textTransform: 'uppercase', opacity: .8 }}>{view.section}</div>
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.08, marginTop: 16 }}>{view.hero_heading}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, opacity: .86, marginTop: 16 }}>{view.hero_body}</div>
                <div style={{ display: 'inline-block', marginTop: 24, border: '1px solid #ffffff66', borderRadius: 8, padding: '10px 13px', fontSize: 12, fontWeight: 800 }}>{view.cta}</div>
              </div>
              <div style={{ padding: '34px 34px', background: '#f8fafc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, alignContent: 'center' }}>
                {panels.map((panel, index) => <div key={panel.title} style={{ ...panelStyle(panel.accent, index), minHeight: 105, transform: `translateY(${interpolate(spring({ frame: frame - index * 5, fps: 30, config: springPresets.snappy }), [0, 1], [24, 0])}px)`, opacity: spring({ frame: frame - index * 5, fps: 30, config: springPresets.snappy }) }}><div style={{ color: '#0f172a', fontSize: 15, fontWeight: 900 }}>{panel.title}</div><div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.4, marginTop: 8 }}>{panel.body}</div></div>)}
              </div>
            </div>
          )}

          {view.layout_variant === 'contact' && (
            <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 35, padding: '33px 46px', background: '#fff7ed' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ color: pageAccent, fontSize: 12, letterSpacing: 2, fontWeight: 900, textTransform: 'uppercase' }}>{view.section}</div>
                <div style={{ color: '#0f172a', fontSize: 35, lineHeight: 1.08, fontWeight: 900, marginTop: 12 }}>{view.hero_heading}</div>
                <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, marginTop: 14 }}>{view.hero_body}</div>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 20 }}>{panels.slice(0, 3).map((panel) => <span key={panel.title} style={{ color: panel.accent, background: '#ffffff', border: `1px solid ${panel.accent}55`, borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 800 }}>{panel.title}</span>)}</div>
              </div>
              <div style={{ alignSelf: 'center', background: '#ffffff', border: '1px solid #fed7aa', borderRadius: 15, padding: 22, boxShadow: '0 12px 30px #9a341218' }}>
                <div style={{ color: '#0f172a', fontSize: 17, fontWeight: 900, marginBottom: 14 }}>{view.cta}</div>
                {['Name', 'Email', 'Message'].map((field, index) => <div key={field} style={{ height: index === 2 ? 58 : 31, borderRadius: 6, border: '1px solid #cbd5e1', color: '#94a3b8', fontSize: 11, padding: '8px 10px', marginTop: 9 }}>{field}</div>)}
                <div style={{ marginTop: 13, textAlign: 'center', borderRadius: 7, background: pageAccent, color: '#ffffff', padding: 10, fontSize: 12, fontWeight: 900 }}>Send message</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', left: `${cursorX}%`, top: `${cursorY}%`, width: 0, height: 0, borderLeft: '10px solid #0f172a', borderTop: '7px solid transparent', borderBottom: '7px solid transparent', transform: `rotate(-18deg) scale(${1 + Math.sin(frame * .18) * .08})`, filter: 'drop-shadow(0 2px 3px #ffffff)' }} />
      </div>
    </div>
  );
};
