import { FEEDBACK_URL } from "@/constants/links";
import { FeedbackInput, FeedbackResult } from "@/types/feedback.types";
import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";
import { Platform } from "react-native";

// The server emails the developer before answering (~1–2 s), so allow plenty of headroom
const REQUEST_TIMEOUT_MS = 15000;

// ------------------------------------------------------------
// Send the questionnaire answers to the feedback API.
// Never throws — returns { ok } or { error } for the UI.
// ------------------------------------------------------------
export async function sendFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    // No internet — don't wait for the request to time out
    const { isConnected } = await NetInfo.fetch();
    if (!isConnected) {
      return { error: "offline" };
    }

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Answers + app version, language and platform — nothing else (see privacy policy)
    const response = await fetch(FEEDBACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: input.rating,
        answers: input.answers,
        message: input.message,
        appVersion: Constants.expoConfig?.version,
        language: input.language,
        platform: Platform.OS,
        // Honeypot — must stay empty, or the server silently drops the submission
        website: "",
      }),
      signal: controller.signal,
    });

    // 201 — saved (and emailed to the developer)
    if (response.status === 201) {
      console.log("✅ [feedbackService] Feedback sent");
      return { ok: true };
    }
    // 429 — more than 5 submissions per IP in 24 h
    if (response.status === 429) {
      return { error: "rateLimited" };
    }

    // Anything else (400, 404, 413, 415, 422, 500) — log the server's message for debugging
    console.warn(`⚠️ [feedbackService] Unexpected status ${response.status}:`, await response.text());
    return { error: "server" };

  } catch (err) {
    // Timeout, or the connection dropped mid-request
    console.warn("❌ [feedbackService] Failed to send feedback:", err);
    return { error: "server" };
  } finally {
    clearTimeout(timeout);
  }
}
