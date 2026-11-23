// Supporter types
import type { Purchase } from "expo-iap";

// Play Console one-time product ids — permanent, must match the Console exactly
export type GiftId = "gift_small" | "gift_medium" | "gift_large";
export type SupporterProductId = "supporter_unlock" | GiftId;

// Play's purchase object, passed back unchanged to finish it
export type SupporterPurchase = Purchase;

// What the UI needs from a Play product — Play already formats the price in the user's currency
export interface SupporterProduct {
  id: SupporterProductId;
  displayPrice: string;
}

// unavailable: Play can't be reached, or sells nothing here · owned: the unlock is already bought
export type SupporterError = "unavailable" | "cancelled" | "owned" | "failed";

export type ProductsResult = { products: SupporterProduct[] } | { error: SupporterError };
export type PurchasesResult = { purchases: SupporterPurchase[] } | { error: SupporterError };
export type StartPurchaseResult = { ok: true } | { error: SupporterError };
