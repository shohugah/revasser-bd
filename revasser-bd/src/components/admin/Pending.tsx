"use client";

import { useLinkStatus } from "next/link";

/** Put inside a Link: shows a small spinner while the sheet is being read for the next screen. */
export function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <span role="status" aria-label="Loading" className="ml-2 inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null;
}
