import {hex2rgba, rgb2rgba, rgba2hex, rgba2rgb} from "../lib/color";

describe("convert between rgb and rgba", () => {
  test("hex convert", () => {
    expect(hex2rgba("#eaeef280")).toEqual([234, 238, 242, 0.5]);
    expect(hex2rgba("#ffd7d5")).toEqual([255, 215, 213, 1]);
    expect(rgba2hex([234, 238, 242, 0.5])).toEqual("#eaeef280");
    expect(rgba2hex([255, 215, 213, 1])).toEqual("#ffd7d5");
  });

  test("rgba2rgb", () => {
    const tt = [
      // 填充块背景色
      ["#eaeef280", "#fffffe", "#f5f7f8"],
      // 删除行内高亮
      ["#ff818266", "#fffffe", "#ffcdcd"],
    ];

    for (const t of tt) {
      expect(rgba2rgb(t[0], t[1])).toEqual(t[2]);
    }
  });

  test("rgb2rgba 0.1", () => {
    const tt = [
      // 填充块背景色
      ["#f5f7f8", "#fffffe", "#9bafc21a"],
      // 新增背景色
      ["#e6ffec", "#fffffe", "#05ff4a1a"],
      // 新增行内高亮
      ["#abf2bc", "#fffffe", "#b77d6a1a"],
      // 新增行号背景色
      ["#ccffd8", "#fffffe", "#01ff821a"],
      // 删除背景色
      ["#ffebe9", "#fffffe", "#ff372c1a"],
      // 删除行内高亮
      ["#ffcdcd", "#fffffe", "#ff0b141a"],
      // 删除行号背景色
      ["#ffd7d5", "#fffffe", "#ff6f641a"],
      // 新增/删除行号字体色
      ["#1f2328", "#fffffe", "#3f67a21a"],
    ];

    for (const t of tt) {
      expect(rgb2rgba(t[0], t[1], 0.1)).toEqual(t[2]);
    }
  });

  test("rgb2rgba 0.2", () => {
    const tt = [
      // 填充块背景色
      ["#f5f7f8", "#fffffe", "#cdd7e033"],
      // 新增背景色
      ["#e6ffec", "#fffffe", "#82ffa433"],
      // 新增行内高亮
      ["#abf2bc", "#fffffe", "#5bbeb433"],
      // 新增行号背景色
      ["#ccffd8", "#fffffe", "#00ff4033"],
      // 删除背景色
      ["#ffebe9", "#fffffe", "#ff9b9533"],
      // 删除行内高亮
      ["#ffcdcd", "#fffffe", "#ff050933"],
      // 删除行号背景色
      ["#ffd7d5", "#fffffe", "#ff373133"],
      // 新增/删除行号字体色
      ["#1f2328", "#fffffe", "#9fb3d033"],
    ];

    for (const t of tt) {
      expect(rgb2rgba(t[0], t[1], 0.2)).toEqual(t[2]);
    }
  });

  test("rgb2rgba 0.4", () => {
    const tt = [
      // 新增行内高亮
      ["#abf2bc", "#fffffe", "#2ddf5966"],
      // 新增行号背景色
      ["#ccffd8", "#fffffe", "#80ff9f66"],
      // 删除行内高亮
      ["#ffcdcd", "#fffffe", "#ff828366"],
      // 删除行号背景色
      ["#ffd7d5", "#fffffe", "#ff9b9766"],
      // 新增/删除行号字体色
      ["#1f2328", "#fffffe", "#cfd9e766"],
    ];

    for (const t of tt) {
      expect(rgb2rgba(t[0], t[1], 0.4)).toEqual(t[2]);
    }
  });
});
