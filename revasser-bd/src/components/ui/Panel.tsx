"use client";

import { useEffect, useRef } from "react";

export function Panel({ open, onClose, side, label, children }: {
  open: boolean; onClose: () => void; side: "left" | "right" | "top" | "center"; label: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`panel panel-${side}`}
      // Closing one panel to open another fires this late, so only react while this one should be open.
      onClose={() => open && onClose()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </dialog>
  );
}
