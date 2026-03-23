# Ayahs Feature — Implementation Guide

## Overview

User taps a surah in QuranScreen → navigates to AyahsScreen → ayahs fetched
from API in the app language → rendered in a FlatList → last read position
saved to store → "Continue Reading" card shown in QuranScreen.

---

## Architecture

```
quranStore (existing — extended)
    ↓ adds
    - ayahs: Verse[]               → fetched from API, not persisted
    - isLoadingAyahs               → true during API fetch
    - ayahsError                   → error during fetch
    - lastReadSurahId              → persisted to MMKV
    - lastReadSurahName            → persisted to MMKV
    - lastReadAyahId               → persisted to MMKV
    - fetchAyahs(surahId)          → fetches for current app language
    - setLastRead(...)             → saves last read position
    - clearLastRead()              → user dismisses continue reading card

quranService (existing — extended)
    ↓ adds
    - Ayah type                    → type for API response
    - EDITIONS map                 → language code → alquran.cloud edition
    - fetchAyahsFromApi()          → fetch ayahs for surah + language

AyahsScreen
    → reads ayahs from quranStore
    → reads appLanguage from languageStore
    → getSurahById(surahId) for Arabic — reads from local JSON (no API)
    → fetchAyahs(surahId) for other languages — fetches from API
    → on ayah visible: setLastRead(...)
    → scrolls to lastReadAyahId if coming from "Continue Reading" card
    → selected ayah highlighted

QuranScreen
    → reads lastRead from quranStore
    → shows ContinueReadingCard if lastRead exists
    → card navigates to AyahsScreen with scrollToAyah param
    → user can dismiss card → clearLastRead()
```

---

## File Structure

```
app/
  (extras)/
    quran/
      quran.tsx           → QuranScreen (rename from current quran.tsx)
      ayahs.tsx           → AyahsScreen (new)

store/
  quranStore.ts           → existing — add ayahs state + actions + persist

services/
  quranService.ts         → existing — add Ayah type + EDITIONS + fetchAyahsFromApi()

components/
  AyahRow.tsx             → new — single ayah row
  ContinueReadingCard.tsx → new — card in QuranScreen
```

---

## File 1 — `services/quranService.ts` (additions only)

Add to existing file — do not touch existing code:

```ts
// ------------------------------------------------------------
// Ayah type — API response from alquran.cloud
// ------------------------------------------------------------
export interface Ayah {
    number: number;        // global ayah number (1–6236)
    numberInSurah: number; // ayah number within surah (1–N)
    text: string;          // text in the fetched language/edition
}

// ------------------------------------------------------------
// Ayah translation edition identifiers — alquran.cloud API
// Full list: https://api.alquran.cloud/v1/edition/language/{code}
// ------------------------------------------------------------

// Shqip (Albanian)
export const EDITION_SQ_AHMETI    = "sq.ahmeti";     // Sherif Ahmeti
export const EDITION_SQ_MEHDIU    = "sq.mehdiu";     // Feti Mehdiu
export const EDITION_SQ_NAHI      = "sq.nahi";       // Hasan Efendi Nahi

// English
export const EDITION_EN_SAHIH     = "en.sahih";      // Saheeh International
export const EDITION_EN_YUSUFALI  = "en.yusufali";   // Abdullah Yusuf Ali
export const EDITION_EN_PICKTHALL = "en.pickthall";  // Mohammed Marmaduke Pickthall
export const EDITION_EN_ASAD      = "en.asad";       // Muhammad Asad
export const EDITION_EN_HILALI    = "en.hilali";     // Al-Hilali & Muhsin Khan
export const EDITION_EN_ITANI     = "en.itani";      // Clear Qur'an — Talal Itani
export const EDITION_EN_MAUDUDI   = "en.maududi";    // Abul Ala Maududi

// Deutsch (German)
export const EDITION_DE_BUBENHEIM = "de.bubenheim";  // Bubenheim & Elyas
export const EDITION_DE_ABURIDA   = "de.aburida";    // Abu Rida Muhammad ibn Ahmad
export const EDITION_DE_KHOURY    = "de.khoury";     // Adel Theodor Khoury
export const EDITION_DE_ZAIDAN    = "de.zaidan";     // Amir Zaidan

// Turkish
export const EDITION_TR_DIYANET   = "tr.diyanet";    // Diyanet İşleri
export const EDITION_TR_VAKFI     = "tr.vakfi";      // Diyanet Vakfı
export const EDITION_TR_YAZIR     = "tr.yazir";      // Elmalılı Hamdi Yazır
export const EDITION_TR_BULAC     = "tr.bulac";      // Ali Bulaç
export const EDITION_TR_ATES      = "tr.ates";       // Süleyman Ateş
export const EDITION_TR_YILDIRIM  = "tr.yildirim";   // Suat Yıldırım

// ------------------------------------------------------------
// Default edition per app language
// Change the value to switch translator for that language
// ------------------------------------------------------------
const AYAH_EDITIONS: Record<string, string> = {
    en: EDITION_EN_SAHIH,
    de: EDITION_DE_BUBENHEIM,
    tr: EDITION_TR_DIYANET,
    sq: EDITION_SQ_NAHI,
};

// ------------------------------------------------------------
// Fetch ayahs for a surah from alquran.cloud
// Called from quranStore.fetchAyahs() for non-Arabic languages
// Arabic reads directly from local JSON via getSurahById()
// ------------------------------------------------------------
export async function fetchAyahsFromApi(surahId: number, language: string): Promise<Ayah[]> {
    const edition = AYAH_EDITIONS[language];

    if (!edition) {
        throw new Error(`No edition found for language: ${language}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(
            `https://api.alquran.cloud/v1/surah/${surahId}/${edition}`,
            { signal: controller.signal }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        return json.data.ayahs as Ayah[];
    } finally {
        clearTimeout(timeout);
    }
}
```

---

## File 2 — `store/quranStore.ts` (additions only)

Add to existing `QuranState` interface:

```ts
interface QuranState extends QuranData, QuranPlayerData {
    // ... existing actions unchanged ...

