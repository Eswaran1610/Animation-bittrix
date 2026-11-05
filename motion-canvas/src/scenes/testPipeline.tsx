import {makeScene2D, Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
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
        text={'DYNAMIC MOTION CANVAS'}
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
        text={'INTEGRATED VECTOR ENGINE'}
        fill={'#38bdf8'}
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
        stroke={'#38bdf8'}
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
        stroke={'#38bdf8'}
        lineWidth={3}
        scale={0}
      >
        <Txt
          text={'PROMPT'}
          fill={'#38bdf8'}
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
