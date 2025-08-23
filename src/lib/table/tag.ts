import { escape, filter } from "lodash-es";

export function h(tag: string = "", ...children: (H | string)[]) {
  return new H(tag, ...children);
}

export class H {
  tag: string;
  attrId?: string;
  attrClass: string[];
  attrTitle?: string;
  attrStyle?: string;
  children: (H | string)[];

  constructor(tag: string = "", ...children: (H | string)[]) {
    this.tag = tag;
    this.attrClass = [];
    this.children = filter(children, (child) => child !== "");
  }

  id(id: string | undefined): H {
    this.attrId = id;
    return this;
  }

  class(...clss: string[]): H {
    clss.length && this.attrClass.push(...clss);
    return this;
  }

  style(style: string | undefined): H {
    this.attrStyle = style;
    return this;
  }

  child(child: H | string): H {
    this.children.push(child);
    return this;
  }

  addChildren(children: (H | string)[]): H {
    this.children = this.children.concat(children);
    return this;
  }

  title(title: string): H {
    this.attrTitle = title;
    return this;
  }

  toString(): string {
    const childrenStr = this.children
      .map((child) => (typeof child === "string" ? escape(child) : child.toString()))
      .join("");

    if (this.tag === "") {
      return childrenStr;
    } else {
      const attrs = [];
      if (this.attrId) attrs.push(`id="${escape(this.attrId)}"`);
      if (this.attrClass.length) attrs.push(`class="${escape(this.attrClass.join(" "))}"`);
      if (this.attrTitle) attrs.push(`title="${escape(this.attrTitle)}"`);
      if (this.attrStyle) attrs.push(`style="${escape(this.attrStyle)}"`);
      return `<${this.tag} ${attrs.join(" ")}>${childrenStr}</${this.tag}>`;
    }
  }

  toDom(): HTMLElement | DocumentFragment {
    const el = this.tag
      ? (() => {
          const el = document.createElement(this.tag);
          if (this.attrId) el.setAttribute("id", this.attrId);
          if (this.attrClass.length) el.setAttribute("class", this.attrClass.join(" "));
          if (this.attrTitle) el.setAttribute("title", this.attrTitle);
          if (this.attrStyle) el.setAttribute("style", this.attrStyle);
          return el;
        })()
      : document.createDocumentFragment();

    el.append(...this.children.map((child) => (typeof child === "string" ? child : child.toDom())));
    return el;
  }
}
