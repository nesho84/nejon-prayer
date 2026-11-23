// Play Console one-time product ids — permanent, must match the Console exactly
export type GiftId = "gift_small" | "gift_medium" | "gift_large";
export type SupporterProductId = "supporter_unlock" | GiftId;

// The unlock is acknowledged and kept; gifts are consumed so they can be bought again.
export const SUPPORTER_UNLOCK_ID: SupporterProductId = "supporter_unlock";
export const GIFT_IDS: GiftId[] = ["gift_small", "gift_medium", "gift_large"];
export const SUPPORTER_PRODUCT_IDS: SupporterProductId[] = [SUPPORTER_UNLOCK_ID, ...GIFT_IDS];
