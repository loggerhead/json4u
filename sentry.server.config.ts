// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

  // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',
});
