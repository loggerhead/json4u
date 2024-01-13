"use client";
import * as sentry from "@sentry/react";
import {IconBug} from '@arco-design/web-react/icon';


export default function Feedback() {
  const client = sentry.getClient();
  const feedback = client?.getIntegration(sentry.Feedback);
  return <button id="feedback" onClick={() => feedback.openDialog()}>
    <IconBug/> 反馈
  </button>;
}
