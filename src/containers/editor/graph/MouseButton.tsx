import { ControlButton } from "@xyflow/react";
import { Mouse, Touchpad } from "lucide-react";

interface MouseButtonProps {
  isTouchPad: boolean;
  setIsTouchPad: (v: boolean) => void;
}

export default function MouseButton({ isTouchPad, setIsTouchPad }: MouseButtonProps) {
  return (
    <ControlButton onClick={() => setIsTouchPad(!isTouchPad)}>
      {isTouchPad ? <Touchpad style={{ fill: "none" }} /> : <Mouse style={{ fill: "none" }} />}
    </ControlButton>
  );
}
