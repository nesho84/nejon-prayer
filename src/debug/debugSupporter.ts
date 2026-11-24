import { SupporterProductId } from "@/constants/supporter";
import { SupporterPreview } from "@/debug/debugStore";

export interface SupporterView {
  isSupporter: boolean;
  supporterSince: number | null;
  unlockPending: boolean;
  giftPending: boolean;
  lastGiftAt: number | null;
  lastKnownPrices: Partial<Record<SupporterProductId, string>>;
  playStatus: "loading" | "ready" | "unavailable";
  productsFresh: boolean;
  purchasingId: SupporterProductId | null;
}

// ------------------------------------------------------------
// Supporter previews — fake values for the support screens only; the real store, ads and Play are untouched
// ------------------------------------------------------------

const PREVIEW_DATE = new Date(2026, 10, 23).getTime();

const PREVIEW_BASE: SupporterView = {
  isSupporter: false,
  supporterSince: null,
  unlockPending: false,
  giftPending: false,
  lastGiftAt: null,
  lastKnownPrices: { supporter_unlock: "€ 6,99", gift_small: "€ 2,39", gift_medium: "€ 5,99", gift_large: "€ 11,99" },
  playStatus: "ready",
  productsFresh: true,
  purchasingId: null,
};

const PREVIEWS: Record<Exclude<SupporterPreview, "idle">, Partial<SupporterView>> = {
  canBuy: {},
  pending: { unlockPending: true },
  unreachable: { playStatus: "unavailable", productsFresh: false },
  giftPending: { giftPending: true },
  supporter: { isSupporter: true, supporterSince: PREVIEW_DATE },
};

// ------------------------------------------------------------
// The real values, or the preview's when one is set
// ------------------------------------------------------------
export function getSupporterPreview(real: SupporterView, preview: SupporterPreview, forceGift: boolean): SupporterView {
  const view = preview === "idle" ? real : { ...PREVIEW_BASE, ...PREVIEWS[preview] };
  if (forceGift) {
    return { ...view, lastGiftAt: PREVIEW_DATE };
  }
  return view;
}
