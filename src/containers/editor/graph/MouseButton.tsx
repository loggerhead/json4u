import { useEffect } from "react";
import { detectOS } from "@/lib/utils";
import { useStatusStore } from "@/stores/statusStore";
import { ControlButton } from "@xyflow/react";
import { Mouse, Touchpad } from "lucide-react";
import { useShallow } from "zustand/shallow";

export default function MouseButton() {
  const { isTouchpad, setIsTouchpad } = useStatusStore(
    useShallow((state) => ({
      isTouchpad: state.isTouchpad,
      setIsTouchpad: state.setIsTouchpad,
    })),
  );

  useEffect(() => {
    if (isTouchpad === undefined) {
      setIsTouchpad(detectOS() === "Mac");
    }
  }, []);

  return (
    <ControlButton title="switch between mouse and touchpad mode" onClick={() => setIsTouchpad(!isTouchpad)}>
      {isTouchpad ? <Touchpad style={{ fill: "none" }} /> : <Mouse style={{ fill: "none" }} />}
    </ControlButton>
  );
}
