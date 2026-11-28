import {
  BillingError,
  BillingProduct,
  BillingPurchase,
  ProductsResult,
  PurchasesResult,
  StartPurchaseResult,
} from "@/types/billing.types";
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

// Google Play Billing for any one-time product — the only file that imports expo-iap.
// Never throws — returns results or { error } like feedbackService.

// Play Billing runs inside the Play Store app. If it doesn't answer by then, treat Play as
// unavailable instead of waiting — the ads gate waits on the first entitlement check.
const PLAY_CONNECT_TIMEOUT_MS = 8000;

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
  ErrorCode.QueryProduct, // also wraps a disconnected Play service (responseCode -1)
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
      console.warn("⚠️ [billingService] Play Billing did not connect");
      connection = null;
    }
    return connected;
  } catch (err) {
    console.warn("⚠️ [billingService] Play Billing connection failed:", err);
    connection = null;
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

// ------------------------------------------------------------
// Product details with Play's localized prices
// ------------------------------------------------------------
export async function getProducts(ids: string[]): Promise<ProductsResult> {
  if (!(await connectPlay())) {
    return { error: "unavailable" };
  }

  try {
    const result = ((await fetchProducts({ skus: ids, type: "in-app" })) ?? []) as Product[];
    const products: BillingProduct[] = result
      .filter((p) => !("productStatusAndroid" in p) || (p.productStatusAndroid ?? "ok") === "ok")
      .map((p) => ({ id: p.id, displayPrice: p.displayPrice }));

    // Play sells none of them here (e.g. a country without paid content) — same as unreachable
    if (products.length === 0) {
      return { error: "unavailable" };
    }
    return { products };
  } catch (err) {
    return { error: toBillingError("fetch products", err) };
  }
}

// ------------------------------------------------------------
// Open Play's purchase sheet — the outcome arrives through the purchase listeners
// ------------------------------------------------------------
export async function startPurchase(id: string): Promise<StartPurchaseResult> {
  if (!(await connectPlay())) {
    return { error: "unavailable" };
  }

  try {
    await requestPurchase({ request: { google: { skus: [id] } }, type: "in-app" });
    return { ok: true };
  } catch (err) {
    return { error: toBillingError("start purchase", err) };
  }
}

// ------------------------------------------------------------
// Everything Play holds for this Google account: non-consumables, unconsumed items, pending payments
// ------------------------------------------------------------
export async function getOwnedPurchases(): Promise<PurchasesResult> {
  if (!(await connectPlay())) {
    return { error: "unavailable" };
  }

  try {
    return { purchases: await getAvailablePurchases() };
  } catch (err) {
    return { error: toBillingError("query purchases", err) };
  }
}

// ------------------------------------------------------------
// Acknowledge (non-consumable) or consume. Play refunds anything unfinished after 3 days,
// so false here is retried by the caller's next sync.
// ------------------------------------------------------------
export async function finishPurchase(purchase: BillingPurchase, isConsumable: boolean): Promise<boolean> {
  try {
    await finishTransaction({ purchase, isConsumable });
    return true;
  } catch (err) {
    toBillingError("finish purchase", err);
    return false;
  }
}

// ------------------------------------------------------------
// App-wide purchase events (also fire when a pending payment clears). Returns the unsubscribe.
// ------------------------------------------------------------
export function addPurchaseListeners(
  onPurchase: (purchase: BillingPurchase) => void,
  onError: (error: BillingError) => void,
): () => void {
  const updated = purchaseUpdatedListener(onPurchase);
  const failed = purchaseErrorListener((err) => onError(toBillingError("purchase", err)));

  return () => {
    updated.remove();
    failed.remove();
  };
}

// Map expo-iap's error codes; only unexpected failures reach Sentry
function toBillingError(action: string, err: unknown): BillingError {
  const code = (err as { code?: string } | null)?.code;

  if (code === ErrorCode.UserCancelled) {
    return "cancelled";
  }
  if (code === ErrorCode.AlreadyOwned) {
    return "owned";
  }
  if (code && UNAVAILABLE_CODES.includes(code)) {
    console.warn(`⚠️ [billingService] Play unavailable (${action}):`, code);
    connection = null;
    return "unavailable";
  }

  console.error(`❌ [billingService] Failed to ${action}:`, err);
  Sentry.captureException(err);
  return "failed";
}
