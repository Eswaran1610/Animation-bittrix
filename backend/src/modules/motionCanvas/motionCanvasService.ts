import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { projectPaths } from '../../config/paths.js';

const execAsync = promisify(exec);

export interface MotionCanvasSceneSpec {
  name: string;
  title: string;
  subtitle?: string;
  themeColor?: string;
  nodes?: string[];
  durationSec?: number;
}

export class MotionCanvasService {
  /**
   * Synthesize a Motion Canvas 2D scene code using generator functions and signals.
   */
  generateSceneCode(spec: MotionCanvasSceneSpec): string {
    const primaryColor = spec.themeColor || '#22d3ee';
    const title = spec.title.replace(/'/g, "\\'");
    const subtitle = (spec.subtitle || 'PROCEDURAL MOTION GRAPHICS').replace(/'/g, "\\'");
    const nodes = (spec.nodes && spec.nodes.length > 0)
      ? spec.nodes
      : ['INPUT', 'PROCESS', 'OUTPUT'];

    return `import {makeScene2D, Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutBack, sequence} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const bg = createRef<Rect>();
  const coreNode = createRef<Rect>();
  const titleTxt = createRef<Txt>();
  const subTxt = createRef<Txt>();
  const pulseRing = createRef<Circle>();

  view.add(
    <Rect
      ref={bg}
      width={'100%'}
      height={'100%'}
      fill={'#080c14'}
    />,
  );

  view.add(
    <Node y={-340}>
      <Txt
        ref={titleTxt}
        text={'${title}'}
        fill={'#ffffff'}
        fontFamily={'Inter, sans-serif'}
        fontWeight={800}
        fontSize={60}
        letterSpacing={1.5}
        opacity={0}
        y={40}
      />
      <Txt
        ref={subTxt}
        text={'${subtitle}'}
        fill={'${primaryColor}'}
        fontFamily={'Inter, sans-serif'}
        fontWeight={600}
        fontSize={26}
        letterSpacing={3}
        opacity={0}
        y={110}
      />
    </Node>,
  );

  view.add(
    <Node y={60}>
      <Circle
        ref={pulseRing}
        width={320}
        height={320}
        stroke={'${primaryColor}'}
        lineWidth={3}
        opacity={0}
        scale={0.8}
      />
      <Rect
        ref={coreNode}
        width={220}
        height={220}
        radius={32}
        fill={'#0f172a'}
        stroke={'${primaryColor}'}
        lineWidth={3}
        scale={0}
      >
        <Txt
          text={'${nodes[0] || 'CORE'}'}
          fill={'${primaryColor}'}
          fontFamily={'Inter, sans-serif'}
          fontWeight={800}
          fontSize={32}
        />
      </Rect>
    </Node>,
  );

  yield* sequence(
    0.15,
    all(
      titleTxt().opacity(1, 0.8, easeInOutCubic),
      titleTxt().y(0, 0.8, easeOutBack),
    ),
    all(
      subTxt().opacity(1, 0.6),
      subTxt().y(80, 0.6, easeOutBack),
    ),
    all(
      coreNode().scale(1, 0.8, easeOutBack),
      pulseRing().opacity(0.8, 0.5),
      pulseRing().scale(1.3, 1.2),
    ),
  );

  yield* all(
    coreNode().rotation(6, 1.5).to(-6, 3).to(0, 1.5),
    pulseRing().scale(1.4, 2).to(1.1, 2),
    pulseRing().opacity(0.2, 2).to(0.7, 2),
  );
});
`;
  }

  /**
   * Save scene code to the motion-canvas workspace and re-bundle the project.
   */
  async buildProject(spec?: MotionCanvasSceneSpec): Promise<{ success: boolean; distDir: string; bundleFile?: string }> {
    const scenesDir = path.join(projectPaths.motionCanvasRoot, 'src', 'scenes');
    await mkdir(scenesDir, { recursive: true });

    if (spec) {
      const sceneFileName = `${spec.name || 'customScene'}.tsx`;
      const scenePath = path.join(scenesDir, sceneFileName);
      const code = this.generateSceneCode(spec);
      await writeFile(scenePath, code, 'utf8');

      // Update project.ts to include the scene
      const projectPath = path.join(projectPaths.motionCanvasRoot, 'src', 'project.ts');
      const projectCode = `import {makeProject} from '@motion-canvas/core';
import activeScene from './scenes/${spec.name || 'customScene'}?scene';

export default makeProject({
  scenes: [activeScene],
});
`;
      await writeFile(projectPath, projectCode, 'utf8');
    }

    try {
      const { stdout } = await execAsync('npm run build', {
        cwd: projectPaths.motionCanvasRoot,
        timeout: 45000,
      });
      console.log('[MotionCanvasService] Build successful:', stdout.slice(0, 300));
      return {
        success: true,
        distDir: projectPaths.motionCanvasDist,
      };
    } catch (err: any) {
      console.error('[MotionCanvasService] Build failed:', err.message);
      return {
        success: false,
        distDir: projectPaths.motionCanvasDist,
      };
    }
  }
}

export const motionCanvasService = new MotionCanvasService();
