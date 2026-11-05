import {makeScene2D, Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, chain, createRef, createSignal, easeInOutCubic, easeOutBack, loop, sequence} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // Theme styling (Dark modern reel system)
  const bg = createRef<Rect>();
  const coreNode = createRef<Rect>();
  const titleTxt = createRef<Txt>();
  const subTxt = createRef<Txt>();
  const pulseRing = createRef<Circle>();
  const flowLine = createRef<Line>();
  const badge1 = createRef<Rect>();
  const badge2 = createRef<Rect>();

  const progress = createSignal(0);

  view.add(
    <Rect
      ref={bg}
      width={'100%'}
      height={'100%'}
      fill={'#080c14'}
    />,
  );

  view.add(
    <Node y={-350}>
      <Txt
        ref={titleTxt}
        text={'MOTION CANVAS ENGINE'}
        fill={'#ffffff'}
        fontFamily={'Inter, sans-serif'}
        fontWeight={800}
        fontSize={64}
        letterSpacing={2}
        opacity={0}
        y={40}
      />
      <Txt
        ref={subTxt}
        text={'PROCEDURAL VECTOR & SIGNAL GRAPHICS'}
        fill={'#22d3ee'}
        fontFamily={'Inter, sans-serif'}
        fontWeight={600}
        fontSize={28}
        letterSpacing={4}
        opacity={0}
        y={110}
      />
    </Node>,
  );

  // Central Hero Node
  view.add(
    <Node y={50}>
      <Circle
        ref={pulseRing}
        width={340}
        height={340}
        stroke={'#22d3ee'}
        lineWidth={3}
        opacity={0}
        scale={0.8}
      />
      <Rect
        ref={coreNode}
        width={240}
        height={240}
        radius={36}
        fill={'#0f172a'}
        stroke={'#38bdf8'}
        lineWidth={4}
        scale={0}
      >
        <Txt
          text={'CORE'}
          fill={'#38bdf8'}
          fontFamily={'Inter, sans-serif'}
          fontWeight={900}
          fontSize={38}
        />
      </Rect>
    </Node>,
  );

  // Connected Badges
  view.add(
    <Node y={50}>
      <Rect
        ref={badge1}
        x={-340}
        width={200}
        height={90}
        radius={20}
        fill={'#1e293b'}
        stroke={'#818cf8'}
        lineWidth={2}
        opacity={0}
        scale={0.8}
      >
        <Txt
          text={'SIGNALS'}
          fill={'#c7d2fe'}
          fontFamily={'Inter, sans-serif'}
          fontWeight={700}
          fontSize={24}
        />
      </Rect>
      <Rect
        ref={badge2}
        x={340}
        width={200}
        height={90}
        radius={20}
        fill={'#1e293b'}
        stroke={'#34d399'}
        lineWidth={2}
        opacity={0}
        scale={0.8}
      >
        <Txt
          text={'VECTORS'}
          fill={'#a7f3d0'}
          fontFamily={'Inter, sans-serif'}
          fontWeight={700}
          fontSize={24}
        />
      </Rect>
    </Node>,
  );

  // Motion Sequence
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
      pulseRing().scale(1.25, 1.2),
    ),
    all(
      badge1().opacity(1, 0.5),
      badge1().scale(1, 0.5, easeOutBack),
      badge2().opacity(1, 0.5),
      badge2().scale(1, 0.5, easeOutBack),
    ),
  );

  // Continuous subtle pulse & float
  yield* all(
    coreNode().rotation(8, 1.5).to(-8, 3).to(0, 1.5),
    pulseRing().scale(1.4, 2).to(1.1, 2),
    pulseRing().opacity(0.2, 2).to(0.7, 2),
  );
});
