import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTableBreakpoint } from './useTableBreakpoint';

function mockMatchMedia(width: number): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    const minMatch = query.match(/min-width:\s*(\d+)px/);
    const matches = minMatch ? width >= Number(minMatch[1]) : false;

    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
}

describe('useTableBreakpoint', () => {
  it('returns mobile below 640px', () => {
    mockMatchMedia(375);
    const { result } = renderHook(() => useTableBreakpoint());
    expect(result.current).toBe('mobile');
  });

  it('returns tablet between 640px and 1023px', () => {
    mockMatchMedia(768);
    const { result } = renderHook(() => useTableBreakpoint());
    expect(result.current).toBe('tablet');
  });

  it('returns laptop between 1024px and 1279px', () => {
    mockMatchMedia(1100);
    const { result } = renderHook(() => useTableBreakpoint());
    expect(result.current).toBe('laptop');
  });

  it('returns desktop at 1280px and above', () => {
    mockMatchMedia(1440);
    const { result } = renderHook(() => useTableBreakpoint());
    expect(result.current).toBe('desktop');
  });
});
