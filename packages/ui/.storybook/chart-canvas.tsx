import type { StoryContext } from '@storybook/react';
import * as React from 'react';

import type { ChartBaseProps } from '../src/components/charts/shared/types';

export function mergeStoryArgs<T>(args: T, context: { args?: Partial<T> }): T {
  return { ...args, ...(context.args ?? {}) } as T;
}

interface ChartStoryFrameProps<T extends ChartBaseProps> {
  Component: React.ComponentType<T>;
  args: T;
  componentName: string;
  maxWidth: number;
  height?: number;
}

function ChartStoryFrame<T extends ChartBaseProps>({
  Component,
  args,
  componentName,
  maxWidth,
  height,
}: ChartStoryFrameProps<T>): React.ReactElement {
  const theme = args.theme ?? 'light';
  const data = (args as { data?: unknown[] }).data;
  const isEmpty = args.empty ?? (Array.isArray(data) && data.length === 0);

  return (
    <div
      style={{
        width: '100%',
        maxWidth,
        ...(height != null ? { height } : { minHeight: 280 }),
        padding: 24,
        boxSizing: 'border-box',
        background: theme === 'dark' ? '#111111' : '#f8f6f1',
      }}
    >
      <Component {...args} theme={theme} />
    </div>
  );
}

export function createChartRender<T extends ChartBaseProps>(
  Component: React.ComponentType<T>,
  componentName: string,
  options?: { maxWidth?: number; height?: number },
): (args: T, context: StoryContext<T>) => React.ReactElement {
  const { maxWidth = 480, height = 280 } = options ?? {};

  return (args, context) => {
    const mergedArgs = mergeStoryArgs(args, context);
    const contextArgs = (context?.args ?? {}) as Partial<T>;
    const theme = (mergedArgs.theme ?? 'light') as 'light' | 'dark';

    return (
      <ChartStoryFrame
        Component={Component}
        args={{ ...mergedArgs, theme }}
        componentName={componentName}
        maxWidth={maxWidth}
        height={height}
      />
    );
  };
}
