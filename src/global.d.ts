import type { MonacoApi } from "@/lib/editor/types.d.ts";
import "@hcaptcha/types";
import type { ImperativePanelHandle } from "react-resizable-panels";
import en from "../messages/en.json";

type Messages = typeof en;
export type MessageKey = MessageKeys<IntlMessages, "">;

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}

  interface Window {
    monacoApi: MonacoApi;
    leftPanelHandle: ImperativePanelHandle | null;

    createLemonSqueezy: () => void;
    LemonSqueezy: {
      /**
       * Initialises Lemon.js on your page.
       * @param options - An object with a single property, eventHandler, which is a function that will be called when Lemon.js emits an event.
       */
      Setup: (options: { eventHandler: (event: { event: string }) => void }) => void;
      /**
       * Refreshes `lemonsqueezy-button` listeners on the page.
       */
      Refresh: () => void;

      Url: {
        /**
         * Opens a given Lemon Squeezy URL, typically these are Checkout or Payment Details Update overlays.
         * @param url - The URL to open.
         */
        Open: (url: string) => void;

        /**
         * Closes the current opened Lemon Squeezy overlay checkout window.
         */
        Close: () => void;
      };
      Affiliate: {
        /**
         * Retrieve the affiliate tracking ID
         */
        GetID: () => string;

        /**
         * Append the affiliate tracking parameter to the given URL
         * @param url - The URL to append the affiliate tracking parameter to.
         */
        Build: (url: string) => string;
      };
    };
  }
}

// https://www.webdevluis.com/blog/fix-typescript-cannot-find-module-declaration-error-mdx-react
declare module "*.mdx" {
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}
