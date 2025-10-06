import { useEffect } from "react";
import { useStatusStore } from "@/stores/statusStore";
import { useShallow } from "zustand/shallow";

export function useObserveResize(leftPanelId: string, rightPanelId: string) {
  const { setLeftPanelWidth, setRightPanelWidth } = useStatusStore(
    useShallow((state) => ({
      setLeftPanelWidth: state.setLeftPanelWidth,
      setRightPanelWidth: state.setRightPanelWidth,
    })),
  );

  useEffect(() => {
    const leftPanel = document.getElementById(leftPanelId)!;
    const rightPanel = document.getElementById(rightPanelId)!;
    setLeftPanelWidth(leftPanel.offsetWidth);
    setRightPanelWidth(rightPanel.offsetWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target.id === leftPanelId) {
          setLeftPanelWidth(entry.contentRect.width);
        } else if (entry.target.id === rightPanelId) {
          setRightPanelWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(leftPanel);
    resizeObserver.observe(rightPanel);
  }, []);
}
