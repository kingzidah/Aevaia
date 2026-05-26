/**
 * Returns a dark or light foreground color that contrasts well against `bgHex`.
 * Uses the YIQ perceptual luminance formula.
 */
export function getContrastColor(bgHex: string): string {
  const hex = bgHex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#09090b" : "#ffffff";
}
