// Billing types — Google Play Billing, independent of what is sold
import type { Purchase } from "expo-iap";

// Play's purchase object, passed back unchanged to finish it
export type BillingPurchase = Purchase;

// What the UI needs from a Play product — Play already formats the price in the user's currency
export interface BillingProduct {
  id: string;
  displayPrice: string;
}

// unavailable: Play can't be reached, or sells nothing here · owned: already bought (non-consumable)
export type BillingError = "unavailable" | "cancelled" | "owned" | "failed";

export type ProductsResult = { products: BillingProduct[] } | { error: BillingError };
export type PurchasesResult = { purchases: BillingPurchase[] } | { error: BillingError };
export type StartPurchaseResult = { ok: true } | { error: BillingError };
