import { cn } from "@/lib/utils";

interface IconLabelProps extends LabelProps {
  icon: React.ReactNode;
}

export default function IconLabel({ icon, ...props }: IconLabelProps) {
  return (
    <>
      <span className="absolute left-0 top-0 flex rounded-sm h-6 w-6 items-center justify-center">{icon}</span>
      <Label {...props} />
    </>
  );
}

interface LabelProps {
  title: string;
  notOnSideNav?: boolean;
}

export function Label({ title, notOnSideNav }: LabelProps) {
  return (
    <span
      className={cn(
        "w-24 text-left text-xs text-nowrap text-ellipsis overflow-hidden absolute left-6 group-data-[expanded=true]:left-9 opacity-0 group-data-[expanded=true]:opacity-100 transition-all",
        notOnSideNav && "sr-only",
      )}
    >
      {title}
    </span>
  );
}
