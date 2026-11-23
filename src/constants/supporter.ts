import { SupporterProductId, GiftId } from "@/types/supporter.types";

// Play Console one-time products (permanent ids). The unlock is acknowledged and kept;
// gifts are consumed so they can be bought again.
export const SUPPORTER_UNLOCK_ID: SupporterProductId = "supporter_unlock";
export const GIFT_IDS: GiftId[] = ["gift_small", "gift_medium", "gift_large"];
export const SUPPORTER_PRODUCT_IDS: SupporterProductId[] = [SUPPORTER_UNLOCK_ID, ...GIFT_IDS];

// Play Billing runs inside the Play Store app. If it doesn't answer by then, treat Play as
// unavailable instead of waiting — the ads gate waits on the first entitlement check.
export const PLAY_CONNECT_TIMEOUT_MS = 8000;
