// Billing types
import type { Purchase } from "expo-iap";

// Play Console one-time product ids — permanent, must match the Console exactly
export type GiftId = "gift_small" | "gift_medium" | "gift_large";
export type BillingProductId = "supporter_unlock" | GiftId;

// Play's purchase object, passed back unchanged to finish it
export type BillingPurchase = Purchase;

// What the UI needs from a Play product — Play already formats the price in the user's currency
export interface BillingProduct {
  id: BillingProductId;
  displayPrice: string;
}

// unavailable: Play can't be reached, or sells nothing here · owned: the unlock is already bought
export type BillingError = "unavailable" | "cancelled" | "owned" | "failed";

export type ProductsResult = { products: BillingProduct[] } | { error: BillingError };
export type PurchasesResult = { purchases: BillingPurchase[] } | { error: BillingError };
export type StartPurchaseResult = { ok: true } | { error: BillingError };
