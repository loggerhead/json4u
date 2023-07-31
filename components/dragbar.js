"use client";
import { useRef, useCallback } from "react";

export default function Dragbar({ containerRef, className }) {
  const classes = `relative grow cursor-col-resize select-none hover:bg-gray-200 w-2 mx-px ${className}`;
  const isMouseDown = useRef(false);
  const prevX = useRef(0);

  // https://melkornemesis.medium.com/handling-javascript-mouseup-event-outside-element-b0a34090bb56
  const handleMouseDown = useCallback((event) => {
    // 阻止默认行为的发生
    event.preventDefault();
    isMouseDown.current = true;
    // 记录点击时的位置
    prevX.current = event.clientX;
  }, []);

  if (typeof window !== "undefined") {
    document.addEventListener("mouseup", (event) => {
      if (isMouseDown.current) {
        event.preventDefault();
        isMouseDown.current = false;
      }
    });

    document.addEventListener("mousemove", (event) => {
      if (isMouseDown.current) {
        event.preventDefault();
        // 根据相对位置计算需要改变多少宽度
        const width = containerRef.current.offsetWidth;
        const dx = event.clientX - prevX.current;
        const x = width + dx;
        prevX.current = event.clientX;
        containerRef.current.style.flexBasis = `${x}px`;
      }
    });
  }

  return <div className={classes} onMouseDown={handleMouseDown}></div>;
}