    // ─── Ayahs ────────────────────────────────────────────────────────────────
    ayahs: Ayah[];
    isLoadingAyahs: boolean;
    ayahsError: unknown;
    fetchAyahs: (surahId: number) => Promise<void>;

    // ─── Last read ────────────────────────────────────────────────────────────
    lastReadSurahId: number | null;
    lastReadSurahName: string | null;
    lastReadAyahId: number | null;
    setLastRead: (surahId: number, surahName: string, ayahId: number) => void;
    clearLastRead: () => void;
}
```

Add to initial state:

```ts
ayahs: [],
isLoadingAyahs: false,
ayahsError: null,
lastReadSurahId: null,
lastReadSurahName: null,
lastReadAyahId: null,
```

Add actions:

```ts
fetchAyahs: async (surahId) => {
    const { language } = useLanguageStore.getState();

    // Arabic — already in local JSON, use getSurahById()
    // AyahsScreen reads verses directly from getSurahById() for Arabic
    if (language === "ar") return;

    set({ isLoadingAyahs: true, ayahsError: null, ayahs: [] });
    try {
        const data = await fetchAyahsFromApi(surahId, language);
        set({ ayahs: data });
    } catch (err) {
        console.error("❌ Failed to fetch ayahs:", err);
        set({ ayahsError: err });
    } finally {
        set({ isLoadingAyahs: false });
    }
},

setLastRead: (surahId, surahName, ayahId) => set({
    lastReadSurahId: surahId,
    lastReadSurahName: surahName,
    lastReadAyahId: ayahId,
}),

clearLastRead: () => set({
    lastReadSurahId: null,
    lastReadSurahName: null,
    lastReadAyahId: null,
}),
```

Wrap store with `persist` and add `partialize` for last read only:

```ts
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "@/store/storage";

export const useQuranStore = create<QuranState>()(
    persist(
        (set, get) => ({
            // ... all existing + new state and actions
        }),
        {
            name: "quran-storage",
            storage: createJSONStorage(() => mmkvStorage),
            // Only last read persisted — everything else starts fresh
            partialize: (state) => ({
                lastReadSurahId: state.lastReadSurahId,
                lastReadSurahName: state.lastReadSurahName,
                lastReadAyahId: state.lastReadAyahId,
            }),
        }
    )
);
```

---

## File 3 — `app/(extras)/quran/ayahs.tsx` (AyahsScreen)

```tsx
const AYAH_ROW_HEIGHT = 80; // adjust based on your AyahRow design

