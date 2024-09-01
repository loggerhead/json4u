// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import { version } from "@/lib/env";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d60bd8847a6d8afc72e3de0d9288fa4c@o4506325094236160.ingest.us.sentry.io/4506325157085184",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  release: version,
});
