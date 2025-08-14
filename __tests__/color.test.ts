import { convertColor } from "@/lib/color/index";

describe("convertColor", () => {
  test("converts 3-digit hex color to rgb and hsl", () => {
    const result = convertColor("#f00");
    expect(result).toEqual({
      hex: "#ff0000",
      rgb: "rgb(255, 0, 0)",
      hsl: "hsl(0, 100%, 50%)",
    });
  });

  test("converts 6-digit hex color with alpha channel", () => {
    const result = convertColor("#00ff0080");
    expect(result).toEqual({
      hex: "#00ff0080",
      rgb: "rgba(0, 255, 0, 0.5)",
      hsl: "hsla(120, 100%, 50%, 0.5)",
    });
  });

  test("converts rgb color to hex and hsl", () => {
    const result = convertColor("rgb(0, 255, 0)");
    expect(result).toEqual({
      hex: "#00ff00",
      rgb: "rgb(0, 255, 0)",
      hsl: "hsl(120, 100%, 50%)",
    });
  });

  test("converts rgba color with alpha channel", () => {
    const result = convertColor("rgba(0, 255, 0, 0.5)");
    expect(result).toEqual({
      hex: "#00ff0080",
      rgb: "rgba(0, 255, 0, 0.5)",
      hsl: "hsla(120, 100%, 50%, 0.5)",
    });
  });

  test("converts hsl color to hex and rgb", () => {
    const result = convertColor("hsl(240, 100%, 50%)");
    expect(result).toEqual({
      hex: "#0000ff",
      rgb: "rgb(0, 0, 255)",
      hsl: "hsl(240, 100%, 50%)",
    });
  });

  test("converts hsla color with alpha channel", () => {
    const result = convertColor("hsla(240, 100%, 50%, 0.5)");
    expect(result).toEqual({
      hex: "#0000ff80",
      rgb: "rgba(0, 0, 255, 0.5)",
      hsl: "hsla(240, 100%, 50%, 0.5)",
    });
  });

  test("returns null for invalid color format", () => {
    const result = convertColor("invalid-color");
    expect(result).toBeUndefined();
  });

  test("returns null for invalid hex color", () => {
    const result = convertColor("#ggg");
    expect(result).toBeUndefined();
  });
});
