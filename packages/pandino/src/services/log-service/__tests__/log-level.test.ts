import { describe, expect, it } from 'vitest';
import { LogLevel } from '../interfaces';

describe('LogLevel', () => {
  it('should have correct numeric values', () => {
    expect(LogLevel.ERROR).toBe(1);
    expect(LogLevel.WARN).toBe(2);
    expect(LogLevel.INFO).toBe(3);
    expect(LogLevel.DEBUG).toBe(4);
  });

  it('should support level comparison', () => {
    expect(LogLevel.ERROR < LogLevel.WARN).toBe(true);
    expect(LogLevel.WARN < LogLevel.INFO).toBe(true);
    expect(LogLevel.INFO < LogLevel.DEBUG).toBe(true);
  });
});
