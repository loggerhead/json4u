"use client";

import Logo from "@/components/icons/Logo";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/navigation";
import { useStatusStore } from "@/stores/statusStore";
import {
  ArrowDownNarrowWide,
  Braces,
  Download,
  FileUp,
  MessageCircleQuestion,
  Settings,
  Share2,
  SquareStack,
  BarChartBig,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import AccountButton from "./AccountButton";
import Button from "./Button";
import ExportPopover from "./ExportPopover";
import ImportPopover from "./ImportPopover";
import LinkButton from "./LinkButton";
import PopoverBtn, { popoverBtnClass } from "./PopoverButton";
import SharePopover from "./SharePopover";
import StatisticsPopover from "./StatisticsPopover";
import Toggle from "./Toggle";

export default function SideNav() {
  const t = useTranslations();
  const { sideNavExpanded, setSideNavExpanded, enableAutoFormat, enableAutoSort, enableNestParse, setParseOptions } =
    useStatusStore(
      useShallow((state) => ({
        sideNavExpanded: !!state.sideNavExpanded,
        setSideNavExpanded: state.setSideNavExpanded,
        enableAutoFormat: !!state.parseOptions.format,
        enableAutoSort: !!state.parseOptions.sort,
        enableNestParse: !!state.parseOptions.nest,
        setParseOptions: state.setParseOptions,
      })),
    );

  return (
    <div
      className="flex flex-col h-full w-8"
      onMouseEnter={(event) => {
        if ((event.target as HTMLElement).closest(`.${popoverBtnClass}`)) {
          return;
        }
        setSideNavExpanded(true);
      }}
      onMouseLeave={() => setSideNavExpanded(false)}
    >
      <nav
        className="group z-50 h-full py-1.5 w-8 data-[expanded=true]:w-32 box-content border-r border-default data-[expanded=true]:shadow-xl transition-width duration-200 hide-scrollbar flex flex-col justify-between overflow-y-auto bg-background"
        data-expanded={sideNavExpanded}
      >
        <ul className="relative flex flex-col justify-start px-1 gap-y-1">
          <Link prefetch={false} href="/" className="flex items-center pointer mt-1 mb-2">
            <Logo className="w-6 h-6" />
          </Link>
          <PopoverBtn title={t("Import")} icon={<FileUp className="icon" />} content={<ImportPopover />} />
          <PopoverBtn title={t("Export")} icon={<Download className="icon" />} content={<ExportPopover />} />
          {/* TODO: support share */}
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
            isPressed={enableAutoFormat}
            onPressedChange={(pressed) => setParseOptions({ format: pressed })}
          />
          <Toggle
            icon={<SquareStack className="icon" />}
            title={t("Nested Parse")}
            isPressed={enableNestParse}
            onPressedChange={(pressed) => setParseOptions({ nest: pressed })}
          />
          <Toggle
            icon={<ArrowDownNarrowWide className="icon" />}
            title={t("Auto Sort")}
            isPressed={enableAutoSort}
            onPressedChange={(pressed) => setParseOptions({ sort: pressed ? "asc" : undefined })}
          />
        </ul>
        <ul className="flex flex-col px-1 gap-y-2">
          <LinkButton
            icon={<MessageCircleQuestion className="icon" />}
            title={t("Feedback")}
            href="https://github.com/loggerhead/json4u/issues/new"
            newWindow
          />
          <PopoverBtn title={t("statistics")} icon={<BarChartBig className="icon" />} content={<StatisticsPopover />} />
          {/* TODO: consider to allow user custom some configs */}
          <Button className="hidden" icon={<Settings className="icon" />} title={t("Settings")} onClick={() => null} />
          <AccountButton avatarClassName="w-6 h-6" buttonClassName="my-1.5" />
        </ul>
      </nav>
    </div>
  );
}
