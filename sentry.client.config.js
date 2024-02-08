// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import version from "./lib/version";

// https://docs.sentry.io/platforms/javascript/guides/nextjs/user-feedback/configuration/
const feedback = new Sentry.Feedback({
  autoInject: false,
  showName: false,
  showBranding: false,
  buttonLabel: "",
  formTitle: "",
  submitButtonLabel: "Send",
});

feedback.attachTo(document.querySelector("#feedback"));

Sentry.init({
  dsn: "https://d60bd8847a6d8afc72e3de0d9288fa4c@o4506325094236160.ingest.sentry.io/4506325157085184",
  ignoreErrors: [
    "Invalid regular expression:",
    "ResizeObserver loop completed with undelivered notifications",
  ],

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  release: version,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0,
  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    feedback,
    new Sentry.Replay({
      // Additional SDK configuration goes in here, for example:
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,
    }),
  ],
});
