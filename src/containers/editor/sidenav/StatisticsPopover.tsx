import Typography from "@/components/ui/typography";
import { type MessageKey } from "@/global";
import { type StatisticsKeys } from "@/lib/env";
import { dateToYYYYMMDD } from "@/lib/utils";
import { freeQuota, useUserStore } from "@/stores/userStore";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import BasePopover from "./BasePopover";

const i18nMap: Record<StatisticsKeys, MessageKey> = {
  graphModeView: "stats_graph",
  tableModeView: "stats_table",
  textComparison: "stats_compare",
  jqExecutions: "stats_jq",
};

export default function StatisticsPopover() {
  const t = useTranslations();
  const { statistics, nextQuotaRefreshTime, isPremium } = useUserStore(
    useShallow((state) => ({
      statistics: state.statistics,
      nextQuotaRefreshTime: state.nextQuotaRefreshTime,
      isPremium: state.isPremium,
    })),
  );
  const isFree = !isPremium();

  return (
    <BasePopover title="statistics">
      <div className="flex flex-col gap-2 w-60">
        {isFree && (
          <Typography affects="xs">{t("stats_description", { date: dateToYYYYMMDD(nextQuotaRefreshTime) })}</Typography>
        )}
        {Object.entries(statistics).map(([key, cnt]) => (
          <div key={key} className="flex">
            <Typography>{t(i18nMap[key as StatisticsKeys])}</Typography>
            <div className="ml-auto flex gap-1">
              <Typography>{cnt}</Typography>
              <Typography affects="muted">{"/"}</Typography>
              <Typography affects="muted">{isFree ? freeQuota[key as StatisticsKeys] : "∞"}</Typography>
            </div>
          </div>
        ))}
      </div>
    </BasePopover>
  );
}
