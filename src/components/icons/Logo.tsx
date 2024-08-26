import { cn } from "@/lib/utils";

export default function Logo({ className }: { className?: string }) {
  return <img src="/icon.svg" className={cn("max-w-full max-h-full", className)} alt="JSON For You logo" />;
}
