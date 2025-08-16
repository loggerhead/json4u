export type RGB = `rgb(${number}, ${number}, ${number})`;
export type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
export type HEX = `#${string}`;
export type Color = RGB | RGBA | HEX;

/**
 * Converts a hexadecimal value to decimal (e.g., 'ff' → 255)
 * @param hex - Hexadecimal string to convert
 * @returns Decimal number (0-255)
 */
function hexToDec(hex: string): number {
  return parseInt(hex, 16);
}

/**
 * Converts a decimal value to hexadecimal (e.g., 255 → 'ff')
 * @param dec - Decimal number to convert (0-255)
 * @returns Hexadecimal string (2 characters)
 */
function decToHex(dec: number): string {
  const hex = Math.round(dec).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

/**
 * Converts hex color to RGB format
 * @param hex - Hexadecimal color string (supports #fff, #ffffff, #fff0, #ffffff00)
 * @returns RGB color object with alpha channel or null for invalid format
 */
function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } | undefined {
  // Regular expression to match various hex formats
  const match = hex.match(/^#?([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (!match) return;

  let hexStr = match[1];
  let a = 1; // Default to opaque

  // Handle 3 or 4-digit hex (expand to 6 or 8 digits)
  if (hexStr.length === 3) {
    hexStr = hexStr
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (hexStr.length === 4) {
    hexStr = hexStr
      .split("")
      .map((c) => c + c)
      .join("");
    a = hexToDec(hexStr.slice(6, 8)) / 255; // Extract alpha channel
    hexStr = hexStr.slice(0, 6);
  }

  // Handle 6 or 8-digit hex
  if (hexStr.length === 8) {
    a = hexToDec(hexStr.slice(6, 8)) / 255;
    hexStr = hexStr.slice(0, 6);
  }

  return {
    r: hexToDec(hexStr.slice(0, 2)),
    g: hexToDec(hexStr.slice(2, 4)),
    b: hexToDec(hexStr.slice(4, 6)),
    a: Math.round(a * 100) / 100, // Round to two decimal places
  };
}

/**
 * Converts RGB color to hexadecimal format
 * @param r - Red channel value (0-255)
 * @param g - Green channel value (0-255)
 * @param b - Blue channel value (0-255)
 * @param a - Alpha channel value (0-1, defaults to 1)
 * @returns Hexadecimal color string (e.g., #ff0088 or #ff0088cc)
 */
function rgbToHex(r: number, g: number, b: number, a: number = 1): string {
  // Boundary value handling
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const hex = `#${decToHex(clamp(r))}${decToHex(clamp(g))}${decToHex(clamp(b))}`;

  // Add alpha channel only when alpha < 1
  if (a < 1) {
    const alphaHex = decToHex(Math.round(a * 255));
    return hex + alphaHex;
  }
  return hex;
}

/**
 * Converts RGB color to HSL format
 * @param r - Red channel value (0-255)
 * @param g - Green channel value (0-255)
 * @param b - Blue channel value (0-255)
 * @param a - Alpha channel value (0-1, defaults to 1)
 * @returns HSL color object with alpha channel
 */
function rgbToHsl(r: number, g: number, b: number, a: number = 1): { h: number; s: number; l: number; a: number } {
  // Normalize to 0-1 range
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60; // Convert to degrees (0-360)
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100), // Convert to percentage
    l: Math.round(l * 100),
    a: Math.round(a * 100) / 100,
  };
}

/**
 * Converts HSL color to RGB format
 * @param h - Hue value (0-360)
 * @param s - Saturation value (0-100%)
 * @param l - Lightness value (0-100%)
 * @param a - Alpha channel value (0-1, defaults to 1)
 * @returns RGB color object with alpha channel
 */
function hslToRgb(h: number, s: number, l: number, a: number = 1): { r: number; g: number; b: number; a: number } {
  h = ((h % 360) + 360) % 360; // Ensure h is within 0-360 range
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // Grayscale
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h / 360 + 1 / 3);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, h / 360 - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: Math.round(a * 100) / 100,
  };
}

/**
 * Main color conversion entry point (supports string input)
 * @param color - Color string in hex/rgb/rgba/hsl/hsla format
 * @returns Object containing conversion results in all three formats or null for invalid input
 */
export function convertColor(color: string): { hex: string; rgb: string; hsl: string } | undefined {
  let rgb: ReturnType<typeof hexToRgb> = undefined;

  // Attempt to parse as hex
  if (color.startsWith("#")) {
    rgb = hexToRgb(color);
    // Attempt to parse as rgb/rgba
  } else if (color.startsWith("rgb")) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) {
      return;
    }

    rgb = {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
    // Attempt to parse as hsl/hsla
  } else if (color.startsWith("hsl")) {
    const match = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)/);
    if (!match) {
      return;
    }

    const hslObj = {
      h: parseInt(match[1]),
      s: parseInt(match[2]),
      l: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
    rgb = hslToRgb(hslObj.h, hslObj.s, hslObj.l, hslObj.a);
  }

  // Calculate all formats
  if (rgb === undefined) {
    return;
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b, rgb.a);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a);

  return {
    hex,
    rgb: `rgb${rgb.a < 1 ? "a" : ""}(${rgb.r}, ${rgb.g}, ${rgb.b}${rgb.a < 1 ? `, ${rgb.a}` : ""})`,
    hsl: `hsl${hsl.a < 1 ? "a" : ""}(${hsl.h}, ${hsl.s}%, ${hsl.l}%${hsl.a < 1 ? `, ${hsl.a}` : ""})`,
  };
}

/**
 * Checks if a string is a valid color string.
 * @param value - The string to check.
 * @returns True if the string is a valid color, false otherwise.
 */
export function isColor(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value) || /^(rgb|rgba|hsl)\(.*\)$/.test(value);
}
