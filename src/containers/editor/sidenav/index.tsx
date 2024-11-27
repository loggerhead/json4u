"use client";

import Link from "next/link";
import Logo from "@/components/icons/Logo";
import { Separator } from "@/components/ui/separator";
import { isCN, version } from "@/lib/env";
import { useStatusStore } from "@/stores/statusStore";
import {
  ArrowDownNarrowWide,
  Braces,
  Download,
  FileUp,
  MessageCircleQuestion,
  Share2,
  SquareStack,
  BarChartBig,
  AlignHorizontalJustifyCenter,
  ArrowLeftToLine,
  ArrowRightFromLine,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import AccountButton from "./AccountButton";
import Button from "./Button";
import ExportPopover from "./ExportPopover";
import { Label } from "./IconLabel";
import ImportPopover from "./ImportPopover";
import LinkButton from "./LinkButton";
import PopoverBtn, { popoverBtnClass } from "./PopoverButton";
import SharePopover from "./SharePopover";
import StatisticsPopover from "./StatisticsPopover";
import Toggle from "./Toggle";

export default function SideNav() {
  const t = useTranslations();
  const {
    sideNavExpanded,
    setSideNavExpanded,
    fixSideNav,
    setFixSideNav,
    enableAutoFormat,
    enableAutoSort,
    enableNestParse,
    setParseOptions,
    enableSyncScroll,
    setEnableSyncScroll,
  } = useStatusStore(
    useShallow((state) => ({
      sideNavExpanded: !!state.sideNavExpanded,
      setSideNavExpanded: state.setSideNavExpanded,
      fixSideNav: state.fixSideNav,
      setFixSideNav: state.setFixSideNav,
      enableAutoFormat: !!state.parseOptions.format,
      enableAutoSort: !!state.parseOptions.sort,
      enableNestParse: !!state.parseOptions.nest,
      setParseOptions: state.setParseOptions,
      enableSyncScroll: state.enableSyncScroll,
      setEnableSyncScroll: state.setEnableSyncScroll,
    })),
  );

  return (
    <div
      className="flex flex-col h-full w-8"
      onMouseEnter={(event) => {
        if (fixSideNav || (event.target as HTMLElement).closest(`.${popoverBtnClass}`)) {
          return;
        }
        setSideNavExpanded(true);
      }}
      onMouseLeave={() => setSideNavExpanded(false)}
    >
      <nav
        className="group z-50 h-full py-1.5 w-8 data-[expanded=true]:w-32 box-content border-r border-default shadow-xl transition-width duration-200 hide-scrollbar flex flex-col justify-between bg-background overflow-hidden"
        data-expanded={sideNavExpanded}
      >
        <ul className="relative flex flex-col justify-start px-1 gap-y-1">
          <Link prefetch={false} href="/" className="flex items-center pointer mt-1 mb-2">
            <Logo className="w-6 h-6" />
            <Label title={`v${version}`} />
          </Link>
          <PopoverBtn title={t("Import")} icon={<FileUp className="icon" />} content={<ImportPopover />} />
          <PopoverBtn title={t("Export")} icon={<Download className="icon" />} content={<ExportPopover />} />
          <PopoverBtn
            className="hidden"
            title={t("Share")}
            icon={<Share2 className="icon" />}
            content={<SharePopover />}
          />
          <Separator className="my-1" />
          <Toggle
            icon={<Braces className="icon" />}
            title={t("Auto Format")}
            description={t("auto_format_desc")}
            isPressed={enableAutoFormat}
            onPressedChange={(pressed) => setParseOptions({ format: pressed })}
          />
          <Toggle
            icon={<SquareStack className="icon" />}
            title={t("Nested Parse")}
            description={t("nested_parse_desc")}
            isPressed={enableNestParse}
            onPressedChange={(pressed) => setParseOptions({ nest: pressed })}
          />
          <Toggle
            icon={<ArrowDownNarrowWide className="icon" />}
            title={t("Auto Sort")}
            description={t("auto_sort_desc")}
            isPressed={enableAutoSort}
            onPressedChange={(pressed) => setParseOptions({ sort: pressed ? "asc" : undefined })}
          />
          <Toggle
            icon={<AlignHorizontalJustifyCenter className="icon" />}
            title={t("sync_reveal")}
            description={t("sync_reveal_desc")}
            isPressed={enableSyncScroll}
            onPressedChange={(pressed) => setEnableSyncScroll(pressed)}
          />
        </ul>
        <ul className="flex flex-col px-1 gap-y-2">
          <LinkButton
            icon={<MessageCircleQuestion className="icon" />}
            title={t("Feedback")}
            href={isCN ? "https://support.qq.com/product/670462" : "https://github.com/loggerhead/json4u/issues/new"}
            newWindow
          />
          <PopoverBtn title={t("statistics")} icon={<BarChartBig className="icon" />} content={<StatisticsPopover />} />
          {/* can't connect to supabase in China, so disable the function temporarily */}
          {!isCN && <AccountButton avatarClassName="w-6 h-6" />}
          <Button
            className="my-1.5"
            icon={fixSideNav ? <ArrowRightFromLine className="icon" /> : <ArrowLeftToLine className="icon" />}
            title={t(fixSideNav ? "Expand" : "Collapse")}
            onClick={() => {
              setFixSideNav(!fixSideNav);
              setSideNavExpanded(fixSideNav);
            }}
          />
        </ul>
      </nav>
    </div>
  );
}