export default function AyahsScreen() {
    const { surahId, surahName, scrollToAyah } = useLocalSearchParams();

    const theme          = useThemeStore((s) => s.theme);
    const tr             = useLanguageStore((s) => s.tr);
    const language       = useLanguageStore((s) => s.language);
    const ayahs          = useQuranStore((s) => s.ayahs);
    const isLoadingAyahs = useQuranStore((s) => s.isLoadingAyahs);
    const isQuranReady   = useQuranStore((s) => s.isQuranReady);
    const ayahsError     = useQuranStore((s) => s.ayahsError);
    const getSurahById   = useQuranStore((s) => s.getSurahById);
    const fetchAyahs     = useQuranStore((s) => s.fetchAyahs);
    const setLastRead    = useQuranStore((s) => s.setLastRead);

    const flatListRef = useRef<FlatList>(null);
    const [selectedAyah, setSelectedAyah] = useState<number | null>(
        scrollToAyah ? parseInt(scrollToAyah as string) : null
    );

    // Arabic verses always from local JSON
    const verses = getSurahById(parseInt(surahId as string))?.verses ?? [];

    // Translation mapped by verse id for O(1) lookup
    // Empty if Arabic app language — no translation needed
    // useMemo prevents rebuilding on every render — only rebuilds when ayahs changes
    const translationMap = useMemo(
        () => new Map(ayahs.map((a) => [a.numberInSurah, a.text])),
        [ayahs]
    );

    // ─── Fetch translation on mount (non-Arabic only) ─────────────────────────
    useEffect(() => {
        if (!isQuranReady || language === "ar") return;
        useQuranStore.getState().fetchAyahs(parseInt(surahId as string));
    }, [isQuranReady]);

    // ─── Scroll to last read ayah ─────────────────────────────────────────────
    useEffect(() => {
        if (!scrollToAyah || verses.length === 0) return;
        const index = verses.findIndex((v) => v.id === parseInt(scrollToAyah as string));
        if (index !== -1) {
            flatListRef.current?.scrollToIndex({ index, animated: true });
        }
    }, [verses]);

    // ─── Track last read on viewable ayah change ──────────────────────────────
    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (viewableItems.length === 0) return;
        const lastVisible = viewableItems[viewableItems.length - 1].item as Verse;
        setLastRead(
            parseInt(surahId as string),
            surahName as string,
            lastVisible.id
        );
    }, [surahId, surahName]);

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

    // ─── Render ayah row ──────────────────────────────────────────────────────
    const renderAyahItem = useCallback(({ item }: { item: Verse }) => (
        <AyahRow
            surahId={parseInt(surahId as string)}
            verse={item}
            translation={translationMap.get(item.id) ?? null}
            theme={theme}
            isSelected={selectedAyah === item.id}
            onPress={() => setSelectedAyah(item.id)}
        />
    ), [theme, selectedAyah, translationMap]);

    if (isLoadingAyahs) return <AppLoading text={tr.labels.loading} />;
    if (ayahsError) return (
        <AppError
            message={tr.labels.quranAyahsError}
            buttonText={tr.buttons.retry}
            onPress={() => fetchAyahs(parseInt(surahId as string))}
        />
    );

    return (
        <AppScreen>
            <FlatList
                ref={flatListRef}
                data={verses}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderAyahItem}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig.current}
                contentContainerStyle={styles.list}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={7}
                removeClippedSubviews={true}
                getItemLayout={(_, index) => ({
                    length: AYAH_ROW_HEIGHT,
                    offset: AYAH_ROW_HEIGHT * index,
                    index,
                })}
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    list: {
        paddingBottom: 24,
    },
});
```

---

## File 4 — `components/AyahRow.tsx`

Memoized for FlatList performance. Shows ayah number badge, Arabic text,
translation, share and bookmark icons. Divider between rows.

```tsx
import { Verse } from "@/services/quranService";
import { Ayah } from "@/services/quranService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AyahRowProps {
    surahId: number;
    verse: Verse;                  // Arabic — always from local JSON
    translation: string | null;    // User language — from API, null if Arabic
    theme: any;
    isSelected: boolean;
    onPress: () => void;
}

const AyahRow = React.memo(({
    surahId,
    verse,
    translation,
    theme,
    isSelected,
    onPress,
}: AyahRowProps) => {

    const handleShare = async () => {
        const message = translation
            ? `${verse.text}\n\n${translation}`
            : verse.text;
        await Share.share({ message });
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <View style={[
                styles.container,
                isSelected && { backgroundColor: theme.accentLight },
            ]}>

                {/* ── Top bar ───────────────────────────────────────── */}
                <View style={styles.topBar}>
                    {/* Ayah number badge — surahId:ayahNumber */}
                    <View style={[styles.badge, { backgroundColor: theme.accentLight, borderColor: theme.accent }]}>
                        <Text style={[styles.badgeText, { color: theme.accent }]}>
                            {surahId}:{verse.id}
                        </Text>
                    </View>

                    {/* Share + Bookmark */}
                    <View style={styles.icons}>
                        <TouchableOpacity onPress={handleShare} hitSlop={8}>
                            <Ionicons name="share-social-outline" size={20} color={theme.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {}} hitSlop={8}>
                            <Ionicons name="bookmark-outline" size={20} color={theme.accent} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Arabic text ───────────────────────────────────── */}
                <Text style={[styles.arabicText, { color: theme.accent }]}>
                    {verse.text}
                </Text>

                {/* ── Translation ───────────────────────────────────── */}
                {translation && (
                    <Text style={[styles.translationText, { color: theme.text }]}>
                        {translation}
                    </Text>
                )}

            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        </TouchableOpacity>
    );
});

