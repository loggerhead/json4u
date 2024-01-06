import {useDispatch, useSelector} from "react-redux";
import {getLeftWidthByPrev, isRightEditorHidden, leftWidthSelector, prevLeftWidthSelector} from "@/lib/store";
import {setLeftWidth, setPrevLeftWidth} from "@/reducers";

export default function Toggler() {
  const leftWidth = useSelector(leftWidthSelector);
  const prevLeftWidth = useSelector(prevLeftWidthSelector);
  const dispatch = useDispatch();
  const needHide = !isRightEditorHidden(leftWidth);

  return (
    <a href="#" onClick={() => {
      if (needHide) {
        dispatch(setPrevLeftWidth(leftWidth));
        dispatch(setLeftWidth(100));
      } else {
        dispatch(setLeftWidth(getLeftWidthByPrev(prevLeftWidth)));
      }
    }}>
      {needHide ? "⇥" : "⇤"}
    </a>
  );
}
