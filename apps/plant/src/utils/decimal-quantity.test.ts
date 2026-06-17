import { describe, expect, it } from 'vitest';

import { applyDecimalKey, buildTargetHint, parseQuantityNumeric } from './decimal-quantity';

describe('decimal-quantity', () => {
  it('appends digits', () => {
    expect(applyDecimalKey('48', '5')).toBe('485');
    expect(applyDecimalKey('0', '5')).toBe('5');
  });

  it('allows only one decimal separator', () => {
    expect(applyDecimalKey('48.5', '.')).toBe('48.5');
    expect(applyDecimalKey('48', '.')).toBe('48.');
    expect(applyDecimalKey('', '.')).toBe('0.');
  });

  it('removes last character on backspace', () => {
    expect(applyDecimalKey('48.5', 'backspace')).toBe('48.');
  });

  it('parses numeric quantity', () => {
    expect(parseQuantityNumeric('48.5')).toBe(48.5);
    expect(parseQuantityNumeric('')).toBe(0);
  });

  it('builds meta hint with delta', () => {
    expect(buildTargetHint(50, 48.5, 'kg')).toBe('Meta: 50.0 kg (-1.5 kg)');
  });
});
