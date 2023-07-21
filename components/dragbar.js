"use client";
import { useRef, useCallback } from "react";

export default function Dragbar({ containerRef }) {
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

  return (
    <div
      className="relative border-solid border-8 border-[#c4c4c400] cursor-col-resize select-none"
      onMouseDown={handleMouseDown}
    ></div>
  );
}
