import { StyleBrief } from '../providers/providerAdapter.js';
import { StyleProfile } from '../../types/index.js';

export type ContentDomain =
  | 'cloud_distributed'
  | 'cybersecurity_crypto'
  | 'ai_datascience'
  | 'blockchain_fintech'
  | 'biology_medicine'
  | 'physics_space'
  | 'hardware_iot'
  | 'product_saas'
  | 'general_explainer';

export interface MotionReference {
  title: string;
  visualEntity: string;
  motionCue: string;
  sceneRole: 'hook' | 'body' | 'cta';
  spatialLayout: string;
  svgBlueprintGuidance: string;
}

export interface PreparedMotionDossier {
  domain: ContentDomain;
  domainLabel: string;
  keywords: string[];
  extractedMechanisms: string[];
  recommendedArchetype: 'kinetic-type' | 'isometric-diagram' | 'data-story' | 'paper-cutout' | 'neo-brutalist' | 'glass-ui' | 'blueprint-technical' | 'retro-terminal';
  recommendedFamily: 'cinematic-neon' | 'editorial-paper' | 'playful-pop' | 'technical-terminal' | 'documentary-grid';
  palette: {
    bg: string;
    primary: string;
    accent: string;
    text: string;
    surface: string;
  };
  motionPersonality: 'snappy' | 'precise' | 'fluid' | 'energetic' | 'deliberate';
  backgroundMotif: 'grid' | 'particles' | 'gradient-flow' | 'dots' | 'halftone' | 'lines';
  motionReferences: MotionReference[];
  researchSearchAngles: string[];
  dynamicVisualAssetQueries: string[];
}

