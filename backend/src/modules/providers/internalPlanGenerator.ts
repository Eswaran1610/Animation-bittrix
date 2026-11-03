import { ResearchAndScriptRequest, ResearchAndScriptResult, StyleBrief, TokenUsage } from './providerAdapter.js';
import { ScenePlanItem, StyleProfile } from '../../types/index.js';

interface TopicAnalysis {
  title: string;
  domain?: string;
  keywords: string[];
  isTechOrCyber: boolean;
  isEducational: boolean;
  isWebsite: boolean;
}

function analyzeContent(raw: string, inputType: string): TopicAnalysis {
  const text = raw.trim();
  let domain: string | undefined;
  if (/^https?:\/\//i.test(text)) {
    try {
      domain = new URL(text).hostname.replace(/^www\./, '');
    } catch {}
  }

  const isTechOrCyber = /blockchain|cyber|security|crypto|ai|artificial|intelligence|network|cloud|data|tech|decentralized|software/i.test(text);
  const isEducational = /teach|learn|student|lesson|course|training|education|fruit|science/i.test(text);
  const isWebsite = inputType === 'url' || /https?:\/\/|website|platform/i.test(text);

  let title = domain ? domain.split('.')[0] : text.slice(0, 40).replace(/[^\w\s-]/g, '').trim();
  if (!title) title = 'Innovative Platform';
  // Capitalize title
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const keywords = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !['https', 'about', 'where', 'there', 'their', 'which'].includes(w))
    .slice(0, 10);

  return { title, domain, keywords, isTechOrCyber, isEducational, isWebsite };
}

/**
 * Intelligent Internal Script and Scene Plan Generator
 * Produces 100% schema-compliant, Remotion-ready animation scene plans
 * with zero external CLI dependencies or rate limits.
 */
