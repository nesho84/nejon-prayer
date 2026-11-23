import { PLAY_CONNECT_TIMEOUT_MS, SUPPORTER_PRODUCT_IDS } from "@/constants/supporter";
import {
  SupporterError,
  SupporterProduct,
  SupporterProductId,
  SupporterPurchase,
  ProductsResult,
  PurchasesResult,
  StartPurchaseResult,
} from "@/types/supporter.types";
import * as Sentry from "@sentry/react-native";
import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  Product,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from "expo-iap";

// The only file that imports expo-iap. Never throws — returns results or { error } like feedbackService.

// Play can't be reached right now — expected offline, never reported to Sentry
const UNAVAILABLE_CODES: string[] = [
  ErrorCode.NetworkError,
  ErrorCode.ServiceDisconnected,
  ErrorCode.ServiceError,
  ErrorCode.ServiceTimeout,
  ErrorCode.ConnectionClosed,
  ErrorCode.BillingUnavailable,
  ErrorCode.IapNotAvailable,
  ErrorCode.ItemUnavailable,
  ErrorCode.InitConnection,
  ErrorCode.NotPrepared,
  ErrorCode.RemoteError,
];

// One connection for the app's lifetime; cleared on failure so the next call retries
let connection: Promise<boolean> | null = null;

// ------------------------------------------------------------
// Connect to Play Billing (shared, retried after a failure)
// ------------------------------------------------------------
export function connectPlay(): Promise<boolean> {
  if (!connection) {
    connection = connect();
  }
  return connection;
}

async function connect(): Promise<boolean> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const timedOut = new Promise<boolean>((resolve) => {
      timeout = setTimeout(() => resolve(false), PLAY_CONNECT_TIMEOUT_MS);
    });
    const connected = await Promise.race([initConnection(), timedOut]);
    if (!connected) {
      console.warn("⚠️ [supporterService] Play Billing did not connect");
      connection = null;
    }
    return connected;
  } catch (err) {
    console.warn("⚠️ [supporterService] Play Billing connection failed:", err);
    connection = null;
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

// ------------------------------------------------------------
// Product details with Play's localized prices
// ------------------------------------------------------------
export async function fetchSupporterProducts(): Promise<ProductsResult> {
  if (!(await connectPlay())) {
    return { error: "unavailable" };
  }

  try {
    const result = ((await fetchProducts({ skus: SUPPORTER_PRODUCT_IDS, type: "in-app" })) ?? []) as Product[];
    const products: SupporterProduct[] = result
      .filter((p) => !("productStatusAndroid" in p) || (p.productStatusAndroid ?? "ok") === "ok")
      .map((p) => ({ id: p.id as SupporterProductId, displayPrice: p.displayPrice }));

    // Play sells none of them here (e.g. a country without paid content) — same as unreachable
    if (products.length === 0) {
      return { error: "unavailable" };
    }
    return { products };
  } catch (err) {
    return { error: toSupporterError("fetch products", err) };
  }
}

// ------------------------------------------------------------
// Open Play's purchase sheet — the outcome arrives through the purchase listeners
// ------------------------------------------------------------
export async function startPurchase(id: SupporterProductId): Promise<StartPurchaseResult> {
  if (!(await connectPlay())) {
    return { error: "unavailable" };
  }

  try {
    await requestPurchase({ request: { google: { skus: [id] } }, type: "in-app" });
    return { ok: true };
  } catch (err) {
    return { error: toSupporterError("start purchase", err) };
  }
}

// ------------------------------------------------------------
// Everything Play holds for this Google account: the unlock, unfinished gifts, pending payments
// ------------------------------------------------------------
export async function getOwnedPurchases(): Promise<PurchasesResult> {
  if (!(await connectPlay())) {
    return { error: "unavailable" };
  }

  try {
    return { purchases: await getAvailablePurchases() };
  } catch (err) {
    return { error: toSupporterError("query purchases", err) };
  }
}

// ------------------------------------------------------------
// Acknowledge the unlock / consume a gift. Play refunds anything unfinished after 3 days,
// so false here is retried by the next reconcile.
// ------------------------------------------------------------
export async function finishPurchase(purchase: SupporterPurchase, isConsumable: boolean): Promise<boolean> {
  try {
    await finishTransaction({ purchase, isConsumable });
    return true;
  } catch (err) {
    toSupporterError("finish purchase", err);
    return false;
  }
}

// ------------------------------------------------------------
// App-wide purchase events (also fire when a pending payment clears). Returns the unsubscribe.
// ------------------------------------------------------------
export function addPurchaseListeners(
  onPurchase: (purchase: SupporterPurchase) => void,
  onError: (error: SupporterError) => void,
): () => void {
  const updated = purchaseUpdatedListener(onPurchase);
  const failed = purchaseErrorListener((err) => onError(toSupporterError("purchase", err)));

  return () => {
    updated.remove();
    failed.remove();
  };
}

// Map expo-iap's error codes; only unexpected failures reach Sentry
function toSupporterError(action: string, err: unknown): SupporterError {
  const code = (err as { code?: string } | null)?.code;

  if (code === ErrorCode.UserCancelled) {
    return "cancelled";
  }
  if (code === ErrorCode.AlreadyOwned) {
    return "owned";
  }
  if (code && UNAVAILABLE_CODES.includes(code)) {
    console.warn(`⚠️ [supporterService] Play unavailable (${action}):`, code);
    connection = null;
    return "unavailable";
  }

  console.error(`❌ [supporterService] Failed to ${action}:`, err);
  Sentry.captureException(err);
  return "failed";
}
