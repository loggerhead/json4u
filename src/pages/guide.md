---
layout: ../layouts/Markdown.astro
title: JSON For You 使用指南
---

# 使用指南

**[JSON For You](https://json4u.com)** 是我找遍了市面上的同类工具，始终找不到符合本人全部需求的工具后，本着“自己动手，丰衣足食”的想法做的 JSON 工具箱。目标是对常用的 JSON 展示、处理功能提供最高的生产效率。由于是自用，所以：

1. 不保证会提供非常全的功能；
2. 会持续更新、维护；

下面对 JSON For You 支持的功能一一介绍。

## JSON 语义化比较

JSON 语义化比较是指忽略 JSON 中的 key 顺序，根据数据结构对两个 JSON 数据进行对比。与一般的 JSON 对比网站不同，本站还提供了以下功能：

![JSON diff example](/guide/diff.png)

- **int64 比较**。由于我时常遇到两个需要对比的 JSON 数据只有 ID 不一样，而 ID 通常会定义为 int64 类型，为了能够快速找出这类差异，所以做了 int64 比较的功能。实际上不只是 int64，任何 [Bigint](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/BigInt) 都能进行比较；
- **逐字符比较**。有时候两个 JSON 数据只有很少的差别，比如：两个很长的字符串，但只有一两个字符不一样，此时肉眼很难发现具体哪个地方不一致。所以做了这个功能，让你能一眼看出具体差别；
- **key 比较**。有时候小伙伴改了回包字段的大小写却没有通知你，你怎么看也不知道哪出了问题，此时如果通过 JSON For You 来对比就能有效的发现这种问题了；
- **数组差分比较**。如果两个 JSON 数组有差异，我们往往不需要再查看每一个元素的 diff，因为很可能会有比较多的噪音，并不方便我们肉眼查看。所以做了差分比较，希望能像 `git diff` 一样提供简洁的、人类可读的差异；
- **拖拽/粘贴比较文件**。拖动文件或粘贴文件到 textarea 中，它会自动读取文件内容再进行 JSON diff。不会有网络请求，所有的数据传输都发生在本地；

## JSON 基本功能

以下 JSON 基本功能都需要使用左侧 textarea，如果想要更宽的展示空间，可以在「设置」中点击「显示右侧编辑器」隐藏右侧 textarea。

- **JSON 格式化**（JSON Formatter）。粘贴后自动格式化，**即使是无效的 JSON 数据也会尽力格式化**。如果需要关闭自动格式化，可以在「设置」中点击「粘贴时自动格式化」进行关闭；

  ![JSON format example](/guide/format.png)

- **JSON 最小化**（JSON Minify/Beautifier）。去除所有的空白字符，将 JSON 数据压缩成一行；
- **JSON 校验**（JSON Validator）。点击「比较」按钮进行校验，错误行会有标注，具体错误会展示在右侧；

  ![JSON validate example](/guide/valid.png)

- **数据折叠**。点行号右侧的向下箭头，可以进行折叠；

  ![JSON fold example](/guide/fold.png)

- **JSON 转义**（JSON Escape）。对 JSON 数据进行转义，使其成为一个合法的字符串。即使是无效的 JSON 也能转义；
- **JSON 反转义**（JSON Unescape）。对 JSON 数据进行反转义，使其成为合法的 JSON object。即使是无效的 JSON 也能反转义；

## 文本比较

因为文本比较也是很常见的需求，而且为了让无效的 JSON 文本也能进行 diff，所以本站还支持了体验接近 `git diff` 的文本比较（text diff）。效果如图：

![text diff example](/guide/text-diff.png)

使用前建议关闭「设置」中的「粘贴时自动格式化」，并打开「忽略空白差异」。
