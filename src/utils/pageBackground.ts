/**
 * Derive a board/page background colour for rendering.
 *
 * Explicit `page.style.backgroundColor` always wins. Otherwise, Grid 3
 * gridsets communicate the page surround through the styles referenced by
 * their cells (`BackColour`): when a strong majority of buttons share the
 * same opaque background colour, that colour is the surround the board
 * should render behind its keys. Boards with varied or mostly-transparent
 * button backgrounds (OBZ, Snap, generated layouts with sparse styling)
 * derive nothing and keep the viewer default.
 */

const RGBA_RE = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/;

function toHexPair(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
}

/**
 * Normalise any CSS colour the loaders produce to `#RRGGBB` (alpha dropped).
 * Returns null for transparent colours (alpha 0) and unparseable input.
 */
export function normalizeOpaqueHex(color?: string | null): string | null {
  if (!color || typeof color !== 'string') return null;
  const rgb = color.match(RGBA_RE);
  if (rgb) {
    if (rgb[4] !== undefined && parseFloat(rgb[4]) === 0) return null;
    return `#${toHexPair(parseInt(rgb[1], 10))}${toHexPair(parseInt(rgb[2], 10))}${toHexPair(parseInt(rgb[3], 10))}`;
  }
  const hex = color.replace('#', '').trim();
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) return `#${hex.toUpperCase()}`;
  if (/^[0-9A-Fa-f]{8}$/.test(hex)) {
    if (hex.slice(6) === '00') return null; // fully transparent
    return `#${hex.slice(0, 6).toUpperCase()}`;
  }
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }
  return null;
}

export interface PageBackgroundSource {
  style?: { backgroundColor?: string | null } | null;
  buttons?: Array<{ style?: { backgroundColor?: string | null } | null }> | null;
}

/** Minimum buttons before derivation is trusted */
const MIN_BUTTONS = 4;
/** Fraction of buttons that must share one opaque colour */
const MAJORITY = 0.6;

/**
 * Page background for rendering: explicit page style first, then the
 * majority button surround colour, else undefined (viewer default).
 */
export function derivePageBackgroundColor(
  page: PageBackgroundSource | null | undefined,
  enabled: boolean
): string | undefined {
  const explicit = normalizeOpaqueHex(page?.style?.backgroundColor);
  if (explicit) return explicit;
  if (!enabled || !page?.buttons) return undefined;

  const counts = new Map<string, number>();
  let total = 0;
  for (const button of page.buttons) {
    if (!button?.style?.backgroundColor) continue;
    total++;
    const hex = normalizeOpaqueHex(button.style.backgroundColor);
    if (!hex) continue;
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  if (total < MIN_BUTTONS) return undefined;
  for (const [hex, count] of counts) {
    if (count / total >= MAJORITY) return hex;
  }
  return undefined;
}