// Simple deterministic hash to vary color schemes and visual angles across runs
function stringSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export class ContentPreparationService {
  /**
   * Classify the content into a concrete visual domain
   */
  classifyDomain(text: string): ContentDomain {
    const lower = text.toLowerCase();

    if (/cloud|aws|kubernetes|k8s|microservice|distributed|serverless|docker|container|devops|cluster|kafka|redis|grpc|ingress|lambda|ec2|s3|vpc|load balancer|node cluster|multi-region|terraform|ci\/cd|pipeline/i.test(lower)) {
      return 'cloud_distributed';
    }
    if (/cyber|security|hack|breach|zero trust|encryption|decrypt|cryptography|cipher|firewall|auth|oauth|vulnerability|malware|phishing|rsa|aes|sha|ssl|tls|token|ddos|exploit|penetration|soc|siem|payload|threat/i.test(lower)) {
      return 'cybersecurity_crypto';
    }
    if (/ai|artificial intelligence|machine learning|deep learning|neural network|llm|gpt|transformer|model|training|inference|embeddings|vector|weights|parameters|agent|diffusion|vision model|rag|nlp|dataset/i.test(lower)) {
      return 'ai_datascience';
    }
    if (/blockchain|crypto|bitcoin|ethereum|web3|smart contract|token|defi|liquidity|wallet|ledger|mint|staking|transaction|fiat|trading|dao|nft|solana|polygon/i.test(lower)) {
      return 'blockchain_fintech';
    }
    if (/biology|cell|dna|rna|gene|protein|molecule|enzyme|virus|bacteria|neuron|brain|medical|disease|immune|blood|organ|physiology|botany|evolution|ecology|species|pathogen/i.test(lower)) {
      return 'biology_medicine';
    }
    if (/physics|quantum|gravity|relativity|planet|space|orbit|star|galaxy|atom|photon|laser|thermodynamics|electromagnetic|speed of light|cosmic|particle physics|superposition|black hole/i.test(lower)) {
      return 'physics_space';
    }
    if (/hardware|chip|semiconductor|cpu|gpu|transistor|sensor|microcontroller|arduino|raspberry pi|circuit|board|robotics|fpga|firmware|embedded/i.test(lower)) {
      return 'hardware_iot';
    }
    if (/saas|app|platform|dashboard|workflow|onboarding|conversion|crm|analytics|b2b|software|feature|checkout|user experience|growth/i.test(lower)) {
      return 'product_saas';
    }

    return 'general_explainer';
  }

  /**
   * Extract meaningful topic entities and mechanism keywords
   */
  extractMechanisms(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['about', 'their', 'there', 'which', 'where', 'could', 'would', 'should', 'these', 'those', 'video', 'every', 'based', 'using'].includes(w));

    const unique = Array.from(new Set(words));
    return unique.slice(0, 10);
  }

  /**
   * Get varied palettes so 10 videos on the same domain never look identical
   */
  getVariedPalette(domain: ContentDomain, seed: number): {
    palette: PreparedMotionDossier['palette'];
    archetype: PreparedMotionDossier['recommendedArchetype'];
    family: PreparedMotionDossier['recommendedFamily'];
    backgroundMotif: PreparedMotionDossier['backgroundMotif'];
  } {
    const archetypes: PreparedMotionDossier['recommendedArchetype'][] = [
      'blueprint-technical',
      'isometric-diagram',
      'data-story',
      'neo-brutalist',
      'glass-ui',
      'kinetic-type',
    ];
    const families: PreparedMotionDossier['recommendedFamily'][] = [
      'cinematic-neon',
      'technical-terminal',
      'editorial-paper',
      'playful-pop',
      'documentary-grid',
    ];
    const motifs: PreparedMotionDossier['backgroundMotif'][] = ['grid', 'particles', 'gradient-flow', 'dots', 'lines'];

    const chosenArchetype = archetypes[seed % archetypes.length];
    const chosenFamily = families[(seed >> 2) % families.length];
    const chosenMotif = motifs[(seed >> 3) % motifs.length];

    if (domain === 'cloud_distributed') {
      const palettes = [
        { bg: '#050a18', primary: '#0ea5e9', accent: '#38bdf8', text: '#f8fafc', surface: '#0f172a' }, // Sky / Azure
        { bg: '#090d16', primary: '#6366f1', accent: '#818cf8', text: '#ffffff', surface: '#131b2e' }, // Indigo mesh
        { bg: '#0a0e14', primary: '#06b6d4', accent: '#22d3ee', text: '#ecfeff', surface: '#111827' }, // Cyan telemetry
        { bg: '#0d1117', primary: '#f97316', accent: '#fbbf24', text: '#fffbeb', surface: '#1c1917' }, // Solar cloud
        { bg: '#060d10', primary: '#10b981', accent: '#34d399', text: '#f0fdf4', surface: '#064e3b' }, // Mint kubernetes
      ];
      return {
        palette: palettes[seed % palettes.length],
        archetype: chosenArchetype,
        family: chosenFamily,
        backgroundMotif: chosenMotif,
      };
    }

    if (domain === 'cybersecurity_crypto') {
      const palettes = [
        { bg: '#030712', primary: '#10b981', accent: '#14b8a6', text: '#f9fafb', surface: '#111827' }, // Terminal Matrix
        { bg: '#090412', primary: '#ec4899', accent: '#06b6d4', text: '#fdf4ff', surface: '#1e112a' }, // Cyberpunk dual
        { bg: '#09090b', primary: '#ef4444', accent: '#f87171', text: '#fef2f2', surface: '#18181b' }, // High-alert Crimson
        { bg: '#030718', primary: '#2563eb', accent: '#60a5fa', text: '#eff6ff', surface: '#0f172a' }, // Deep Zero-Trust Blue
        { bg: '#0a0804', primary: '#f59e0b', accent: '#fbbf24', text: '#fffbeb', surface: '#1c1917' }, // Cryptographic Gold
      ];
      return {
        palette: palettes[seed % palettes.length],
        archetype: chosenArchetype,
        family: chosenFamily,
        backgroundMotif: chosenMotif,
      };
    }

    if (domain === 'ai_datascience') {
      const palettes = [
        { bg: '#09090b', primary: '#8b5cf6', accent: '#d946ef', text: '#fafafa', surface: '#18181b' },
        { bg: '#050a18', primary: '#3b82f6', accent: '#06b6d4', text: '#f8fafc', surface: '#0f172a' },
        { bg: '#0a0a0f', primary: '#a855f7', accent: '#ec4899', text: '#ffffff', surface: '#1e102e' },
      ];
      return {
        palette: palettes[seed % palettes.length],
        archetype: chosenArchetype,
        family: chosenFamily,
        backgroundMotif: chosenMotif,
      };
    }

    // Default dynamic palette
    const defaultPalettes = [
      { bg: '#090d16', primary: '#6366f1', accent: '#a855f7', text: '#ffffff', surface: '#131b2e' },
      { bg: '#060d10', primary: '#0ea5e9', accent: '#10b981', text: '#f8fafc', surface: '#0f172a' },
      { bg: '#0c0a14', primary: '#f43f5e', accent: '#fb923c', text: '#fff1f2', surface: '#1c1917' },
    ];
    return {
      palette: defaultPalettes[seed % defaultPalettes.length],
      archetype: chosenArchetype,
      family: chosenFamily,
      backgroundMotif: chosenMotif,
    };
  }

  /**
   * Prepares the complete research & motion reference dossier for any user request
   */
  prepare(content: string, inputType: string): PreparedMotionDossier {
    const raw = (content || '').trim();
    const domain = this.classifyDomain(raw);
    const mechanisms = this.extractMechanisms(raw);
    const title = raw.slice(0, 45).replace(/[^\w\s-]/g, '').trim() || 'Core Topic';
    const seed = stringSeed(raw + title);

    const { palette, archetype, family, backgroundMotif } = this.getVariedPalette(domain, seed);

    // Dynamic visual asset search queries specifically targeting the extracted keywords
    const dynamicVisualAssetQueries = mechanisms.map((kw) => `${kw} tech icon vector diagram Wikimedia Openverse`);
    if (dynamicVisualAssetQueries.length < 3) {
      dynamicVisualAssetQueries.push(`${title} architecture diagram`, `${domain} visual infographic`);
    }

    const domainLabel =
      domain === 'cloud_distributed'
        ? 'Cloud & Distributed Systems Architecture'
        : domain === 'cybersecurity_crypto'
        ? 'Cybersecurity, Cryptography & Zero-Trust Defense'
        : domain === 'ai_datascience'
        ? 'Artificial Intelligence & Neural Architecture'
        : domain === 'biology_medicine'
        ? 'Biological Sciences & Life Mechanisms'
        : domain === 'physics_space'
        ? 'Physics, Quantum Mechanics & Astrophysics'
        : domain === 'blockchain_fintech'
        ? 'Fintech, Blockchain & Algorithmic Markets'
        : 'Modern Systems & Explainer Architecture';

    // Flexible motion reference metaphors
    const motionReferences: MotionReference[] = [
      {
        title: `${title} Dynamic Intake Hook`,
        visualEntity: `Dynamic focal emblem representing ${mechanisms.slice(0, 2).join(' & ') || title} with kinetic particles`,
        motionCue: 'Spring scale entrance (0.8 to 1.0, damping: 14) with radial particle ripple propagation',
        sceneRole: 'hook',
        spatialLayout: 'Center hero focal composition (x:0.5, y:0.45)',
        svgBlueprintGuidance: `Geometric contour of ${mechanisms[0] || 'core node'} with outer accent rings.`,
      },
      {
        title: `${title} Core Mechanism Breakdown`,
        visualEntity: `Multi-stage pipeline demonstrating ${mechanisms.slice(1, 4).join(' -> ') || 'process flow'}`,
        motionCue: 'Sequential path draw-on (strokeDashoffset 300 to 0) with glowing packet pulses',
        sceneRole: 'body',
        spatialLayout: 'Horizontal or tri-step workflow with connector lines across screen',
        svgBlueprintGuidance: 'Interconnected vector shapes, dashed connector paths, and metric status badges.',
      },
      {
        title: `${title} Comparative Contrast & Scaling`,
        visualEntity: 'Dual comparative panel contrasting traditional bottleneck against optimized solution',
        motionCue: 'Slide-in split comparison with staggered spring bounce and active glow highlight',
        sceneRole: 'body',
        spatialLayout: 'Two-column comparative card layout (Left x:0.32, Right x:0.68)',
        svgBlueprintGuidance: 'Dual panel rectangles with divider line and distinctive icon badges.',
      },
      {
        title: `${title} Ecosystem Synthesis & Payoff`,
        visualEntity: 'Global interconnected mesh or 3D orbital cluster demonstrating scale and resilience',
        motionCue: 'Continuous 360-degree orbital rotation with rhythmic sync pulses and camera push',
        sceneRole: 'cta',
        spatialLayout: 'Center hero cluster with floating KPI metrics and call-to-action button',
        svgBlueprintGuidance: 'Concentric dashed orbital circles, pulsing central hub, and action pill badge.',
      },
    ];

    return {
      domain,
      domainLabel,
      keywords: mechanisms,
      extractedMechanisms: mechanisms,
      recommendedArchetype: archetype,
      recommendedFamily: family,
      palette,
      motionPersonality: seed % 2 === 0 ? 'precise' : 'snappy',
      backgroundMotif,
      motionReferences,
      researchSearchAngles: [
        `${title} verified mechanics and quantitative benchmarks`,
        `${title} architecture diagram and real-world implementation`,
        `${title} primary institutional whitepapers and documentation`,
      ],
      dynamicVisualAssetQueries,
    };
  }

  /**
   * Format the preparation dossier as an authoritative prompt directive for the CLI
   */
  formatDossierForPrompt(prep: PreparedMotionDossier): string {
    return `
================================================================================
PREPARATION GUIDE: DYNAMIC RESEARCH & MULTI-VISUAL GATHERING DIRECTIVES
================================================================================
DOMAIN CONTEXT: ${prep.domainLabel.toUpperCase()} (${prep.domain})
DYNAMIC COLOR SCHEME SUGGESTION: Background ${prep.palette.bg}, Primary ${prep.palette.primary}, Accent ${prep.palette.accent}, Surface ${prep.palette.surface}
SUGGESTED VISUAL ARCHETYPE: "${prep.recommendedArchetype}" | FAMILY: "${prep.recommendedFamily}" | MOTION: "${prep.motionPersonality}"

CONTENT-SPECIFIC MECHANISM KEYWORDS TO VISUALIZE:
${prep.extractedMechanisms.map((m) => `  • ${m}`).join('\n')}

DYNAMIC VISUAL ASSET SEARCH QUERIES (Gather real icons, SVGs, Wikimedia & Openverse diagrams):
${prep.dynamicVisualAssetQueries.map((q) => `  • Search query: "${q}"`).join('\n')}

HIGH-THROUGHPUT MULTI-VIDEO DIVERSITY RULE:
- You are producing up to 10+ videos daily for this domain (${prep.domainLabel}).
- CRITICAL: DO NOT force a single rigid design or repeat the same layout/color scheme!
- Dynamically gather multiple distinct visual assets (downloadable images, SVG vectors, icon emblems, 3D procedural primitives) specific to this exact submission.
- Every video must have distinct kinetic motion, varied spatial arrangements, and original scene blueprints.

CHOREOGRAPHY & MOTION ANIMATION METAPHORS (For CLI Inspiration):
${prep.motionReferences
  .map(
    (ref, idx) => `METAPHOR #${idx + 1} [Role: ${ref.sceneRole.toUpperCase()}] — "${ref.title}"
  • Visual Entity: ${ref.visualEntity}
  • Motion Mechanics: ${ref.motionCue}
  • Spatial Layout: ${ref.spatialLayout}
  • Blueprint Guidance: ${ref.svgBlueprintGuidance}`
  )
  .join('\n\n')}

MANDATORY DIRECTIVE TO THE SCRIPT & STORYBOARD AI:
1. Gather multiple relevant visuals based on the submitted content (using direct open-license URLs and exact SVG vectors).
2. Author complete, captivating narration, precise caption words, and frame-accurate motion blueprints.
3. The backend production worker will assemble all TSX compositions, Kokoro audio tracks, SFX, and Whisper caption timings into the saved done package.
================================================================================
`;
  }
}

export const contentPreparationService = new ContentPreparationService();
