export class Config {
  // 左右两边的 editor 同步滚动
  syncScroll: boolean = true;
  // 展示右边的 editor。如果经常用 format 而不是 diff，隐藏右边 editor 可以展示更多内容
  showRightEditor: boolean = true;
  // 粘贴时自动格式化
  autoFormat: boolean = true;
  // 进行文本比较时忽略空白差异
  ignoreBlank: boolean = true;
}
