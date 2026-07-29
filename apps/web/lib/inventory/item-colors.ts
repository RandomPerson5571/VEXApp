export const INVENTORY_COLOR_PRESETS = [
  { id: "red", label: "Red", value: "#b94a48" },
  { id: "blue", label: "Blue", value: "#3f6fa9" },
  { id: "yellow", label: "Yellow", value: "#b08a2e" },
  { id: "green", label: "Green", value: "#3f8f63" },
  { id: "orange", label: "Orange", value: "#b66a35" },
  { id: "purple", label: "Purple", value: "#7c5aa6" },
  { id: "cyan", label: "Cyan", value: "#2f8fa3" },
  { id: "pink", label: "Pink", value: "#b45d86" },
] as const;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function componentToHex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0");
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) {
      h = (g - b) / delta + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h /= 6;
  }

  return { h, s, l };
}

function hueToRgb(p: number, q: number, t: number) {
  let value = t;

  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) {
    const gray = l * 255;
    return { red: gray, green: gray, blue: gray };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    red: hueToRgb(p, q, h + 1 / 3) * 255,
    green: hueToRgb(p, q, h) * 255,
    blue: hueToRgb(p, q, h - 1 / 3) * 255,
  };
}

export function muteInventoryColor(color: string) {
  const normalized = color.trim().toLowerCase();

  if (!HEX_COLOR_PATTERN.test(normalized)) {
    return INVENTORY_COLOR_PRESETS[0].value;
  }

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const hsl = rgbToHsl(red, green, blue);
  const muted = hslToRgb(hsl.h, clamp(hsl.s, 0.28, 0.58), clamp(hsl.l, 0.34, 0.58));

  return `#${componentToHex(muted.red)}${componentToHex(muted.green)}${componentToHex(
    muted.blue,
  )}`;
}

export function normalizeInventoryColor(color: string | null | undefined) {
  if (!color) return null;
  return muteInventoryColor(color);
}
