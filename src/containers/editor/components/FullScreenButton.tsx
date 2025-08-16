import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Expand, Shrink } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FullScreenButton() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setShow(true);
  }, []);

  return show ? <ClientFullScreenButton /> : null;
}

function ClientFullScreenButton() {
  const t = useTranslations();
  const [fullscreen, setFullscreen] = useState(false);
  const Icon = fullscreen ? Shrink : Expand;

  const el = document.documentElement;
  const requestFullscreenFn =
    el?.requestFullscreen ||
    (el as any).webkitRequestFullscreen ||
    (el as any).mozRequestFullScreen ||
    (el as any).msRequestFullscreen;
  const exitFullscreenFn =
    document.exitFullscreen ||
    (document as any).webkitExitFullscreen ||
    (document as any).mozCancelFullScreen ||
    (document as any).msExitFullscreen;

  if (!requestFullscreenFn || !exitFullscreenFn) {
    return null;
  }

  return (
    <Button
      title={t(fullscreen ? "shrink_screen" : "expand_screen")}
      className="px-2"
      variant="icon-outline"
      onClick={async () => {
        if (fullscreen) {
          await exitFullscreenFn.call(document);
          setFullscreen(false);
        } else {
          await requestFullscreenFn.call(el);
          setFullscreen(true);
        }
      }}
    >
      <Icon className="icon" />
    </Button>
  );
}
