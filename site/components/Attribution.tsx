"use client";

import { useEffect } from "react";
import { stampSession } from "@/lib/track";

/** Stamps first-landing/referrer once per session (eng review D15). Renders nothing. */
export function Attribution() {
  useEffect(() => {
    stampSession();
  }, []);
  return null;
}
