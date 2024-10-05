import { ControlButton } from "@xyflow/react";
import { Mouse, Touchpad } from "lucide-react";

interface MouseButtonProps {
  isTouchPad: boolean;
  setIsTouchPad: (v: boolean) => void;
}

export default function MouseButton({ isTouchPad, setIsTouchPad }: MouseButtonProps) {
  return (
    <ControlButton title="switch between mouse and touchpad mode" onClick={() => setIsTouchPad(!isTouchPad)}>
      {isTouchPad ? <Touchpad style={{ fill: "none" }} /> : <Mouse style={{ fill: "none" }} />}
    </ControlButton>
  );
}
