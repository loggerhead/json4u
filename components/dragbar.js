"use client";
import {useCallback, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";
import {leftWidthSelector} from "@/lib/store";
import {setLeftWidth} from "@/reducers";
import {maxLeftWidth} from "@/reducers/settingsSlice";

function hideElements(side) {
  for (const el of document.getElementsByClassName(`${side}-el`)) {
    el.classList.add("hidden");
  }
}

function showElements(side) {
  for (const el of document.getElementsByClassName(`${side}-el`)) {
    el.classList.remove("hidden");
  }
}

export default function Dragbar({leftContainerRef}) {
  const dispatch = useDispatch();
  const oldLeftWidth = useSelector(leftWidthSelector);
  const extraClass = (oldLeftWidth === 0 || oldLeftWidth === 100 ? "bg-gray-300" : "");

  const isMouseDown = useRef(false);
  const prevX = useRef(0);
  // 左侧最小宽度（px）
  const minWidth = useRef(0);
  // 左侧最大宽度（px）
  const maxWidth = useRef(9999);
  // 左侧宽度（百分比）
  const newWidth = useRef(maxLeftWidth);

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

        // 松开鼠标点击时，如果需要隐藏一侧，则改变左侧宽度
        if (newWidth.current === 100) {
          leftContainerRef.current.style.flexBasis = "100%";
        } else if (newWidth.current === 0) {
          leftContainerRef.current.style.flexBasis = "0";
        }

        dispatch(setLeftWidth(newWidth.current));
      }
    });

    document.addEventListener("mousemove", (event) => {
      if (isMouseDown.current) {
        event.preventDefault();

        const dx = event.clientX - prevX.current;
        if (dx === 0) {
          return;
        }

        // 根据相对位置计算需要改变多少宽度
        const leftContainer = leftContainerRef.current;
        const parentWidth = leftContainer.parentNode.clientWidth;
        const oldWidth = leftContainer.offsetWidth;
        const x = oldWidth + dx;

        // 改变左侧宽度
        prevX.current = event.clientX;
        newWidth.current = x * 100 / parentWidth;
        newWidth.current = Math.min(Math.max(0, newWidth.current), 100);
        leftContainer.style.flexBasis = `${newWidth.current}%`;

        // 向右滑无变化时，隐藏右侧，记录左侧的最大宽度
        if (dx > 0 && leftContainer.offsetWidth <= oldWidth && leftContainer.offsetWidth < parentWidth) {
          maxWidth.current = oldWidth;
          hideElements("right");
          // 向左滑无变化时，隐藏左侧，记录左侧的最小宽度
        } else if (dx < 0 && leftContainer.offsetWidth >= oldWidth && leftContainer.offsetWidth > 0) {
          minWidth.current = oldWidth;
          hideElements("left");
        }

        if (dx > 0 && leftContainer.offsetWidth >= maxWidth.current) {
          newWidth.current = 100;
        } else if (dx < 0 && leftContainer.offsetWidth <= minWidth.current) {
          newWidth.current = 0;
        }

        if (dx > 0 && leftContainer.offsetWidth > minWidth.current) {
          showElements("left");
        }
        if (dx < 0 && leftContainer.offsetWidth < maxWidth.current) {
          showElements("right");
        }
      }
    });
  }

  return (
    <div className={`dragbar w-[10px] flex grow cursor-col-resize select-none hover:bg-gray-300 ${extraClass}`}
         onMouseDown={handleMouseDown}>
      <svg focusable="false" aria-hidden="true" viewBox="0 0 12 24">
        <path
          d="M6 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
      </svg>
    </div>
  );
}
