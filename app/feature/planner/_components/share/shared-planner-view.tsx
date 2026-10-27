"use client";

import { SharedReader, type SharedReaderProps } from "./reader/shared-reader";

/** Published data remains unchanged; only the shared-page presentation differs. */
export function SharedPlannerView(props: SharedReaderProps) {
  return <SharedReader {...props} />;
}
