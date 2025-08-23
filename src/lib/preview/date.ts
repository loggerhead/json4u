import { genDate, isDate, isTimestamp } from "@/lib/date";
import { t } from "@/stores/editorStore";
import type { Previewer } from "./types";
import { genTable } from "./utils";

export const datePreviewer: Previewer = {
  detector: (value) => {
    if (isTimestamp(value)) {
      const n = Number(value) * (value.length === 10 ? 1000 : 1);
      const t = new Date(n).getTime();
      return t === n;
    }
    return isDate(value);
  },

  generator: (value) => {
    const v = genDate(value);
    const rfc3339 = v.toISOString();
    const local = v.toLocaleString();
    const timestamp = Math.floor(v.getTime() / 1000);

    // Calculate time ago
    const now = new Date();
    const diffMs = now.getTime() - v.getTime();
    const absDiffMs = Math.abs(diffMs);
    const seconds = Math.floor(absDiffMs / 1000) % 60;
    const minutes = Math.floor(absDiffMs / (1000 * 60)) % 60;
    const hours = Math.floor(absDiffMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));

    let duration = "";
    if (days > 0) duration += `${days}d`;
    if (hours > 0) duration += `${hours}h`;
    if (minutes > 0) duration += `${minutes}m`;
    if (seconds > 0) duration += `${seconds}s`;
    if (duration === "") duration = "0s";

    return genTable({
      [t("Preview.ISO")]: rfc3339,
      [t("Preview.Local")]: local,
      [t("Preview.Timestamp")]: String(timestamp),
      [t("Preview.RelativeTime")]:
        diffMs > 0 ? t("Preview.TimeAgo", { duration }) : t("Preview.TimeFromNow", { duration }),
    });
  },
};
