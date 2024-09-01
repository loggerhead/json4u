import { MouseEvent } from "react";
import { isPeeled, peelTableId, rootMarker } from "@/lib/idgen";
import { genKeyAndTypeList } from "@/lib/table";
import { isApproximatelyEqual } from "@/lib/utils";
import { useTreeStore, useTree, TooltipPosition } from "@/stores/treeStore";
import { Side, sides } from "@/stores/treeStore";
import { useShallow } from "zustand/react/shallow";
import { intervalToHide, intervalToShow, resetTimeout, globalStyle, TimeoutIdMap, tooltipId } from "./Tooltip";

export function useOnShowTooltip(timeoutIdMap: TimeoutIdMap) {
  const tree = useTree();
  const { hideTooltip, setTooltip } = useTreeStore(
    useShallow((state) => ({
      hideTooltip: state.hideTooltip,
      setTooltip: state.setTooltip,
    })),
  );

  const delayedShow = (target: Element, event: MouseEvent) => {
    timeoutIdMap.current["show"] = setTimeout(() => {
      setTooltip({
        targetId: target.id,
        path: genKeyAndTypeList(tree, peelTableId(target.id)),
        computePosition: (table, target, tooltip) => computeTooltipPosition(table, target, tooltip, event),
      });
    }, intervalToShow);
  };

  const hide = () => {
    resetTimeout(timeoutIdMap, "show");
    timeoutIdMap.current["hide"] = setTimeout(hideTooltip, intervalToHide);
  };

  // NOTICE: don't use useCallback, otherwise the event handler will not be updated
  // https://javascript.info/mousemove-mouseover-mouseout-mouseenter-mouseleave#event-delegation
  const onMouseOver = (event: MouseEvent) => {
    const el = event.target as Element;

    if (el && isTableCell(el)) {
      resetTimeout(timeoutIdMap);
      delayedShow(el, event);
    }
  };

  const onMouseOut = (event: MouseEvent) => {
    const el = event.relatedTarget as Element | null;

    // this event handler will affect the tooltip onMouseEnter event,
    // so we need check if the relatedTarget is the tooltip itself in here
    if (el && (isTableCell(el) || isHoverTooltip(el))) {
      return;
    }

    hide();
  };

  return { onMouseOver, onMouseOut };
}

function computeTooltipPosition(
  table: HTMLElement | null,
  target: HTMLElement | null,
  tooltip: HTMLElement | null,
  event: MouseEvent,
): TooltipPosition | undefined {
  if (!(table && target && tooltip)) {
    console.log("skip compute table tooltip", tooltip, table, target);
    return undefined;
  }

  // compute position of tooltip
  const mouse = Position.fromEvent(event);
  const [p0, a0] = Position.fromRect(tooltip.getBoundingClientRect());
  const [p1, a1] = Position.fromRect(table.getBoundingClientRect());
  const [p2, a2] = Position.fromRect(target.getBoundingClientRect());

  a1.y -= globalStyle.paddingBottom;
  const position = computePosition(globalStyle.margin, mouse, a0, a1, a2, p1, p2);

  if (!position || Number.isNaN(position.left) || Number.isNaN(position.top)) {
    console.error("invalid position of table tooltip", mouse, a0, a1, a2, p0, p1, p2, tooltip, table, target);
    return undefined;
  }

  return position;
}

function computePosition(
  gap: number, // gap between tooltip and target element
  mouse: Position, // mouse position in the viewport
  a0: Position, // width and height of tooltip
  a1: Position, // width and height of table
  a2: Position, // width and height of target element
  p1: Position, // position of table
  p2: Position, // position of target element
): TooltipPosition {
  const { x: w0, y: h0 } = a0;
  const { x: w2, y: h2 } = a2;

  // ensure that the tooltip is horizontally centered on the horizontal axis following the mouse.
  const dpTop = new Position(mouse.x - p2.x - w0 / 2, -(gap + h0));
  const dpBottom = new Position(dpTop.x, gap + h2);
  // ensure that the tooltip is vertically centered on the vertical axis following the mouse.
  const dpLeft = new Position(-(gap + w0), mouse.y - p2.y - h0 / 2);
  const dpRight = new Position(gap + w2, dpLeft.y);
  // compute the position of the tooltip relative to the table
  const pp = [dpTop, dpBottom, dpLeft, dpRight].map((dp) => dp.add(p2).sub(p1));

  let i = 0;
  let maxArea = 0;

  for (let j = 0; j < pp.length; j++) {
    const area = Position.intersectionArea(pp[j], a0, new Position(0, 0), a1);

    if (area > maxArea) {
      maxArea = area;
      i = j;
    }

    if (isApproximatelyEqual(area, a0.x * a0.y, 0.1)) {
      break;
    }
  }

  return {
    left: pp[i].x,
    top: pp[i].y,
    side: sides[i],
  };
}

function isHoverTooltip(el: Element): boolean {
  return el.id === tooltipId || !!document.getElementById(tooltipId)?.contains(el);
}

function isTableCell(el: Element): boolean {
  const nodeId = peelTableId(el.id);
  return nodeId.startsWith(rootMarker) && isPeeled(el.id, nodeId);
}

class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static fromEvent(event: MouseEvent): Position {
    return new Position(event.clientX, event.clientY);
  }

  static fromRect(r: DOMRect): [Position, Position] {
    const p = new Position(r.left, r.top);
    const a = new Position(r.width, r.height);
    return [p, a];
  }

  static intersectionArea(p1: Position, a1: Position, p2: Position, a2: Position): number {
    const e1 = p1.add(a1);
    const e2 = p2.add(a2);
    const width = Math.min(e1.x, e2.x) - Math.max(p1.x, p2.x);
    const height = Math.min(e1.y, e2.y) - Math.max(p1.y, p2.y);
    return width > 0 && height > 0 ? width * height : 0;
  }

  add(b: Position): Position {
    return new Position(this.x + b.x, this.y + b.y);
  }

  sub(b: Position): Position {
    return new Position(this.x - b.x, this.y - b.y);
  }

  mul(n: number): Position {
    return new Position(this.x * n, this.y * n);
  }
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  interface PositionWithSide {
    x: number;
    y: number;
    side: Side;
  }

  function expectEq(
    gap: number,
    a0: Position,
    a1: Position,
    a2: Position,
    p1: Position,
    p2: Position,
    want: Partial<PositionWithSide>,
  ) {
    const mouse = p2.add(a2.mul(0.5));
    const got = computePosition(gap, mouse, a0, a1, a2, p1, p2);
    const p0 = p1.add(new Position(got.left, got.top));
    expect({ x: p0.x, y: p0.y, side: got.side }).toMatchObject(want);
  }

  describe("computePlace", () => {
    it("four sides", () => {
      function doExpectEq(targetX: number, targetY: number, want: PositionWithSide) {
        expectEq(
          10,
          new Position(100, 100),
          new Position(500, 500),
          new Position(50, 50),
          new Position(0, 0),
          new Position(targetX, targetY),
          want,
        );
      }

      doExpectEq(200, 200, { x: 175, y: 90, side: "top" });
      doExpectEq(200, 0, { x: 175, y: 60, side: "bottom" });
      doExpectEq(450, 200, { x: 340, y: 175, side: "left" });
      doExpectEq(0, 200, { x: 60, y: 175, side: "right" });
    });

    it("bad case", () => {
      expectEq(
        10,
        new Position(400, 200),
        new Position(1181, 751),
        new Position(81, 331),
        new Position(610, 43),
        new Position(652, 334),
        { side: "right" },
      );
    });
  });
}
