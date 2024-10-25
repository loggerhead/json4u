import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

export interface LoadingIconProps {
  loading?: boolean;
  className?: string;
}

const LoadingIcon = ({ loading = true, className }: LoadingIconProps) => (
  <LoaderCircle className={cn("animate-spin mr-2", className, !loading && "hidden")} />
);
export default LoadingIcon;
