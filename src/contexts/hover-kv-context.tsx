import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";

interface HoverKvStateType {
  type: "key" | "value";
  text: string;
  position: { x: number; y: number };
  maxWidth: number;
}

interface HoverKvContextType {
  state: HoverKvStateType | null;
  setState: Dispatch<SetStateAction<HoverKvStateType | null>>;
}

const HoverKvContext = createContext<HoverKvContextType | null>(null);

export const HoverKvProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [state, setState] = useState<HoverKvStateType | null>(null);
  return <HoverKvContext.Provider value={{ state, setState }}>{children}</HoverKvContext.Provider>;
};

export const useHoverKv = () => {
  const context = useContext(HoverKvContext);

  if (!context) {
    throw new Error("useHoverKv must be used within a HoverKvProvider");
  }

  return context;
};