export default AyahRow;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: "600",
    },
    icons: {
        flexDirection: "row",
        gap: 16,
    },
    arabicText: {
        fontSize: 26,
        lineHeight: 48,
        textAlign: "center",
        fontWeight: "400",
        marginBottom: 12,
    },
    translationText: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: "400",
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
});
```

---

## File 5 — `components/ContinueReadingCard.tsx`

Self-contained — reads from store directly, no props needed.

```tsx
import AppCard from "@/components/AppCard";
import { useQuranStore } from "@/store/quranStore";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ContinueReadingCard() {
    const theme              = useThemeStore((s) => s.theme);
    const tr                 = useLanguageStore((s) => s.tr);
    const lastReadSurahId    = useQuranStore((s) => s.lastReadSurahId);
    const lastReadSurahName  = useQuranStore((s) => s.lastReadSurahName);
    const lastReadAyahId     = useQuranStore((s) => s.lastReadAyahId);
    const clearLastRead      = useQuranStore((s) => s.clearLastRead);
    const router             = useRouter();

    if (!lastReadSurahId || !lastReadAyahId) return null;

    const handlePress = () => {
        router.push({
            pathname: "/(extras)/quran/ayahs",
            params: {
                surahId: lastReadSurahId,
                surahName: lastReadSurahName,
                scrollToAyah: lastReadAyahId,
            },
        });
    };

    return (
        <AppCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.divider }]}>
            <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.7}>
                <Text style={[styles.label, { color: theme.placeholder }]}>
                    {tr.labels.continueReading}
                </Text>
                <Text style={[styles.surahName, { color: theme.text }]}>
                    {lastReadSurahName}
                </Text>
                <Text style={[styles.ayahNumber, { color: theme.accent }]}>
                    {tr.labels.ayah} {lastReadAyahId}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearLastRead} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={theme.placeholder} />
            </TouchableOpacity>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    content: {
        flex: 1,
        gap: 2,
    },
    label: {
        fontSize: 11,
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    surahName: {
        fontSize: 15,
        fontWeight: "600",
    },
    ayahNumber: {
        fontSize: 13,
        fontWeight: "400",
    },
});
```

---

## QuranScreen changes

Add `ContinueReadingCard` above the search bar — no other changes:

```tsx
{/* Continue Reading */}
<ContinueReadingCard />

{/* Search bar */}
<View style={...}>
```

---

## Navigation from QuranScreen (QuranRow)

Add `onPress` to each surah row:

```tsx
router.push({
    pathname: "/(extras)/quran/ayahs",
    params: {
        surahId: surah.id,
        surahName: surah.transliteration,
    },
});
```

---

## Arabic vs API flow

| Language | Arabic text | Translation | Loading spinner |
|---|---|---|---|
| Arabic (`ar`) | Local JSON via `getSurahById()` | None — Arabic only | No — instant |
| English, German, Turkish, Albanian | Local JSON via `getSurahById()` | alquran.cloud API | Yes — `isLoadingAyahs` |

---

## What is persisted vs not

| Data | Persisted | Reason |
|---|---|---|
| `ayahs[]` | ❌ | Always fresh from API |
| `isLoadingAyahs`, `ayahsError` | ❌ | UI state, always starts fresh |
| `lastReadSurahId` | ✅ | User progress |
| `lastReadSurahName` | ✅ | Shown on card without extra lookup |
| `lastReadAyahId` | ✅ | User progress |

---

## Things to do before implementing

1. Add `quranAyahsError` and `continueReading` and `ayah` to your existing translation labels type — these are already used in existing screens so follow the same pattern
2. Adjust `AYAH_ROW_HEIGHT = 80` after building `AyahRow` to match actual row height
3. Pick preferred translator per language — defaults are `en.sahih`, `de.bubenheim`, `tr.diyanet`, `sq.nahi`
