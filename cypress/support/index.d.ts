// 声明 commands.js 的类型，用于 IDE 提示
declare global {
    namespace Cypress {
        interface Chainable {
            // 访问首页并等待页面加载成功（5s 超时）
            visitHome(): Chainable<any>;

            // 粘贴
            paste(data: string): Chainable<JQuery<HTMLElement>>;

            // 获取编辑器
            editor(side: string = "left"): Chainable<JQuery<HTMLElement>>;

            // 获取编辑器实例
            editorRef(side: string = "left"): Chainable<any>;

            // 获取编辑器文本
            editorText(side: string = "left"): Chainable<string>;

            // 输入到编辑器
            editorType(input: string, side: string = "left", parseSpecialCharSequences: boolean = false): Chainable<JQuery<HTMLElement>>;

            // 等待编辑器输入完成
            waitInput(side: string = "left"): Chainable<JQuery<HTMLElement>>;

            // 拖拽上传文件到编辑器
            dropFile(alias: string, side: string = "left"): Chainable<JQuery<HTMLElement>>;

            // 从 local storage 读设置值。读不到时返回 undefined
            getSetting(key: string): Chainable<any>;
        }
    }
}