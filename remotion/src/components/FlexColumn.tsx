import React, { ReactNode } from 'react';

/**
 * Simple flex column wrapper used throughout the motion‑graphics pipeline.
 * It stretches to fill its parent and lays out children vertically.
 *
 * Usage:
 *   <FlexColumn className="gap-2">
 *     <Title />
 *     <Bullets />
 *   </FlexColumn>
 */
export const FlexColumn = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={`flex flex-col h-full w-full ${className ?? ''}`.trim()}>{children}</div>
);
