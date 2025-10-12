/**
 * This file provides a lightweight, chainable API for programmatically creating HTML elements,
 * similar in spirit to Hyperscript or the jQuery constructor. It is primarily designed for use
 * within a Web Worker, where direct DOM manipulation is not possible, allowing for the generation
 * of HTML strings that can be sent back to the main thread.
 */
import { escape } from "lodash-es";

/**
 * A factory function and shorthand for creating a new `H` instance.
 * @param tag The HTML tag name (e.g., 'div', 'span').
 * @param children A list of child elements, which can be other `H` instances or strings.
 * @returns A new `H` instance.
 */
export function h(tag: string = "", ...children: (H | string)[]) {
  return new H(tag, ...children);
}

/**
 * The main class for building HTML elements. It provides a fluent interface for setting
 * attributes (id, class, style) and appending children.
 */
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
    this.children = children.filter((child) => child !== "");
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

  title(title: string): H {
    this.attrTitle = title;
    return this;
  }

  /**
   * Serializes the element and its children to an HTML string.
   * All attribute values and text content are properly escaped.
   * @returns The generated HTML string.
   */
  toString(): string {
    const childrenStr = this.children
      .map((child) => (typeof child === "string" ? escape(child) : child.toString()))
      .join("");

    if (this.tag === "") {
      // If the tag is empty, it acts as a fragment.
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

  /**
   * Converts the `H` instance into a live DOM element or a DocumentFragment.
   * This method is for use in a browser environment.
   * @returns An `HTMLElement` or `DocumentFragment` representing the structure.
   */
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
