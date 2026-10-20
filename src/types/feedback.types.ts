// Feedback types
import { Language } from "@/types/language.types";

// Question and choice ids — sent to the server as-is, shown in the admin as-is
export type FeedbackQuestionId = "rating" | "most_used" | "improve" | "donation_interest" | "message";

export type FeedbackMostUsedId =
  | "prayer_times"
  | "notifications"
  | "tracker"
  | "qibla"
  | "quran_read"
  | "quran_audio"
  | "guides"
  | "tesbih"
  | "calendar"
  | "quotes";

export type FeedbackImproveId =
  | "design"
  | "speed"
  | "prayer_times"
  | "notifications"
  | "quran"
  | "translations"
  | "ads"
  | "features"
  | "other";

export type FeedbackDonationId = "yes" | "maybe" | "no";

// { most_used: ["prayer_times", "qibla"], donation_interest: "maybe" } — stable English ids, never translated text
export type FeedbackAnswers = Record<string, string | string[]>;

export interface FeedbackInput {
  rating?: number;           // 1–5
  answers?: FeedbackAnswers;
  message?: string;          // max 2000 chars
  language: Language;
}

export type FeedbackError = "offline" | "rateLimited" | "server";

export type FeedbackResult = { ok: true } | { error: FeedbackError };
