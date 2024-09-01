import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size, className }: LogoProps) {
  return (
    <img
      src="/icon.svg"
      width={size}
      height={size}
      className={cn("max-w-full max-h-full", className)}
      alt="JSON For You logo"
    />
  );
}
