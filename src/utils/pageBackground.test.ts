import { describe, it, expect } from 'vitest';
import { normalizeOpaqueHex, derivePageBackgroundColor } from './pageBackground';

describe('normalizeOpaqueHex', () => {
  it('normalises 6/8/3-digit hex and rgba()', () => {
    expect(normalizeOpaqueHex('#373B43')).toBe('#373B43');
    expect(normalizeOpaqueHex('#373B43FF')).toBe('#373B43');
    expect(normalizeOpaqueHex('#abc')).toBe('#AABBCC');
    expect(normalizeOpaqueHex('rgba(55, 59, 67, 1)')).toBe('#373B43');
    expect(normalizeOpaqueHex('rgb(255, 255, 255)')).toBe('#FFFFFF');
  });

  it('returns null for transparent or unparseable colours', () => {
    expect(normalizeOpaqueHex('#FFFFFF00')).toBeNull();
    expect(normalizeOpaqueHex('rgba(255,255,255,0)')).toBeNull();
    expect(normalizeOpaqueHex(undefined)).toBeNull();
    expect(normalizeOpaqueHex('not-a-color')).toBeNull();
    expect(normalizeOpaqueHex('')).toBeNull();
  });
});

describe('derivePageBackgroundColor', () => {
  const dark = { style: { backgroundColor: '#373B43FF' } };

  it('prefers an explicit page background', () => {
    const page = { style: { backgroundColor: '#123456' }, buttons: [dark, dark, dark, dark] };
    expect(derivePageBackgroundColor(page, false)).toBe('#123456');
    expect(derivePageBackgroundColor(page, true)).toBe('#123456');
  });

  it('derives the majority button surround when enabled', () => {
    const page = {
      style: null,
      buttons: [dark, dark, dark, dark, dark, { style: { backgroundColor: '#EAF2FBFF' } }],
    };
    expect(derivePageBackgroundColor(page, true)).toBe('#373B43');
  });

  it('does not derive when disabled', () => {
    const page = { style: null, buttons: [dark, dark, dark, dark] };
    expect(derivePageBackgroundColor(page, false)).toBeUndefined();
  });

  it('does not derive without a strong majority', () => {
    const page = {
      style: null,
      buttons: [
        dark,
        dark,
        dark,
        { style: { backgroundColor: '#EAF2FBFF' } },
        { style: { backgroundColor: '#FF0000FF' } },
        { style: { backgroundColor: '#00FF00FF' } },
      ],
    };
    expect(derivePageBackgroundColor(page, true)).toBeUndefined();
  });

  it('ignores transparent button backgrounds', () => {
    const transparent = { style: { backgroundColor: '#FFFFFF00' } };
    const page = { style: null, buttons: [transparent, transparent, dark, dark, dark, dark] };
    expect(derivePageBackgroundColor(page, true)).toBe('#373B43');
  });

  it('needs a minimum number of buttons', () => {
    const page = { style: null, buttons: [dark, dark, dark] };
    expect(derivePageBackgroundColor(page, true)).toBeUndefined();
  });

  it('handles empty pages', () => {
    expect(derivePageBackgroundColor(null, true)).toBeUndefined();
    expect(derivePageBackgroundColor({ buttons: [] }, true)).toBeUndefined();
  });
});
