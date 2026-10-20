import { PAYPAL_DONATE_URL } from "@/constants/links";
import { globalStyles, HIT_SLOP_8 } from "@/constants/styles";
import { FEEDBACK_TR, FeedbackTranslations } from "@/constants/translations/feedback.tr";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useRateAppStore } from "@/store/rateAppStore";
import { useThemeStore } from "@/store/themeStore";
import { FeedbackAnswers, FeedbackDonationId, FeedbackError, FeedbackImproveId, FeedbackMostUsedId } from "@/types/feedback.types";
import { openExternalUrl } from "@/utils/system";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type FeedbackQuestion =
  | { id: "rating"; type: "rating" }
  | { id: "most_used"; type: "multi"; options: FeedbackMostUsedId[] }
  | { id: "improve"; type: "multi"; options: FeedbackImproveId[] }
  | { id: "donation_interest"; type: "single"; options: FeedbackDonationId[] }
  | { id: "message"; type: "text" };

type FeedbackStep = "intro" | FeedbackQuestion["id"] | "thanks" | "error";

const DAY_MS = 24 * 60 * 60 * 1000;
// Wait after onboarding before the first prompt — enough use to have an opinion
const FIRST_PROMPT_AFTER_DAYS = 14;
const MIN_LAUNCHES = 10;
// Wait after "Maybe later", or after closing the questionnaire without sending
const SNOOZE_DAYS = 30;
// Every open counts — the prompt stops for good at the limit
export const MAX_SHOWS = 3;
// Minimum gap between this modal and the "Rate the App" modal (checked on both sides)
export const PROMPT_GAP_DAYS = 14;
// Server limit for the free text
const MESSAGE_MAX_LENGTH = 2000;
const STAR_COUNT = 5;

// Questions in order — ids are sent as-is, labels live in feedback.tr.ts
const FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  { id: "rating", type: "rating" },
  {
    id: "most_used",
    type: "multi",
    options: ["prayer_times", "notifications", "tracker", "qibla", "quran_read", "quran_audio", "guides", "tesbih", "calendar", "quotes"],
  },
  {
    id: "improve",
    type: "multi",
    options: ["design", "speed", "prayer_times", "notifications", "quran", "translations", "ads", "features", "other"],
  },
  { id: "donation_interest", type: "single", options: ["yes", "maybe", "no"] },
  { id: "message", type: "text" },
];

// ------------------------------------------------------------
// Choice labels for a choice question
// ------------------------------------------------------------
function getChoiceLabels(id: "most_used" | "improve" | "donation_interest", feedbackTr: FeedbackTranslations): Record<string, string> {
  if (id === "most_used") {
    return feedbackTr.mostUsed;
  }
  if (id === "improve") {
    return feedbackTr.improve;
  }
  return feedbackTr.donation;
}

// ------------------------------------------------------------
// Open the feedback modal on its intro step
// ------------------------------------------------------------
export function openFeedbackModal() {
  const { feedbackFirstSeenAt, feedbackLaunchCount, feedbackShownCount, feedbackSnoozedUntil, feedbackDone, setFeedbackFirstSeenAt } = useFeedbackStore.getState();
  const rateAppShownAt = useRateAppStore.getState().rateAppShownAt;
  const now = Date.now();

  // Sent, or tapped "Don't ask again"
  if (feedbackDone) {
    return;
  }
  // Shown 3 times — stopped for good
  if (feedbackShownCount >= MAX_SHOWS) {
    return;
  }
  // First launch after onboarding — start the wait
  if (feedbackFirstSeenAt === null) {
    setFeedbackFirstSeenAt(now);
    return;
  }
  // Not used long enough to have an opinion yet
  if (now < feedbackFirstSeenAt + FIRST_PROMPT_AFTER_DAYS * DAY_MS || feedbackLaunchCount < MIN_LAUNCHES) {
    return;
  }
  // Tapped "Maybe later", or closed the questionnaire
  if (feedbackSnoozedUntil && now < feedbackSnoozedUntil) {
    return;
  }
  // "Rate the App" shown recently — keep the two apart
  if (rateAppShownAt && now < rateAppShownAt + PROMPT_GAP_DAYS * DAY_MS) {
    return;
  }
  // Another modal is open (e.g. "Update available") — yield, try next launch
  if (useModalStore.getState().visible) {
    return;
  }

  showFeedbackModal();
}

