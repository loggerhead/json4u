import { useEffect } from "react";
import { getStatistics } from "@/app/actions";
import Typography from "@/components/ui/typography";
import { type MessageKey } from "@/global";
import { type StatisticsKeys } from "@/lib/env";
import { dateToYYYYMMDD } from "@/lib/utils";
import { freeQuota, initialStatistics, useUserStore } from "@/stores/userStore";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import BasePopover from "./BasePopover";

const i18nMap: Record<StatisticsKeys, MessageKey> = {
  graphModeView: "stats_graph",
  tableModeView: "stats_table",
  textComparison: "stats_compare",
  jqExecutions: "stats_jq",
};

export default function StatisticsPopover() {
  const t = useTranslations();
  const { statistics, setStatistics, nextQuotaRefreshTime, isPremium } = useUserStore(
    useShallow((state) => ({
      statistics: state.statistics,
      setStatistics: state.setStatistics,
      nextQuotaRefreshTime: state.nextQuotaRefreshTime,
      isPremium: state.isPremium(),
    })),
  );

  useEffect(() => {
    (async () => {
      try {
        const fallbackKey = (await getPublicIP()) ?? "";
        const { statistics, expiredAt, error } = await getStatistics(fallbackKey);
        if (error) {
          console.error("getStatistics failed:", error);
        } else {
          setStatistics({ ...initialStatistics, ...statistics }, expiredAt!, fallbackKey);
        }
      } catch (error) {
        console.error("getStatistics failed:", error);
      }
    })();
  }, []);

  return (
    <BasePopover title="statistics">
      <div className="flex flex-col gap-2 w-60">
        {!isPremium && nextQuotaRefreshTime && (
          <Typography affects="xs">{t("stats_description", { date: dateToYYYYMMDD(nextQuotaRefreshTime) })}</Typography>
        )}
        {Object.entries(statistics).map(([key, cnt]) => (
          <div key={key} className="flex">
            <Typography>{t(i18nMap[key as StatisticsKeys])}</Typography>
            <div className="ml-auto flex gap-1">
              {isPremium ? (
                <Typography affects="muted">{"∞"}</Typography>
              ) : (
                <>
                  <Typography>{cnt}</Typography>
                  <Typography affects="muted">{"/"}</Typography>
                  <Typography affects="muted">{freeQuota[key as StatisticsKeys]}</Typography>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </BasePopover>
  );
}

async function getPublicIP() {
  try {
    const resp = await fetch("https://api64.ipify.org");
    return await resp.text();
  } catch (error) {
    console.error("failed to get public IP:", error);
  }
}
