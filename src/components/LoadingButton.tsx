import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";

export interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(({ loading, children, ...props }, ref) => {
  return (
    <Button ref={ref} disabled={loading} {...props}>
      <LoaderCircle className={cn("animate-spin mr-2", !loading && "hidden")} />
      {children}
    </Button>
  );
});
LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
