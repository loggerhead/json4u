import { useEffect } from "react";
import { setupGlobalGraphStyle } from "@/lib/graph/style";
import { setupGlobalTableStyle } from "@/lib/table/style";
import { px2num } from "@/lib/utils";
import { type MyWorker } from "@/lib/worker/worker";
import { useConfigFromCookies } from "@/stores/hook";
import { useStatusStore } from "@/stores/statusStore";
import { useUserStore } from "@/stores/userStore";
import { wrap } from "comlink";
import { useShallow } from "zustand/shallow";

const measureStr = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default function InitialSetup() {
  useInitial();

  return (
    <div id="width-measure" className="absolute invisible">
      <div className="graph-node graph-kv">
        <div className="graph-k">
          <span>{measureStr}</span>
        </div>
        <div className="graph-v" />
      </div>
      <div className="tbl-row">
        <div className="tbl-cell border">
          <span>{measureStr}</span>
        </div>
        <div className="tbl-header" />
      </div>
    </div>
  );
}

function useInitial() {
  const cc = useConfigFromCookies();
  const { user, updateActiveOrder } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      updateActiveOrder: state.updateActiveOrder,
    })),
  );

  useEffect(() => {
    updateActiveOrder(user);
    useStatusStore.setState({ _hasHydrated: true, ...cc });

    // initial worker
    window.rawWorker = new Worker(new URL("@/lib/worker/worker.ts", import.meta.url));
    window.worker = wrap<MyWorker>(window.rawWorker);
    window.addEventListener("beforeunload", () => {
      console.l("worker is terminated.");
      window.rawWorker?.terminate();
    });

    // measure graph style
    const el = document.getElementById("width-measure")!;
    const { maxWidth: maxValueWidth } = getComputedStyle(el.querySelector(".graph-v")!);

    {
      const span = el.querySelector(".graph-node span") as HTMLSpanElement;
      const { lineHeight } = getComputedStyle(span);
      const { borderWidth } = getComputedStyle(el);
      const { paddingLeft, paddingRight } = getComputedStyle(el.querySelector(".graph-kv")!);
      const { marginRight, maxWidth: maxKeyWidth } = getComputedStyle(el.querySelector(".graph-k")!);

      const measured = {
        fontWidth: Math.ceil(span.offsetWidth / measureStr.length),
        kvHeight: px2num(lineHeight),
        padding: px2num(paddingLeft) + px2num(paddingRight),
        borderWidth: px2num(borderWidth),
        kvGap: px2num(marginRight),
        maxKeyWidth: px2num(maxKeyWidth),
        maxValueWidth: px2num(maxValueWidth),
      };
      setupGlobalGraphStyle(measured);
      window.worker.setupGlobalGraphStyle(measured);
      console.l("finished measuring graph view style:", measured);
    }

    // measure table style
    {
      const span = el.querySelector(".tbl-row span") as HTMLSpanElement;
      const { height: rowHeight, paddingLeft, paddingRight } = getComputedStyle(el.querySelector(".tbl-cell")!);
      const measured = {
        fontWidth: Math.ceil(span.offsetWidth / measureStr.length),
        rowHeight: px2num(rowHeight),
        maxCellWidth: px2num(maxValueWidth),
        padding: px2num(paddingLeft) + px2num(paddingRight),
        scrollbarWidth: getScrollbarWidth(),
      };

      setupGlobalTableStyle(measured);
      window.worker.setupGlobalTableStyle(measured);
      console.l("finished measuring table view style:", measured);
    }
  }, []);
}

// Calculate the scrollbar width
function getScrollbarWidth() {
  const outer = document.createElement("div");
  outer.style.width = "100px";
  outer.style.height = "100px";
  outer.style.overflow = "scroll";
  document.body.appendChild(outer);

  const inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  document.body.removeChild(outer);
  return scrollbarWidth;
}
