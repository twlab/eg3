/* The colours of a block: a stretch read on the other strand, drawn as one
   piece (BarCanvas.tsx). Both come from the haplotype's own colour, so a
   block is its haplotype's and no new hue enters the drawing: the fill a
   shade darker, the outline darker still. A colour that is not #rrggbb is
   given back as it is. */

const TONE_DARKER = 14;
const TONE_RICHER = 4;
const RING_DARKER = 45;

function hslOf(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

function hexOf(hue: number, saturation: number, lightness: number): string {
  const s = Math.min(100, Math.max(0, saturation)) / 100;
  const l = Math.min(100, Math.max(0, lightness)) / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** A block's fill: the haplotype's colour a shade darker. */
export function blockTone(color: string): string {
  const hsl = hslOf(color);
  return hsl ? hexOf(hsl[0], hsl[1] + TONE_RICHER, hsl[2] - TONE_DARKER) : color;
}

/** A block's outline: the haplotype's colour, dark. */
export function blockRing(color: string): string {
  const hsl = hslOf(color);
  return hsl ? hexOf(hsl[0], hsl[1], hsl[2] - RING_DARKER) : color;
}