// ------------------------------------------------------------
// Show the feedback modal — no checks (the About row opens it at "rating",
// the Debug Panel at "intro"). Every open counts as shown.
// ------------------------------------------------------------
export function showFeedbackModal(startStep: "intro" | "rating" = "intro") {
  const { feedbackShownCount, setFeedbackShownCount, setFeedbackShownAt } = useFeedbackStore.getState();

  setFeedbackShownCount(feedbackShownCount + 1);
  setFeedbackShownAt(Date.now());

  useModalStore.getState().show({
    type: "fullscreen",
    animationType: "fade",
    // Only the buttons close it — so every close records a choice
    dismissable: false,
    component: <FeedbackForm startStep={startStep} />,
  });
}

// ------------------------------------------------------------
// Modal content — intro → questions → thank-you (or error), all in the same modal
// ------------------------------------------------------------
function FeedbackForm({ startStep }: { startStep: FeedbackStep }) {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const language = useLanguageStore((state) => state.language);
  const feedbackTr = FEEDBACK_TR[language] ?? FEEDBACK_TR.en;
  const { hide } = useModalStore.getState();

  // Local state
  const [step, setStep] = useState<FeedbackStep>(startStep);
  const [rating, setRating] = useState<number | null>(null);
  const [answers, setAnswers] = useState<FeedbackAnswers>({});
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<FeedbackError | null>(null);

  const questionIndex = FEEDBACK_QUESTIONS.findIndex((q) => q.id === step);
  const isLastQuestion = questionIndex === FEEDBACK_QUESTIONS.length - 1;
  // Arabic reads right-to-left — align the text, the layout stays as in the rest of the app
  const textDirection = language === "ar" ? styles.textRtl : styles.textLtr;

  const errorMessages: Record<FeedbackError, string> = {
    offline: feedbackTr.errorOffline,
    rateLimited: feedbackTr.errorRateLimited,
    server: feedbackTr.errorServer,
  };

  // ------------------------------------------------------------
  // Close without sending — "Maybe later" and the close icon (not an opt-out)
  // ------------------------------------------------------------
  const handleLater = (action: string) => {
    useFeedbackStore.getState().setFeedbackSnoozedUntil(Date.now() + SNOOZE_DAYS * DAY_MS);
    hide(action);
  };

  // ------------------------------------------------------------
  // "Don't ask again"
  // ------------------------------------------------------------
  const handleNever = () => {
    useFeedbackStore.getState().setFeedbackDone(true);
    hide("never");
  };

  // ------------------------------------------------------------
  // Go to a question by its position
  // ------------------------------------------------------------
  const goToQuestion = (index: number) => {
    setStep(FEEDBACK_QUESTIONS[index].id);
  };

  // ------------------------------------------------------------
  // Select / unselect a choice — single choice replaces, multi choice toggles
  // ------------------------------------------------------------
  const toggleChoice = (questionId: string, choice: string, isMulti: boolean) => {
    const next = { ...answers };
    const current = next[questionId];

    if (!isMulti) {
      if (current === choice) {
        delete next[questionId];
      } else {
        next[questionId] = choice;
      }
      setAnswers(next);
      return;
    }

    const selected = Array.isArray(current) ? current : [];
    const updated = selected.includes(choice) ? selected.filter((c) => c !== choice) : [...selected, choice];
    if (updated.length > 0) {
      next[questionId] = updated;
    } else {
      delete next[questionId];
    }
    setAnswers(next);
  };

  // ------------------------------------------------------------
  // Send (also "Retry" on the error step) — rating is always set (its step
  // can't be skipped), so the server's "at least one field" rule always holds
  // ------------------------------------------------------------
  const handleSubmit = async (text: string) => {
    setIsSending(true);

    const result = await useFeedbackStore.getState().submitFeedback({
      rating: rating ?? undefined,
      answers: Object.keys(answers).length > 0 ? answers : undefined,
      message: text.trim() || undefined,
    });

    setIsSending(false);
    if ("error" in result) {
      setError(result.error);
      setStep("error");
      return;
    }
    setStep("thanks");
  };

  // ------------------------------------------------------------
  // Next / Send
  // ------------------------------------------------------------
  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit(message);
      return;
    }
    goToQuestion(questionIndex + 1);
  };

  // ------------------------------------------------------------
  // Intro step — same layout as the "Rate the App" modal
  // ------------------------------------------------------------
  if (step === "intro") {
    return (
      <View style={styles.container}>
        {/* Icon + text */}
        <View style={styles.content}>
          <MaterialDesignIcons name="message-draw" size={96} color={theme.primary} style={styles.heroIcon} />
          <Text style={[globalStyles.bannerTitle, styles.title, { color: theme.text }]}>{feedbackTr.promptTitle}</Text>
          <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{feedbackTr.promptMessage}</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary + "20", borderWidth: 1, borderColor: theme.primary + "40" }]}
            activeOpacity={0.8}
            onPress={() => goToQuestion(0)}
          >
            <Text style={[styles.buttonText, { color: theme.primary }]}>{feedbackTr.promptStart}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.overlay }]}
            activeOpacity={0.8}
            onPress={() => handleLater("later")}
          >
            <Text style={[styles.buttonText, { color: theme.text2 }]}>{feedbackTr.promptLater}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={handleNever}
          >
            <Text style={[styles.buttonText, { color: theme.textMuted }]}>{feedbackTr.promptNever}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ------------------------------------------------------------
  // Thank-you step
  // ------------------------------------------------------------
  if (step === "thanks") {
    return (
      <View style={styles.container}>
        {/* Icon + text + support link */}
        <View style={styles.content}>
          <MaterialDesignIcons name="check-circle-outline" size={96} color={theme.success} style={styles.heroIcon} />
          <Text style={[globalStyles.bannerTitle, styles.title, { color: theme.text }]}>{feedbackTr.thanksTitle}</Text>
          <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{feedbackTr.thanksMessage}</Text>
          <TouchableOpacity
            style={[styles.supportButton, { backgroundColor: theme.danger + "15", borderColor: theme.danger + "40" }]}
            onPress={() => openExternalUrl(PAYPAL_DONATE_URL)}
            activeOpacity={0.7}
          >
            <MaterialDesignIcons name="heart-outline" size={18} color={theme.danger} />
            <Text style={[styles.supportText, { color: theme.danger }]}>{feedbackTr.supportApp}</Text>
            <MaterialDesignIcons name="open-in-new" size={14} color={theme.danger} />
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.overlay }]}
            activeOpacity={0.8}
            onPress={() => hide("close")}
          >
            <Ionicons name="close" size={18} color={theme.text2} />
            <Text style={[styles.buttonText, { color: theme.text2 }]}>{feedbackTr.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ------------------------------------------------------------
  // Error step — the send failed; answers are kept for "Retry"
  // ------------------------------------------------------------
  if (step === "error" && error) {
    return (
      <View style={styles.container}>
        {/* Icon + text */}
        <View style={styles.content}>
          <MaterialDesignIcons name={error === "offline" ? "wifi-off" : "alert-circle-outline"} size={96} color={theme.danger} style={styles.heroIcon} />
          <Text style={[globalStyles.bannerTitle, styles.title, { color: theme.text }]}>{tr.labels.error}</Text>
          <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{errorMessages[error]}</Text>
        </View>

        {/* Buttons — no "Retry" for the rate limit, it only works again tomorrow */}
        <View style={styles.buttons}>
          {error !== "rateLimited" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary + "20", borderWidth: 1, borderColor: theme.primary + "40" }]}
              activeOpacity={0.8}
              onPress={() => handleSubmit(message)}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color={theme.primary} />
                  <Text style={[styles.buttonText, { color: theme.primary }]}>{tr.buttons.retry}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.overlay }]}
            activeOpacity={0.8}
            onPress={() => handleLater("close")}
            disabled={isSending}
          >
            <Ionicons name="close" size={18} color={theme.text2} />
            <Text style={[styles.buttonText, { color: theme.text2 }]}>{feedbackTr.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ------------------------------------------------------------
  // Question steps
  // ------------------------------------------------------------
  const question = FEEDBACK_QUESTIONS[questionIndex];
  const hint = question.type === "multi" ? feedbackTr.multiHint : question.type === "rating" ? null : feedbackTr.optionalHint;
  const nextLabel = isLastQuestion ? feedbackTr.submit : feedbackTr.next;
  const nextIcon = isLastQuestion ? "send-outline" : "chevron-forward";

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Close — top right, like the fullscreen modal's own close icon */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: theme.card }]}
          onPress={() => handleLater("close")}
          disabled={isSending}
          hitSlop={HIT_SLOP_8}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={theme.text2} />
        </TouchableOpacity>
      </View>

      {/* Question + answer — vertically centered, scrolls when taller than the screen */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.questionContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={[styles.questionTitle, textDirection, { color: theme.text }]}>{feedbackTr.questions[question.id]}</Text>
        {hint && (
          <Text style={[styles.questionHint, textDirection, { color: theme.textMuted }]}>{hint}</Text>
        )}

        {/* Rating — 5 stars */}
        {question.type === "rating" && (
          <View style={styles.starsRow}>
            {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((value) => (
              <TouchableOpacity key={value} testID={`star-${value}`} onPress={() => setRating(value)} activeOpacity={0.6}>
                <Ionicons name={rating !== null && value <= rating ? "star" : "star-outline"} size={40} color={theme.gold} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Choices — chips */}
        {(question.type === "multi" || question.type === "single") && (
          <View style={styles.chips}>
            {question.options.map((choice) => {
              const value = answers[question.id];
              const isSelected = question.type === "multi" ? Array.isArray(value) && value.includes(choice) : value === choice;
              return (
                <TouchableOpacity
                  key={choice}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.card, borderColor: "transparent" },
                    isSelected && { backgroundColor: theme.primary + "20", borderColor: theme.primary },
                  ]}
                  onPress={() => toggleChoice(question.id, choice, question.type === "multi")}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.chipText, { color: isSelected ? theme.primary : theme.text2 }]}>
                    {getChoiceLabels(question.id, feedbackTr)[choice]}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Free text */}
        {question.type === "text" && (
          <TextInput
            style={[styles.messageInput, textDirection, { color: theme.text, backgroundColor: theme.card }]}
            value={message}
            onChangeText={setMessage}
            placeholder={feedbackTr.messagePlaceholder}
            placeholderTextColor={theme.placeholder}
            maxLength={MESSAGE_MAX_LENGTH}
            editable={!isSending}
            multiline
            textAlignVertical="top"
          />
        )}
      </ScrollView>

      {/* Back / step / Next — every question but the rating is optional, so Next also skips */}
      <View style={styles.navRow}>
        {questionIndex > 0 ? (
          <TouchableOpacity
            style={[styles.button, styles.navButton, { backgroundColor: theme.overlay }]}
            activeOpacity={0.8}
            onPress={() => goToQuestion(questionIndex - 1)}
            disabled={isSending}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text2} />
            <Text style={[styles.buttonText, { color: theme.text2 }]} numberOfLines={1}>{feedbackTr.back}</Text>
          </TouchableOpacity>
        ) : (
          // Keeps the step and Next in place on the first question
          <View style={styles.navButton} />
        )}
        <Text style={[styles.stepText, { color: theme.placeholder }]} numberOfLines={1}>
          {tr.labels.stepLabel} {questionIndex + 1} / {FEEDBACK_QUESTIONS.length}
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            styles.navButton,
            { backgroundColor: theme.primary + "20", borderWidth: 1, borderColor: theme.primary + "40" },
            (question.type === "rating" && rating === null) && styles.buttonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleNext}
          disabled={isSending || (question.type === "rating" && rating === null)}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <>
              <Text style={[styles.buttonText, { color: theme.primary }]} numberOfLines={1}>{nextLabel}</Text>
              <Ionicons name={nextIcon} size={18} color={theme.primary} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Intro + thank-you (same as the "Rate the App" modal)
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 6,
  },
  heroIcon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  supportText: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttons: {
    gap: 10,
    marginBottom: 8,
  },
  button: {
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Close
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  closeButton: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },

  // Question
  questionContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 16,
    gap: 6,
  },
  questionTitle: {
    fontSize: 19,
    fontWeight: "700",
  },
  questionHint: {
    fontSize: 14,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  chipText: {
    fontSize: 15,
  },
  messageInput: {
    minHeight: 160,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  textLtr: {
    textAlign: "left",
    writingDirection: "ltr",
  },
  textRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },

  // Back / step / Next
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  navButton: {
    flex: 1,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
