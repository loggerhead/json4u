import { TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ViewMode } from "@/lib/db/config";
import { Table2, Text, Waypoints } from "lucide-react";
import { useTranslations } from "next-intl";

const viewMode2Icon = {
  [ViewMode.Text]: Text,
  [ViewMode.Graph]: Waypoints,
  [ViewMode.Table]: Table2,
};

export function TabIcon({ viewMode, className }: { viewMode: ViewMode; className: string }) {
  const t = useTranslations();
  const Icon = viewMode2Icon[viewMode];

  return (
    <TabsTrigger title={t(viewMode)} value={viewMode} className="text-zinc-600 dark:text-zinc-200">
      <Icon className={className} />
    </TabsTrigger>
  );
}

export function TabView({ viewMode, children }: { viewMode: ViewMode; children: React.ReactNode }) {
  // `data-[state=inactive]` used for fix https://github.com/radix-ui/primitives/issues/1155#issuecomment-2041571341
  return (
    <TabsContent value={viewMode} className="relative w-full h-full m-0 data-[state=inactive]:hidden" forceMount>
      {children}
    </TabsContent>
  );
}
