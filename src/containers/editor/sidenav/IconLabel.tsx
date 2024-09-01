import { cn } from "@/lib/utils";

interface IconLabelProps {
  icon: React.ReactNode;
  title: string;
  notOnSideNav?: boolean;
}

export default function IconLabel({ icon, title, notOnSideNav }: IconLabelProps) {
  return (
    <>
      <span className="absolute left-0 top-0 flex rounded-sm h-6 w-6 items-center justify-center">{icon}</span>
      <span
        className={cn(
          "w-24 text-left text-xs text-nowrap text-ellipsis overflow-hidden absolute left-6 group-data-[expanded=true]:left-9 opacity-0 group-data-[expanded=true]:opacity-100 transition-all",
          notOnSideNav && "sr-only",
        )}
      >
        {title}
      </span>
    </>
  );
}
