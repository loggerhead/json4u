"use client";

import { Nav } from "@/components/Nav";
import Logo from "@/components/icons/Logo";
import ExportPopover from "@/components/sidenav/ExportPopover";
import ImportPopover from "@/components/sidenav/ImportPopover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";
import { useSideNavConfig } from "@/stores";
import {
  ArrowDownNarrowWide,
  Braces,
  ChevronLeft,
  ChevronRight,
  Download,
  FileUp,
  MessageCircleQuestion,
  SquareStack,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function SideNav() {
  const t = useTranslations();
  const { sideNavCollapsed, setSideNavCollapsed, enableAutoFormat, enableAutoSort, enableNestParse, setParseOptions } =
    useSideNavConfig();

  return (
    <div className={cn("flex flex-col", sideNavCollapsed && "transition-all duration-300 ease-in-out")}>
      <div className={cn("flex items-center mt-3 mb-2 mx-3", sideNavCollapsed && "justify-center")}>
        <Link prefetch={false} href="/" className="flex items-center gap-2 pointer text-btn hover:text-accent-foreground">
          <Logo className="w-[16px] h-[16px]"/>
          <span className={cn("text-xs text-nowrap", sideNavCollapsed && "hidden")}>{"JSON4U"}</span>
        </Link>
        {/* TODO: display account icon */}
        {/* <Avatar className={"w-[30px] h-[30px]"}>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>J</AvatarFallback>
        </Avatar> */}
      </div>
      <Nav
        isCollapsed={sideNavCollapsed}
        btns={[
          { title: t("Import"), icon: FileUp, popoverContent: <ImportPopover /> },
          { title: t("Export"), icon: Download, popoverContent: <ExportPopover /> },
          // TODO: support share
          // { title: t("Share"), icon: Share2, popoverContent: <SharePopover /> },
        ]}
      />
      <Separator />
      <Nav
        isCollapsed={sideNavCollapsed}
        btns={[
          {
            title: t("Auto Format"),
            icon: Braces,
            isPressed: enableAutoFormat,
            onPressedChange: (pressed) => setParseOptions({ format: pressed }),
          },
          {
            title: t("Auto Sort"),
            icon: ArrowDownNarrowWide,
            isPressed: enableAutoSort,
            onPressedChange: (pressed) => setParseOptions({ sort: pressed ? "asc" : undefined }),
          },
          {
            title: t("Nested Parse"),
            icon: SquareStack,
            isPressed: enableNestParse,
            onPressedChange: (pressed) => setParseOptions({ nest: pressed }),
          },
        ]}
      />
      <Nav
        isCollapsed={sideNavCollapsed}
        className={"mt-auto"}
        btns={[
          {
            title: t("Feedback"),
            icon: MessageCircleQuestion,
            onClick: () => window.open("https://github.com/loggerhead/json4u/issues/new", "_blank"),
          },
          // TODO: consider to allow user custom some configs
          // { title: t("Settings"), icon: Settings },
          {
            title: t(sideNavCollapsed ? "Expand" : "Collapse"),
            icon: sideNavCollapsed ? ChevronRight : ChevronLeft,
            onClick: () => setSideNavCollapsed(!sideNavCollapsed),
          },
        ]}
      />
    </div>
  );
}
