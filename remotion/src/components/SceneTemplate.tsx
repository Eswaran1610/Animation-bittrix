import React, { useLayoutEffect, useRef, useState } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
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
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

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
    const tol = 4;

    const zones = Array.from(document.querySelectorAll('[data-zone]')) as HTMLElement[];
    const issues: string[] = [];
    const boxes = zones.map((z) => z.getBoundingClientRect());

    zones.forEach((z, i) => {
      const zoneName = z.dataset.zone || `Zone-${i + 1}`;
      if (z.children[0] && (z.children[0] as HTMLElement).scrollHeight > z.clientHeight + 2) {
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

  // Media entrance: 20 frames ease-out with 40px slide + 1.0 -> 1.08 slow push
  const mediaP = easeOut(prog(frame, 16, 20));
  const mediaOpacity = mediaP * exitProgress;
  const mediaY = (1 - mediaP) * 40;
  const mediaScale = 1 + 0.08 * (frame / Math.max(1, durationInFrames));

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
        background: `radial-gradient(900px 700px at 20% 0, #0e3b4a 0, #071018 70%)`,
        color: '#ffffff',
        display: 'grid',
        gridTemplateRows: `${ZONE_TITLE_HEIGHT}px ${ZONE_BULLETS_HEIGHT}px ${ZONE_MEDIA_HEIGHT}px ${ZONE_CAPTIONS_HEIGHT}px`,
        gap: `${ZONE_GAP}px`,
        padding: `${SAFE_MARGIN_Y}px ${SAFE_MARGIN_X}px`,
        boxSizing: 'border-box',
        fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
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
            fontWeight: 800,
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
          {title}
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
            gap: 22,
            fontSize: 50,
            fontWeight: 600,
            lineHeight: 1.25,
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
                    borderRadius: '50%',
                    background: accentColor,
                    boxShadow: `0 0 16px ${accentColor}88`,
                  }}
                />
                <span
                  style={{
                    color: '#e8edf3',
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
            borderRadius: 28,
            overflow: 'hidden',
            background: '#0d131c',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.65)',
            display: 'flex',
            flexDirection: 'column',
            opacity: mediaOpacity,
            transform: `translateY(${mediaY}px)`,
          }}
        >
          {/* Browser Chrome Header */}
          <div
            style={{
              height: 54,
              background: '#151d28',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 22px',
              flex: 'none',
            }}
          >
            <i style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
            <i style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
            <i style={{ width: 14, height: 14, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
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
              <img
                src={screenshotUrl}
                alt="Scene visual"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${mediaScale})`,
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #0a8fa6, #0b2b3a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 40,
                  transform: `scale(${mediaScale})`,
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', marginBottom: 20 }}>
                    {title}
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {bullets.map((b, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#fff',
                          color: '#0b2b3a',
                          borderRadius: 14,
                          padding: '14px 24px',
                          fontSize: 26,
                          fontWeight: 700,
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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
            background: 'rgba(0,0,0,0.68)',
            borderRadius: 26,
            padding: '24px 38px',
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1.25,
            textAlign: 'center',
            maxWidth: '100%',
            opacity: capOpacity,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {parsedCaptionWords.map((word, j) => {
            const isSpoken = j === resolvedActiveWordIndex && frame >= 38 && frame < durationInFrames - 10;
            return (
              <span
                key={`${word}-${j}`}
                style={{
                  color: isSpoken ? accentColor : '#9fb3c4',
                  fontWeight: isSpoken ? 700 : 600,
                  transition: 'color 0.15s ease',
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
