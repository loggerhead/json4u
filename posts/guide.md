---
title: JSON For You 使用指南
---

**[JSON For You](https://json4u.com)** 是我找遍了市面上的同类工具，始终找不到符合全部需求的工具后，本着“自己动手，丰衣足食”的想法做的 JSON 工具箱。目标是对常用的 JSON 展示、处理功能提供最高的生产效率。由于是自用，所以：

1. 会持续更新、维护；
2. 不会轻易引入广告；

使用中有任何问题，或者希望支持新功能，都欢迎通过 [Feedback](https://github.com/loggerhead/json4u-issue/issues) 反馈。下面对 **[JSON For You](https://json4u.com)** 支持的功能做一个简单介绍。

## JSON 语义化比较

JSON 语义化比较（又被称作 JSON 结构化比较）是指忽略 JSON 中 key 的顺序，根据数据结构对两个 JSON 数据进行对比（类似于 `git diff`，只不过能理解数据的语义）。

![JSON diff example](/guide/diff.png)

拖拽文件或粘贴文本时，如果两侧编辑器都有内容，会自动进行比较。与一般的 JSON 对比网站不同，本站还提供了以下功能：

- **int64 比较**。在业务开发中 ID 通常会定义为 int64，而 js 的 number 只能精确表达 52bit 整数，此类字段如果前后端不做特殊处理，会丢失精度。为了快速找出这类差异，所以支持了 [Bigint](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/BigInt) 比较的功能；
- **逐字符比较**。有时候两个 JSON 数据只有很少的差别，比如：两个很长的字符串，但只有一两个字符不一样，此时肉眼很难发现具体哪个地方不一致。所以支持了逐字符比较，让你能一眼看出具体 diff；
- **key 比较**。如果小伙伴误改了 response 字段的大小写（或者误删了一个字符），你怎么看也不知道哪出了问题，此时如果通过 **[JSON For You](https://json4u.com)** 来对比就能有效的发现这种问题了；
- **数组差分比较**。如果两个 JSON 数组有差异，一般情况下我们其实不需要查看每一个元素的 diff，因为很可能会有比较多的噪音，并不方便我们肉眼查看。所以做了差分比较，提供与 `git diff` 一样简洁、人类可读的差异；
- **文本比较**。因为文本比较也是很常见的需求，所以支持了将无效 JSON 降级为文本比较（text diff），体验与 `git diff` 接近。效果如图：

   ![text diff example](/guide/text-diff.png)

## 支持的 JSON 工具

左侧编辑器放置了 JSON 常用功能的按钮，其它功能可以通过点击右键菜单来使用。

- **JSON 校验**（JSON Validator）。有修改时会自动做校验。错误行会有标注，并提供充足的上下文帮助定位错误；

  ![JSON validate example](/guide/valid.png)

- **JSON 格式化**（JSON Formatter/Beautifier）。拖拽文件或粘贴后会自动格式化，即使是无效的 JSON 数据也能格式化。如果不需要格式化，可以按 `cmd+z` 撤销。

  ![JSON format example](/guide/format.png)

- **JSON 最小化**（JSON Minify）。去除所有的空白字符，将 JSON 数据压缩成一行。如果是无效的 JSON，**会尝试修复后再进行最小化（可能会丢弃解析错误的 token）**；
- **JSON 转义**（JSON Escape）。对 JSON 数据进行转义，增加 `\` 字符使其成为一个合法的字符串；
- **JSON 反转义**（JSON Unescape）。对 JSON 数据进行反转义，删除 `\` 字符使其成为合法的 JSON；
- **JSON 排序**（JSON Sort）。递归的对 key 做排序，但不会对数组做排序，排序前后的 JSON 在语义上是相等的。常用于排序后比较，让 diff 集中在一起，方便人眼查看。
- **显示 JSON 路径**（JSON Pointer/Path）。鼠标点击任意处，会展示对应 token 的 [JSON Pointer](https://datatracker.ietf.org/doc/html/rfc6901)。和 minimap 搭配使用，能帮助快速理解 JSON 的结构；

  ![JSON pointer example](/guide/json-pointer.png)

- **URL 转 JSON**。递归的解析 URL 转成一个 JSON。如果需要对比两个 URL 的 diff，先转成 JSON 再使用 diff 就非常方便。

  ![URL to JSON example](/guide/url2json-before.png)
  ![URL to JSON example](/guide/url2json-after.png)

## 编辑器功能

除了支持 JSON 以外，常见的编辑器功能也是支持的：

- **折叠/展开**。鼠标移动到行号，会自动显示折叠图标，点击图标，可以折叠或展开；
- **拖拽文件**。拖动文件到编辑器中会自动读取文件内容，所有的数据传输都发生在本地，没有网络请求；
- **查找并替换**。支持查找并替换，支持正则表达式；

## 更新日志

- 2023-08-01: 2.0.0 上线
- 2022-01-12: 1.0.0 上线
