import { defaultCache } from "@serwist/next/worker";
import { CacheFirst, ExpirationPlugin, NetworkFirst, PrecacheEntry, Serwist, SerwistGlobalConfig } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const extraRuntimeCaching = [
  {
    matcher: /^https:\/\/cdn\.json4u\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: "static-cdn-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /jq\.(js|wasm)$/i,
    handler: new CacheFirst({
      cacheName: "next-jq-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        }),
      ],
    }),
  },
  {
    matcher: /.+\.worker\.js$/i,
    handler: new CacheFirst({
      cacheName: "next-monaco-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        }),
      ],
    }),
  },
  {
    matcher: /monaco-editor\.(js|css)$/i,
    handler: new CacheFirst({
      cacheName: "next-monaco-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        }),
      ],
    }),
  },
];

const runtimeCaching = defaultCache.length > 1 ? [...extraRuntimeCaching, ...defaultCache] : defaultCache;

// fix https://github.com/serwist/serwist/issues/146
runtimeCaching.push({
  matcher: () => true,
  handler: new NetworkFirst(),
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();
