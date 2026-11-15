// How scenario-based features really trigger — shown under their ⓘ
export const UPDATE_MODAL_HINT =
  "Auto (release builds only): checked once on every app start. Android asks Google Play (In-App Updates), " +
  "which only works when the app was installed from Play; iOS isn't set up yet. A newer store version → this modal " +
  "on every start until updated (\"Later\" isn't remembered). OTA updates download and reload silently — no modal. " +
  "Also opens from Settings → \"Check for update\" when one is found. Here it just opens.";
export const UPDATE_LAUNCH_HINT =
  "When ON, the \"Update available\" modal opens on the next app start, like a real store update would. " +
  "Stays ON across restarts until you turn it off (or debug mode is turned off).";
export const UP_TO_DATE_HINT =
  "Shows the green line under Settings → \"Check for update\" without a real check, until the app restarts. " +
  "Real: shown after a manual check finds no newer store version.";
export const CHECK_FAILED_HINT =
  "Shows the red line under Settings → \"Check for update\" without a real check, until the app restarts. " +
  "Real: shown when a manual check runs offline, or Play can't answer (e.g. the app wasn't installed from Play).";
export const NO_PRAYER_TIMES_HINT =
  "Real: Home shows the placeholder (explorable Home + retry strip) instead of the prayer list when there are " +
  "no prayer times — no location saved yet, or nothing could be loaded and nothing is saved " +
  "(e.g. offline on the first start). Without prayer times no notifications get scheduled. " +
  "Here: only Home changes.";
export const OUTDATED_HINT =
  "Real: shown on Home and Settings when the saved prayer times are from last year and this year's " +
  "download failed (e.g. offline after New Year) — the app keeps using last year's times. " +
  "Clears after the next successful download.";
export const LOCATION_CHANGED_HINT =
  "Real: on app start and on every return to the app (at most every 15 min) a quick location check runs. " +
  "50 km or more from the saved location → warning on Home and Settings. Clears when you update the location " +
  "in Settings, or when a later check is back under 50 km.";
export const PRAYER_CELEBRATION_HINT =
  "Auto: on Home only, when your tap marks the last of today's 5 prayers. Once a day — but if Isha is the last one " +
  "marked, it shows again. Never from the Timings modal or the notification's \"Prayed\" button. " +
  "(The 3rd prayer marked in a day asks for Rate App instead.) Here: a random message, tracking untouched.";
export const KHATAM_HINT =
  "Auto: in Khatam mode only, when you tap \"Complete Khatam\" at the end of Surah 114. " +
  "Adds 1 to the khatam count and clears the khatam bookmark; Share or OK then closes the reading screen. " +
  "Reading mode never shows it. Here: preview only — count and bookmark untouched.";
export const HOLIDAY_CARD_HINT =
  "Real: on Home, the next of Ramadan, Laylat al-Qadr and the two Eids appears 1–7 days before it " +
  "(7 for Ramadan and the Eids, 3 for Laylat al-Qadr) — not on the day itself. " +
  "Here: a fake Ramadan start in 3 days.";

// How the three auto modals work — shown under their ⓘ
export const RATE_APP_HINT =
  "First show (Android only): the first time a 3rd prayer gets marked in one day (Home or Timings), " +
  "or Quran reading scrolls past ayah 20 — can already happen on day one.\n" +
  "\"Later\" → asks again 7 days later, at the next such moment.\n" +
  "Never again: \"Open Store\", \"Already rated\", or after 3 shows.\n" +
  "Waits while Feedback was shown in the last 14 days, or another modal is open.\n" +
  "From About: always opens; only \"Open Store\" / \"Already rated\" are recorded.\n" +
  "Here: counts like a real show and skips the waits — when blocked, you get a Reset.";
export const FEEDBACK_HINT =
  "First show: on an app start at least 14 days after onboarding, once the app has been started 10 times.\n" +
  "\"Maybe later\" or close → asks again 30 days later, on an app start.\n" +
  "Never again: sent, \"Don't ask again\", or after 3 shows.\n" +
  "Waits while Rate App was shown in the last 14 days, or another modal is open.\n" +
  "From About: always opens at the questions; only sending is recorded.\n" +
  "Here: counts like a real show and skips the waits — when blocked, you get a Reset.";
export const NOTIF_REMINDER_HINT =
  "First show: on an app start 3+ days after the app first saw notifications turned off.\n" +
  "\"Not now\" or \"Enable\" → asks again 7 days later, then 14 days later (on an app start).\n" +
  "Never again: after 3 shows — starts over once notifications are allowed and later turned off again.\n" +
  "Waits while another modal is open.\n" +
  "Here: counts like a real show and skips the waits — when blocked, you get a Reset.";
