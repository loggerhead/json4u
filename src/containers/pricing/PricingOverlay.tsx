"use client";

import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTrigger } from "@/components/ui/dialog";
import { useStatusStore } from "@/stores/statusStore";
import { useShallow } from "zustand/react/shallow";
import Pricing from "./Pricing";

export default function PricingOverlay() {
  const { open, setOpen } = useStatusStore(
    useShallow((state) => ({
      open: state.showPricingOverlay,
      setOpen: state.setShowPricingOverlay,
    })),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger />
      <DialogPortal>
        <DialogOverlay className="bg-black/0" />
        <DialogContent className="min-w-fit">
          {/* TODO: display usage limitation */}
          <Pricing hideTitle />
          <DialogClose />
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
