import { BillingProductId, GiftId } from "@/types/billing.types";

// Play Console one-time products (permanent ids). The unlock is acknowledged and kept;
// gifts are consumed so they can be bought again.
export const SUPPORTER_UNLOCK_ID: BillingProductId = "supporter_unlock";
export const GIFT_IDS: GiftId[] = ["gift_small", "gift_medium", "gift_large"];
export const BILLING_PRODUCT_IDS: BillingProductId[] = [SUPPORTER_UNLOCK_ID, ...GIFT_IDS];

// Play Billing runs inside the Play Store app. If it doesn't answer by then, treat Play as
// unavailable instead of waiting — the ads gate waits on the first entitlement check.
export const BILLING_CONNECT_TIMEOUT_MS = 8000;
