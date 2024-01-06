"use client";
import {useCallback, useRef} from "react";
import {setLeftWidth} from "@/reducers";
import {useDispatch} from "react-redux";

export default function Dragbar({containerRef, className}) {
  const classes = `dragbar w-[10px] relative flex grow cursor-col-resize select-none hover:bg-gray-200 fill-gray-500 ${className}`;
  const dispatch = useDispatch();
  const isMouseDown = useRef(false);
  const prevX = useRef(0);
  let timerID;

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
        const leftContainer = containerRef.current;
        const container = leftContainer.parentNode;

        const width = leftContainer.offsetWidth;
        const dx = event.clientX - prevX.current;
        const x = width + dx;
        const leftWidth = x * 100 / container.clientWidth;
        prevX.current = event.clientX;

        leftContainer.style.flexBasis = `${x}px`;

        clearTimeout(timerID);
        timerID = setTimeout(() => {
          dispatch(setLeftWidth(leftWidth));
        }, 50);
      }
    });
  }

  return (
    <div className={classes} onMouseDown={handleMouseDown}>
      <svg focusable="false" aria-hidden="true" viewBox="0 0 12 24">
        <path
          d="M6 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
      </svg>
    </div>
  );
}
