// Store update types

// Answer of the Play / App Store check
export type StoreUpdateAnswer = "available" | "upToDate" | "offline";

// Saved result of the startup check — also a failed check or the 5 s timeout
export type StoreUpdateResult = StoreUpdateAnswer | "error" | "timeout";
