import React, { useLayoutEffect, useRef, useState } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SAFE_MARGIN_X,
  SAFE_MARGIN_Y,
  ZONE_TITLE_HEIGHT,
  ZONE_BULLETS_HEIGHT,
  ZONE_MEDIA_HEIGHT,
  ZONE_CAPTIONS_HEIGHT,
  ZONE_GAP,
  ACCENT_CYAN,
} from '../constants';
import { StyleBrief } from '../data/sceneTypes';
import { assetSource } from '../assetSource';
import { DynamicDiagram } from './MotionElements';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const prog = (f: number, s: number, l: number) => clamp((f - s) / Math.max(1, l));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export interface SceneTemplateProps {
  title: string;
  bullets?: string[];
  screenshotUrl?: string;
  caption?: string;
  captionWords?: string[];
  activeWordIndex?: number;
  bulletTimings?: number[];
  accentColor?: string;
  styleBrief?: StyleBrief;
  children?: React.ReactNode;
}

export const SceneTemplate: React.FC<SceneTemplateProps> = ({
  title,
  bullets = [],
  screenshotUrl,
  caption,
  captionWords,
  activeWordIndex = -1,
  bulletTimings,
  accentColor = ACCENT_CYAN,
  styleBrief,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const palette = styleBrief?.palette;
  const headingFont = styleBrief?.fonts.heading || "'Manrope', 'Inter', system-ui, sans-serif";
  const bodyFont = styleBrief?.fonts.body || headingFont;
  const archetype = styleBrief?.archetype || 'blueprint-technical';
  const stageBackground = styleBrief?.background === 'halftone'
    ? `radial-gradient(${accentColor}33 1px, transparent 1px), ${palette?.bg || '#071018'}`
    : styleBrief?.background === 'gradient-flow'
      ? `radial-gradient(circle at ${35 + Math.sin(frame * 0.012) * 18}% 12%, ${accentColor}55, transparent 48%), ${palette?.bg || '#071018'}`
      : styleBrief?.background === 'lines'
        ? `repeating-linear-gradient(115deg, ${accentColor}15 0 2px, transparent 2px 30px), ${palette?.bg || '#071018'}`
        : `radial-gradient(900px 700px at 20% 0, ${accentColor}55 0, ${palette?.bg || '#071018'} 70%)`;

  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Auto-fit font size state
  const [titleFontSize, setTitleFontSize] = useState<number>(() => {
    const len = title.length;
    if (len > 70) return 56;
    if (len > 45) return 72;
    if (len > 30) return 84;
    return 96;
  });

  // Client-side auto-fit refinement and quality gate measurement
  useLayoutEffect(() => {
    // 1. Text auto-fit algorithm: decrease font size in 4px steps if overflowing
    if (titleRef.current) {
      let s = titleFontSize;
      while (titleRef.current.scrollHeight > titleRef.current.clientHeight && s > 52) {
        s -= 4;
        titleRef.current.style.fontSize = `${s}px`;
      }
      if (s !== titleFontSize) {
        setTitleFontSize(s);
      }
    }

    // 2. Playbook quality gate: measure bounding boxes in browser DOM
    const stage = stageRef.current;
    const sv = stage ? stage.getBoundingClientRect() : { left: 0, top: 0, right: CANVAS_WIDTH, bottom: CANVAS_HEIGHT };
    const tol = 6;

    // TransitionSeries mounts adjacent scenes at the same time. Scope the
    // measurement to this SceneTemplate; querying document-wide compares the
    // current scene against its transition partner and creates false overlap
    // and out-of-canvas failures.
    const zones = stage
      ? Array.from(stage.querySelectorAll('[data-zone]')) as HTMLElement[]
      : [];
    const issues: string[] = [];
    const boxes = zones.map((z) => z.getBoundingClientRect());

    zones.forEach((z, i) => {
      const zoneName = z.dataset.zone || `Zone-${i + 1}`;
      if (z.children[0] && (z.children[0] as HTMLElement).scrollHeight > z.clientHeight + 8) {
        issues.push(`${zoneName} text is clipped inside its zone`);
      }
      const b = boxes[i];
      if (b.left < sv.left - tol || b.top < sv.top - tol || b.right > sv.right + tol || b.bottom > sv.bottom + tol) {
        issues.push(`${zoneName} leaves the canvas`);
      }
      for (let j = i + 1; j < zones.length; j++) {
        const o = boxes[j];
        const otherName = zones[j].dataset.zone || `Zone-${j + 1}`;
        if (b.left < o.right && b.right > o.left && b.top < o.bottom && b.bottom > o.top) {
          issues.push(`${zoneName} overlaps ${otherName}`);
        }
      }
    });

    if (mediaRef.current && frameRef.current) {
      const mw = frameRef.current.getBoundingClientRect().width / Math.max(1, mediaRef.current.getBoundingClientRect().width);
      if (mw < 0.85) {
        issues.push(`Screenshot is only ${Math.round(mw * 100)}% of the media zone width`);
      }
    }

    (window as any).__qa = issues;
    if (issues.length > 0) {
      console.error(`[PLAYBOOK QA FAIL] ${issues.join(' ; ')}`);
    } else {
      console.log(`[PLAYBOOK QA PASS] All 4 zones valid: no overflow, no overlap, media fills zone.`);
    }
  }, [title, bullets, screenshotUrl, titleFontSize]);

  // Animation values computed purely from frame number
  const exitFrames = 10;
  const exitProgress = 1 - prog(frame, durationInFrames - exitFrames, exitFrames);

  // Title entrance: 18 frames ease-out with 28px slide
  const titleP = easeOut(prog(frame, 0, 18));
  const titleOpacity = titleP * exitProgress;
  const titleY = (1 - titleP) * 28;
  const titleWords = title.trim().split(/\s+/).filter(Boolean);

  // Media entrance: 20 frames ease-out with 40px slide + 1.0 -> 1.08 slow push
  const mediaP = easeOut(prog(frame, 16, 20));
  const mediaOpacity = mediaP * exitProgress;
  const mediaY = (1 - mediaP) * 40;
  const mediaScale = 1 + 0.08 * (frame / Math.max(1, durationInFrames));

  // Procedural Ken Burns Motion for Images (Cinematic Pan & Dynamic Zoom)
  const kbProg = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imageScale = interpolate(kbProg, [0, 1], [1.06, 1.20]);
  const imagePanX = interpolate(kbProg, [0, 1], [-20, 20]);
  const imagePanY = interpolate(kbProg, [0, 1], [10, -10]);
  const imageBreathe = Math.sin(frame * 0.05) * 3;

  // Caption entrance: 12 frames ease-out
  const capP = easeOut(prog(frame, 35, 14));
  const capOpacity = capP * exitProgress;

  // Resolved caption words
  const parsedCaptionWords = captionWords || (caption ? caption.split(' ') : []);
  const resolvedActiveWordIndex = activeWordIndex >= 0
    ? activeWordIndex
    : Math.floor(prog(frame, 38, Math.max(20, durationInFrames - 50)) * parsedCaptionWords.length);

  return (
    <div
      ref={stageRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        background: stageBackground,
        backgroundSize: styleBrief?.background === 'halftone' ? '22px 22px' : undefined,
        color: palette?.text || '#ffffff',
        display: 'grid',
        gridTemplateRows: `${ZONE_TITLE_HEIGHT}px ${ZONE_BULLETS_HEIGHT}px ${ZONE_MEDIA_HEIGHT}px ${ZONE_CAPTIONS_HEIGHT}px`,
        gap: `${ZONE_GAP}px`,
        padding: `${SAFE_MARGIN_Y}px ${SAFE_MARGIN_X}px`,
        boxSizing: 'border-box',
        fontFamily: bodyFont,
        overflow: 'hidden',
      }}
    >
      {/* Zone 1: Title (340px) */}
      <div
        data-zone="title"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: ZONE_TITLE_HEIGHT,
        }}
      >
        <h1
          ref={titleRef}
          style={{
            margin: 0,
            fontSize: `${titleFontSize}px`,
            fontWeight: archetype === 'neo-brutalist' ? 950 : 800,
            fontFamily: headingFont,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {titleWords.map((word, index) => {
            const wordFrame = frame - index * 4;
            const wordP = spring({ frame: Math.max(0, wordFrame), fps, config: { damping: 18, stiffness: 160, mass: 0.7 } });
            const wordY = interpolate(wordP, [0, 1], [titleFontSize * 0.82, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <span key={`${word}-${index}`} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.24em', verticalAlign: 'bottom' }}>
                <span style={{ display: 'inline-block', opacity: wordP, transform: `translateY(${wordY}px)` }}>{word}</span>
              </span>
            );
          })}
        </h1>
      </div>

      {/* Zone 2: Bullets (360px) */}
      <div
        data-zone="bullets"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: ZONE_BULLETS_HEIGHT,
        }}
      >
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: bullets.length > 2 ? 14 : 20,
            fontSize: bullets.length > 2 ? 40 : 44,
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {bullets.slice(0, 3).map((bullet, idx) => {
            const startFrame = bulletTimings?.[idx] != null
              ? Math.round(bulletTimings[idx] * fps)
              : 22 + idx * 8;
            const q = easeOut(prog(frame, startFrame, 16));
            const bulletOpacity = q * exitProgress;
            const bulletY = (1 - q) * 24;

            return (
              <li
                key={`${bullet}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 22,
                  opacity: bulletOpacity,
                  transform: `translateY(${bulletY}px)`,
                }}
              >
                <span
                  style={{
                    flex: 'none',
                    width: 18,
                    height: 18,
                    marginTop: 20,
                    borderRadius: archetype === 'neo-brutalist' ? 0 : '50%',
                    background: accentColor,
                    boxShadow: archetype === 'paper-cutout' ? `5px 5px 0 ${accentColor}88` : `0 0 16px ${accentColor}88`,
                  }}
                />
                <span
                  style={{
                    color: palette?.text || '#e8edf3',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {bullet}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Zone 3: Media (700px) */}
      <div
        ref={mediaRef}
        data-zone="media"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: ZONE_MEDIA_HEIGHT,
        }}
      >
        <div
          ref={frameRef}
          data-frame="media-frame"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: archetype === 'neo-brutalist' ? 0 : archetype === 'paper-cutout' ? 10 : 28,
            overflow: 'hidden',
            background: palette?.bg || '#0d131c',
            border: `1px solid ${palette?.primary || 'rgba(255,255,255,0.1)'}`,
            boxShadow: archetype === 'neo-brutalist' ? `14px 14px 0 ${accentColor}` : archetype === 'paper-cutout' ? `12px 12px 0 ${accentColor}88` : '0 30px 80px rgba(0,0,0,0.65)',
            display: 'flex',
            flexDirection: 'column',
            opacity: mediaOpacity,
            transform: `translateY(${mediaY}px)`,
          }}
        >
          {/* Frame Header / Console Status Bar */}
          <div
            style={{
              height: 50,
              background: archetype === 'retro-terminal' ? '#071a12' : `${palette?.primary || '#151d28'}33`,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 22px',
              flex: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
              <i style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
              <i style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
              {archetype === 'retro-terminal' ? 'SYS://TERMINAL' : 'MOTION ENGINE'}
            </div>
          </div>

          {/* Media Body / Screenshot / Custom Visual */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {children ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `scale(${mediaScale})`,
                }}
              >
                {children}
              </div>
            ) : screenshotUrl ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={assetSource(screenshotUrl)}
                  alt="Scene visual"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${imageScale}) translate3d(${imagePanX}px, ${imagePanY + imageBreathe}px, 0)`,
                    transformOrigin: 'center center',
                    filter: 'contrast(1.08) saturate(1.15)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            ) : (
              <DynamicDiagram color={accentColor} title={title} />
            )}
          </div>
        </div>
      </div>

      {/* Zone 4: Captions (200px) */}
      <div
        data-zone="caption"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: ZONE_CAPTIONS_HEIGHT,
        }}
      >
        <div
          style={{
            background: parsedCaptionWords.length ? `${palette?.bg || '#000000'}cc` : 'transparent',
            borderRadius: archetype === 'neo-brutalist' ? 0 : 26,
            padding: parsedCaptionWords.length ? '24px 38px' : 0,
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1.25,
            textAlign: 'center',
            maxWidth: '100%',
            opacity: capOpacity,
            border: parsedCaptionWords.length ? '1px solid rgba(255,255,255,0.08)' : 'none',
            boxShadow: parsedCaptionWords.length ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          {parsedCaptionWords.map((word, j) => {
            const isSpoken = j === resolvedActiveWordIndex && frame >= 38 && frame < durationInFrames - 10;
            return (
              <span
                key={`${word}-${j}`}
                style={{
                  color: isSpoken ? accentColor : (palette?.text || '#9fb3c4'),
                  fontWeight: isSpoken ? 700 : 600,
                  marginRight: '0.28em',
                  display: 'inline-block',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