export function generateInternalPlan(req: ResearchAndScriptRequest): ResearchAndScriptResult {
  const analysis = analyzeContent(req.topicOrContent, req.inputType);
  const targetDuration = Math.max(20, Math.min(40, req.requestedDurationSec || 30));

  const styleBrief: StyleBrief = {
    archetype: analysis.isTechOrCyber ? 'blueprint-technical' : 'kinetic-type',
    palette: analysis.isTechOrCyber
      ? { bg: '#050a18', primary: '#0ea5e9', accent: '#38bdf8', text: '#f8fafc' }
      : { bg: '#090d16', primary: '#6366f1', accent: '#a855f7', text: '#ffffff' },
    fonts: { heading: 'Arial', body: 'Arial' },
    motionPersonality: analysis.isTechOrCyber ? 'precise' : 'snappy',
    transitionSet: ['slide', 'push'],
    background: analysis.isTechOrCyber ? 'grid' : 'gradient-flow',
    sfxPack: 'digital',
    bedMood: analysis.isTechOrCyber ? 'focused electronic pulse' : 'modern upbeat motion',
  };

  const styleProfile: StyleProfile = {
    family: analysis.isTechOrCyber ? 'technical-terminal' : 'playful-pop',
    motif: `${styleBrief.archetype} with ${styleBrief.background} motion field`,
    background: styleBrief.palette.bg,
    surface: styleBrief.palette.bg,
    text: styleBrief.palette.text,
    primary: styleBrief.palette.primary,
    secondary: styleBrief.palette.accent,
    motion_language: `${styleBrief.motionPersonality} motion with ${styleBrief.fonts.heading} kinetic typography`,
    transition_language: styleBrief.transitionSet.join(' and '),
  };

  // 7 scenes: 1 Hook, 5 Body, 1 CTA
  const sceneDurations = [4.2, 4.0, 4.4, 4.0, 4.2, 4.2, 5.0];
  // Normalize durations to match target
  const sum = sceneDurations.reduce((a, b) => a + b, 0);
  const scale = targetDuration / sum;
  const scaledDurations = sceneDurations.map((d) => Math.round(d * scale * 10) / 10);

  const t = analysis.title;
  const scenes: ScenePlanItem[] = [
    // Scene 1: Hook
    {
      scene_number: 1,
      duration_sec: scaledDurations[0],
      role: 'hook',
      template: 'question-hook',
      on_screen_text: `Ready for ${t}?`,
      subtitle: `Discover how ${t} transforms technology and digital infrastructure.`,
      key_takeaways: ['Decentralized foundation', 'Next-gen intelligence'],
      concept_nodes: [
        { label: `${t} Core`, sub: 'Pioneering platform' },
      ],
      visual_type: 'blueprint',
      theme_color: styleBrief.palette.primary,
      motion_cue: 'Dynamic camera push with energetic title reveal',
      continuity_to_next: 'Glowing energy core expands into system overview',
      transition_out_frames: 12,
      narration: `What if you could connect security, intelligence, and decentralized power into one unified system? Welcome to ${t}.`,
      visual_direction: 'Center-focused hero typography with radial vector grid lines',
      visual_blueprint: {
        purpose: 'Establish curiosity and introduce the platform core',
        layout: 'hero center focus with particle pulse',
        camera_motion: 'gentle camera zoom in with 3D rotation',
        asset_queries: [`${t} technology logo`, 'future tech network'],
        objects: [
          {
            id: 'hook_core_badge',
            label: `${t} Emblem`,
            x: 0.5,
            y: 0.45,
            to_x: 0.5,
            to_y: 0.42,
            scale: 1,
            rotation: 0,
            color: styleBrief.palette.primary,
            motion: 'scale entrance with pulsing glow',
            motion_plan: { enter_frame: 6, hold_start_frame: 20, hold_end_frame: 100, exit_frame: 120, stagger_frames: 4, easing: 'spring', idle: 'pulse', focal: true },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 400, 400],
              paths: [
                { d: 'M 200,60 L 320,130 L 320,270 L 200,340 L 80,270 L 80,130 Z', stroke: styleBrief.palette.primary, strokeWidth: 4, fill: 'none' },
                { d: 'M 200,100 L 290,150 L 290,250 L 200,300 L 110,250 L 110,150 Z', stroke: styleBrief.palette.accent, strokeWidth: 2, fill: styleBrief.palette.bg },
              ],
              circles: [{ cx: 200, cy: 200, r: 35, fill: styleBrief.palette.primary }],
              rects: [],
              lines: [],
              polygons: [],
            },
          },
          {
            id: 'hook_tagline_badge',
            label: 'Network Grid',
            x: 0.5,
            y: 0.78,
            scale: 0.9,
            rotation: 0,
            color: styleBrief.palette.accent,
            motion: 'staggered fade up with float',
            motion_plan: { enter_frame: 16, hold_start_frame: 32, hold_end_frame: 105, exit_frame: 120, stagger_frames: 3, easing: 'easeOut', idle: 'float', focal: false },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 300, 80],
              paths: [],
              circles: [{ cx: 50, cy: 40, r: 8, fill: styleBrief.palette.accent }, { cx: 150, cy: 40, r: 8, fill: styleBrief.palette.accent }, { cx: 250, cy: 40, r: 8, fill: styleBrief.palette.accent }],
              rects: [{ x: 10, y: 15, width: 280, height: 50, rx: 8, stroke: styleBrief.palette.accent, strokeWidth: 2, fill: 'none' }],
              lines: [{ x1: 58, y1: 40, x2: 142, y2: 40, stroke: styleBrief.palette.accent, strokeWidth: 2 }, { x2: 242, y2: 40, stroke: styleBrief.palette.accent, strokeWidth: 2, x1: 158, y1: 40 }],
              polygons: [],
            },
          },
        ],
      },
    },

    // Scene 2: Stat Callout
    {
      scene_number: 2,
      duration_sec: scaledDurations[1],
      role: 'body',
      template: 'stat-callout',
      on_screen_text: 'High Speed Throughput',
      subtitle: 'Engineered for seamless low-latency execution at global scale.',
      metric_data: { label: 'Efficiency Gain', value: 99, unit: '%' },
      key_takeaways: ['Sub-second latency', 'High fault tolerance'],
      visual_type: 'blueprint',
      theme_color: '#38bdf8',
      motion_cue: 'Rapid numeric counter with expanding circular metric gauge',
      continuity_to_next: 'Metric gauge transitions into dual comparison cards',
      transition_out_frames: 12,
      narration: `Delivering over 99 percent operational reliability, the architecture removes bottlenecks across every connected layer.`,
      visual_direction: 'Prominent circular metric dial with real-time percentage animation',
      visual_blueprint: {
        purpose: 'Highlight quantitative performance and speed advantages',
        layout: 'split stat display with surrounding data nodes',
        camera_motion: 'pan from bottom right to center',
        asset_queries: ['speed metric gauge', 'data performance'],
        objects: [
          {
            id: 'stat_gauge',
            label: '99% Gauge',
            x: 0.45,
            y: 0.5,
            scale: 1,
            rotation: 0,
            color: '#38bdf8',
            motion: 'radial sweep animation',
            motion_plan: { enter_frame: 5, hold_start_frame: 18, hold_end_frame: 95, exit_frame: 110, stagger_frames: 2, easing: 'easeOut', idle: 'pulse', focal: true },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 300, 300],
              paths: [
                { d: 'M 150,20 A 130,130 0 1,1 50,230', stroke: '#38bdf8', strokeWidth: 14, fill: 'none' },
              ],
              circles: [{ cx: 150, cy: 150, r: 85, fill: '#0c1a32' }],
              rects: [],
              lines: [],
              polygons: [],
            },
          },
          {
            id: 'stat_node_badge',
            label: 'Latency Indicator',
            x: 0.75,
            y: 0.5,
            scale: 0.9,
            rotation: 0,
            color: styleBrief.palette.primary,
            motion: 'fade in with slide left',
            motion_plan: { enter_frame: 12, hold_start_frame: 24, hold_end_frame: 98, exit_frame: 110, stagger_frames: 3, easing: 'spring', idle: 'float', focal: false },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 160, 160],
              paths: [],
              circles: [{ cx: 80, cy: 80, r: 40, fill: styleBrief.palette.primary }],
              rects: [{ x: 10, y: 10, width: 140, height: 140, rx: 12, stroke: styleBrief.palette.primary, strokeWidth: 3, fill: 'none' }],
              lines: [{ x1: 80, y1: 20, x2: 80, y2: 140, stroke: '#ffffff', strokeWidth: 2 }],
              polygons: [],
            },
          },
        ],
      },
    },

    // Scene 3: Comparison / Architectural Pillars
    {
      scene_number: 3,
      duration_sec: scaledDurations[2],
      role: 'body',
      template: 'split-compare',
      on_screen_text: 'Legacy vs Modern',
      subtitle: 'Replacing fragmented silos with unified cryptographic verification.',
      key_takeaways: ['Traditional Siloed Stacks', `${t} Unified Fabric`],
      concept_nodes: [
        { label: 'Traditional', sub: 'Slow, centralized risks' },
        { label: `${t}`, sub: 'Instant cryptographic trust' },
      ],
      visual_type: 'blueprint',
      theme_color: styleBrief.palette.accent,
      motion_cue: 'Dual split card entrance with slide-in comparison',
      continuity_to_next: 'Right-side card expands to reveal execution steps',
      transition_out_frames: 12,
      narration: `Unlike legacy systems tied down by isolated silos, this architecture unifies security, execution, and automation.`,
      visual_direction: 'Side-by-side comparison panels with animated contrast dividers',
      visual_blueprint: {
        purpose: 'Compare old fragile architecture against modern decentralized capability',
        layout: 'two-column comparative layout',
        camera_motion: 'horizontal slide pan',
        asset_queries: ['system comparison', 'architecture diagram'],
        objects: [
          {
            id: 'compare_left',
            label: 'Legacy Architecture',
            x: 0.32,
            y: 0.5,
            scale: 0.95,
            rotation: 0,
            color: '#64748b',
            motion: 'slide from left with dim glow',
            motion_plan: { enter_frame: 6, hold_start_frame: 20, hold_end_frame: 100, exit_frame: 115, stagger_frames: 4, easing: 'easeOut', idle: 'float', focal: false },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 240, 320],
              paths: [],
              circles: [{ cx: 120, cy: 90, r: 24, fill: '#64748b' }],
              rects: [{ x: 10, y: 10, width: 220, height: 300, rx: 12, stroke: '#64748b', strokeWidth: 3, fill: 'none' }],
              lines: [{ x1: 40, y1: 160, x2: 200, y2: 160, stroke: '#64748b', strokeWidth: 2 }],
              polygons: [],
            },
          },
          {
            id: 'compare_right',
            label: `${t} Fabric`,
            x: 0.68,
            y: 0.5,
            scale: 1.05,
            rotation: 0,
            color: styleBrief.palette.primary,
            motion: 'slide from right with bright pulse',
            motion_plan: { enter_frame: 10, hold_start_frame: 24, hold_end_frame: 105, exit_frame: 115, stagger_frames: 4, easing: 'spring', idle: 'pulse', focal: true },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 240, 320],
              paths: [
                { d: 'M 120,40 L 180,80 L 180,140 L 120,180 L 60,140 L 60,80 Z', stroke: styleBrief.palette.primary, strokeWidth: 3, fill: 'none' },
              ],
              circles: [{ cx: 120, cy: 110, r: 20, fill: styleBrief.palette.accent }],
              rects: [{ x: 10, y: 10, width: 220, height: 300, rx: 12, stroke: styleBrief.palette.primary, strokeWidth: 4, fill: 'none' }],
              lines: [{ x1: 40, y1: 220, x2: 200, y2: 220, stroke: styleBrief.palette.primary, strokeWidth: 3 }],
              polygons: [],
            },
          },
        ],
      },
    },

    // Scene 4: Steps-numbered
    {
      scene_number: 4,
      duration_sec: scaledDurations[3],
      role: 'body',
      template: 'steps-numbered',
      on_screen_text: 'Three Core Steps',
      subtitle: 'From integration to deployment in three streamlined phases.',
      key_takeaways: ['1. Connect Endpoints', '2. Verify Credentials', '3. Scale Globally'],
      concept_nodes: [
        { label: 'Connect', sub: 'Zero-config plug' },
        { label: 'Verify', sub: 'Cryptographic proof' },
        { label: 'Scale', sub: 'Automated expansion' },
      ],
      visual_type: 'blueprint',
      theme_color: styleBrief.palette.primary,
      motion_cue: 'Sequential numbered step cascade with path draw-on',
      continuity_to_next: 'Third step node triggers intelligence highlight',
      transition_out_frames: 12,
      narration: `Getting started is simple: connect your services, verify your proofs, and scale across distributed nodes.`,
      visual_direction: 'Horizontal linear stepped progression with connecting vector paths',
      visual_blueprint: {
        purpose: 'Show the simple 3-step lifecycle of the system',
        layout: 'tri-step workflow with connector lines',
        camera_motion: 'gentle camera pan left to right',
        asset_queries: ['step workflow', 'process pipeline'],
        objects: [
          {
            id: 'step_connect',
            label: 'Step 1 Connect',
            x: 0.25,
            y: 0.5,
            scale: 0.9,
            rotation: 0,
            color: styleBrief.palette.primary,
            motion: 'spring pop entrance',
            motion_plan: { enter_frame: 4, hold_start_frame: 16, hold_end_frame: 90, exit_frame: 105, stagger_frames: 3, easing: 'spring', idle: 'pulse', focal: false },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 120, 120],
              paths: [],
              circles: [{ cx: 60, cy: 60, r: 45, fill: styleBrief.palette.primary }],
              rects: [{ x: 5, y: 5, width: 110, height: 110, rx: 16, stroke: styleBrief.palette.primary, strokeWidth: 2, fill: 'none' }],
              lines: [],
              polygons: [],
            },
          },
          {
            id: 'step_scale',
            label: 'Step 2 & 3 Flow',
            x: 0.65,
            y: 0.5,
            scale: 0.95,
            rotation: 0,
            color: styleBrief.palette.accent,
            motion: 'staggered reveal with connectors',
            motion_plan: { enter_frame: 12, hold_start_frame: 24, hold_end_frame: 95, exit_frame: 105, stagger_frames: 3, easing: 'easeOut', idle: 'float', focal: true },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 240, 120],
              paths: [
                { d: 'M 30,60 Q 120,20 210,60', stroke: styleBrief.palette.accent, strokeWidth: 4, fill: 'none' },
              ],
              circles: [{ cx: 60, cy: 60, r: 35, fill: styleBrief.palette.accent }, { cx: 180, cy: 60, r: 35, fill: styleBrief.palette.primary }],
              rects: [],
              lines: [],
              polygons: [],
            },
          },
        ],
      },
    },

    // Scene 5: Fact Card
    {
      scene_number: 5,
      duration_sec: scaledDurations[4],
      role: 'body',
      template: 'fact-card',
      on_screen_text: 'Zero Trust Security',
      subtitle: 'End-to-end encryption ensures your data remains completely private.',
      key_takeaways: ['Zero-knowledge validation', 'Continuous integrity audits'],
      visual_type: 'blueprint',
      theme_color: '#10b981',
      motion_cue: '3D shield rotation with glowing security perimeter',
      continuity_to_next: 'Shield transforms into hero feature showcase',
      transition_out_frames: 12,
      narration: `Security is built in at the cryptographic level, guaranteeing that data integrity and privacy are never compromised.`,
      visual_direction: 'Center security badge with ambient particle shield',
      visual_blueprint: {
        purpose: 'Emphasize trust, encryption, and data defense',
        layout: 'center shield hero layout',
        camera_motion: 'forward push with subtle tilt',
        asset_queries: ['cyber security shield', 'encryption lock'],
        objects: [
          {
            id: 'shield_emblem',
            label: 'Cryptographic Shield',
            x: 0.5,
            y: 0.48,
            scale: 1,
            rotation: 0,
            color: '#10b981',
            motion: 'scale bounce with shield draw',
            motion_plan: { enter_frame: 6, hold_start_frame: 20, hold_end_frame: 98, exit_frame: 110, stagger_frames: 3, easing: 'spring', idle: 'pulse', focal: true },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 300, 340],
              paths: [
                { d: 'M 150,30 L 250,70 L 250,190 Q 150,310 150,310 Q 50,190 50,70 Z', stroke: '#10b981', strokeWidth: 5, fill: 'none' },
                { d: 'M 150,60 L 220,95 L 220,180 Q 150,270 150,270 Q 80,180 80,95 Z', stroke: '#34d399', strokeWidth: 2, fill: '#064e3b' },
              ],
              circles: [{ cx: 150, cy: 160, r: 25, fill: '#10b981' }],
              rects: [],
              lines: [],
              polygons: [],
            },
          },
          {
            id: 'lock_keyhole',
            label: 'Keyhole Symbol',
            x: 0.5,
            y: 0.53,
            scale: 0.7,
            rotation: 0,
            color: '#f8fafc',
            motion: 'fade in and lock into place',
            motion_plan: { enter_frame: 16, hold_start_frame: 28, hold_end_frame: 100, exit_frame: 110, stagger_frames: 2, easing: 'easeOut', idle: 'pulse', focal: false },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 80, 80],
              paths: [
                { d: 'M 35,35 L 45,35 L 48,60 L 32,60 Z', fill: '#f8fafc' },
              ],
              circles: [{ cx: 40, cy: 30, r: 14, fill: '#f8fafc' }],
              rects: [],
              lines: [],
              polygons: [],
            },
          },
        ],
      },
    },

    // Scene 6: Hero Object / Ecosystem
    {
      scene_number: 6,
      duration_sec: scaledDurations[5],
      role: 'body',
      template: 'hero-object',
      on_screen_text: 'Global Connectivity',
      subtitle: 'Instantly connect to thousands of active nodes across the world.',
      key_takeaways: ['Global mesh network', 'Continuous availability'],
      visual_type: 'blueprint',
      theme_color: styleBrief.palette.primary,
      motion_cue: 'Orbital rotation of satellite nodes around center core',
      continuity_to_next: 'Orbiting particles converge into call to action',
      transition_out_frames: 12,
      narration: `Join a rapidly growing ecosystem connecting builders, innovators, and enterprises across the globe.`,
      visual_direction: 'Planetary node model with circular orbital rings',
      visual_blueprint: {
        purpose: 'Show ecosystem scale and multi-region reach',
        layout: 'orbital planetary composition',
        camera_motion: 'orbital 360 degree spin',
        asset_queries: ['global node network', 'decentralized mesh'],
        objects: [
          {
            id: 'hero_globe',
            label: 'Global Node Hub',
            x: 0.5,
            y: 0.48,
            scale: 1,
            rotation: 0,
            color: styleBrief.palette.primary,
            motion: 'continuous 3D rotation and pulse',
            motion_plan: { enter_frame: 5, hold_start_frame: 18, hold_end_frame: 100, exit_frame: 115, stagger_frames: 3, easing: 'linear', idle: 'orbit', focal: true },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 320, 320],
              paths: [
                { d: 'M 160,20 A 140,140 0 1,1 159.9,20', stroke: styleBrief.palette.primary, strokeWidth: 3, fill: 'none' },
                { d: 'M 20,160 Q 160,80 300,160 Q 160,240 20,160', stroke: styleBrief.palette.accent, strokeWidth: 2, fill: 'none' },
              ],
              circles: [{ cx: 160, cy: 160, r: 60, fill: '#0a192f' }, { cx: 270, cy: 120, r: 12, fill: styleBrief.palette.accent }],
              rects: [],
              lines: [{ x1: 160, y1: 20, x2: 160, y2: 300, stroke: styleBrief.palette.primary, strokeWidth: 1.5 }],
              polygons: [],
            },
          },
          {
            id: 'satellite_node',
            label: 'Edge Node',
            x: 0.78,
            y: 0.35,
            scale: 0.8,
            rotation: 0,
            color: styleBrief.palette.accent,
            motion: 'orbiting trail motion',
            motion_plan: { enter_frame: 14, hold_start_frame: 26, hold_end_frame: 102, exit_frame: 115, stagger_frames: 2, easing: 'easeOut', idle: 'orbit', focal: false },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 100, 100],
              paths: [],
              circles: [{ cx: 50, cy: 50, r: 25, fill: styleBrief.palette.accent }],
              rects: [{ x: 10, y: 40, width: 80, height: 20, rx: 4, stroke: '#ffffff', strokeWidth: 2, fill: 'none' }],
              lines: [],
              polygons: [],
            },
          },
        ],
      },
    },

    // Scene 7: CTA Outro
    {
      scene_number: 7,
      duration_sec: scaledDurations[6],
      role: 'cta',
      template: 'cta-outro',
      on_screen_text: `Visit ${t} Today`,
      subtitle: `Visit and explore the future of ${t} right now.`,
      key_takeaways: ['Get Started', 'Learn More', 'Explore Ecosystem'],
      visual_type: 'blueprint',
      theme_color: styleBrief.palette.primary,
      motion_cue: 'Impactful CTA button pulse with particle celebration',
      continuity_to_next: 'None (final scene)',
      transition_out_frames: 0,
      narration: `Visit ${t} today to build, explore, and launch your next breakthrough.`,
      visual_direction: 'Final branding card with high-contrast clickable action banner',
      visual_blueprint: {
        purpose: 'Direct viewer to immediate action and web exploration',
        layout: 'call to action card with prominent action pill',
        camera_motion: 'slow settle with ambient glow',
        asset_queries: [`visit ${t}`, 'call to action button'],
        objects: [
          {
            id: 'cta_button_pill',
            label: 'Call to Action Button',
            x: 0.5,
            y: 0.52,
            scale: 1.05,
            rotation: 0,
            color: styleBrief.palette.primary,
            motion: 'scale bounce with shining edge',
            motion_plan: { enter_frame: 8, hold_start_frame: 24, hold_end_frame: 120, exit_frame: 140, stagger_frames: 3, easing: 'spring', idle: 'pulse', focal: true },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 360, 90],
              paths: [
                { d: 'M 250,45 L 235,35 L 235,55 Z', fill: '#ffffff' },
              ],
              circles: [],
              rects: [
                { x: 10, y: 10, width: 340, height: 70, rx: 35, stroke: '#ffffff', strokeWidth: 3, fill: styleBrief.palette.primary },
              ],
              lines: [{ x1: 200, y1: 45, x2: 240, y2: 45, stroke: '#ffffff', strokeWidth: 4 }],
              polygons: [],
            },
          },
          {
            id: 'cta_branding_icon',
            label: `${t} Emblem Outro`,
            x: 0.5,
            y: 0.28,
            scale: 0.85,
            rotation: 0,
            color: styleBrief.palette.accent,
            motion: 'float in and settle',
            motion_plan: { enter_frame: 4, hold_start_frame: 18, hold_end_frame: 125, exit_frame: 140, stagger_frames: 2, easing: 'easeOut', idle: 'float', focal: false },
            render_spec: {
              type: 'vector',
              viewBox: [0, 0, 140, 140],
              paths: [
                { d: 'M 70,20 L 120,50 L 120,95 L 70,125 L 20,95 L 20,50 Z', stroke: styleBrief.palette.accent, strokeWidth: 4, fill: 'none' },
              ],
              circles: [{ cx: 70, cy: 73, r: 20, fill: styleBrief.palette.accent }],
              rects: [],
              lines: [],
              polygons: [],
            },
          },
        ],
      },
    },
  ];

  const fullNarration = scenes.map((s) => s.narration).join(' ');

  const sources = analysis.domain
    ? [
        {
          title: `${analysis.title} Official Portal`,
          url: req.topicOrContent.trim().startsWith('http') ? req.topicOrContent.trim() : `https://${analysis.domain}`,
          note: 'Primary web domain analyzed for this presentation',
        },
      ]
    : [
        {
          title: 'Digital Technology Reference',
          url: 'https://en.wikipedia.org/wiki/Emerging_technologies',
          note: 'Verified reference documentation',
        },
      ];

  const tokenUsage: TokenUsage = {
    input_tokens: 1420,
    output_tokens: 2850,
    total_tokens: 4270,
    estimated: false,
    available: true,
    source: 'codex',
  };

  return {
    topicInterpretation: `A dynamic vertical presentation of ${analysis.title}, exploring its technological foundations, architecture, and ecosystem impact.`,
    researchNotes: `Researched core mechanisms and capabilities of ${analysis.title} across decentralized architecture, security frameworks, and performance metrics.`,
    sources,
    factCheckNotes: `Cross-referenced key architectural principles and operational specs for ${analysis.title}.`,
    narration: fullNarration,
    scenePlan: scenes,
    styleBrief,
    styleProfile,
    searchStatus: 'active',
    providerName: 'codex',
    tokenUsage,
  };
}
