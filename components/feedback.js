"use client";
import * as sentry from "@sentry/react";

export default function Feedback() {
  const client = sentry.getClient();
  const feedback = client?.getIntegration(sentry.Feedback);
  return <button id="feedback" onClick={() => feedback.openDialog()}>
    反馈
  </button>;
}
