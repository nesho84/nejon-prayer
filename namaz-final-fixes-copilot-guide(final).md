# Namaz Final Fixes — Copilot Implementation Guide

## Confirmed 15-Step Structure

| Step | Content | Unique or Reused |
|------|---------|-----------------|
| 1 | Tekbir + Nijet | Unique |
| 2 | Kyami — Subhaneke + Eudhubilahi + Fatiha + Sure | Unique |
| 3 | Ruku — Subhane Rabbijel Adhim × 3 | Unique |
| 4 | Ngritja nga Ruku — Semi Allahu + Rabbena lekel hamd | Unique |
| 5 | Sexhdeja e parë — Subhane Rabbijel A'la × 3 | Unique |
| 6 | Ulja ndërmjet dy Sexhdeve — Rabbigfir li | Unique |
| 7 | Sexhdeja e dytë — Subhane Rabbijel A'la × 3 → çohesh | Unique |
| 8 | Çohesh + Kyami — Fatiha + Sure (NO Subhaneke) | Unique |
| 9 | Ruku | = Step 3 content |
| 10 | Ngritja nga Ruku | = Step 4 content |
| 11 | Sexhdeja e parë | = Step 5 content |
| 12 | Ulja ndërmjet dy Sexhdeve | = Step 6 content |
| 13 | Sexhdeja e dytë — qëndro ulur (NO getting up) | = Step 7 content, but stay seated |
| 14 | Kaade — Attahiyyatu + Allahumma Salli + Allahumma Barik + Rabbena | Unique |
| 15 | Selami | Unique (already exists as step 14) |

**Key rules:**
- Steps 9–12: exact same text as steps 3–6, copied in namazi.ts
- Step 13: same text as step 7 BUT ending says "qëndro ulur" instead of "çohesh"
- Step 8: NO Subhaneke — only Fatiha + Sure
- Step 14: Kaade prayers (currently your step 13)
- Step 15: Selami (currently your step 14)
- Your app currently has 14 steps → adding 1 new step (splitting current step 13 into step 13 + step 14)

---

## IMPORTANT: How to Use This Guide With Copilot

**Do ONE task at a time. Do not ask Copilot to do all of these in one prompt.**
Each task below is a separate Copilot prompt. Wait for it to finish and verify before moving to the next.
When a task involves multiple languages, ask Copilot to do one language at a time.

---

## Task 1 — Audit current steps in namazi.ts

**Background:** Before changing anything, confirm exactly what steps currently exist so nothing gets accidentally overwritten.

**Copilot prompt:**
> Open namazi.ts and list all step keys that exist in the Albanian language object, with the first 5 words of each step's text. Do not change anything yet.

**Verify:** You can see all 14 current steps clearly. Note that current step 13 = Kaade and current step 14 = Selami. These will become steps 14 and 15 after this work.

---

## Task 2 — Renumber current step 14 → step 15 in namazi.ts (Albanian first)

**Background:** We need to make room for the new step 13 (Sexhdeja e dytë) and step 14 (Kaade). So the current Selami (step 14) must first move to step 15.

**Copilot prompt:**
> In namazi.ts, in the Albanian language object only, rename step14 to step15. Do not touch any other step or language yet.

**Verify:** Albanian now has step15 = Selami. Step 14 key no longer exists in Albanian.

---

## Task 3 — Renumber current step 13 → step 14 in namazi.ts (Albanian first)

**Background:** The current step 13 (Kaade — Attahiyyatu etc.) moves to step 14.

**Copilot prompt:**
> In namazi.ts, in the Albanian language object only, rename step13 to step14. Do not touch any other step or language yet.

**Verify:** Albanian now has step14 = Kaade (Attahiyyatu/Salli/Barik/Rabbena). Step 13 key no longer exists in Albanian.

---

## Task 4 — Add new Step 13 to namazi.ts (Albanian first)

**Background:** Step 13 is the second sujood of Rakat 2. It is identical to step 7 in content, except at the end the user stays seated instead of getting up. This is the only difference.

**Copilot prompt:**
> In namazi.ts, in the Albanian language object only, add a new step13 with the text below. Do not touch any other step or language yet.

**New Step 13 Albanian text:**
> Thuaj 'Allahu Ekber' dhe bie në Sexhde. 7 pika duhet të prekin tokën: balli, hunda, të dyja pëllëmbët, të dy gjunjët, dhe majat e gishtave të këmbëve. Burrat: bërryla e ngritur, bërryli larg nga kërciri, krahët larg nga brinjët. Gratë: të grumbulluara. Thuaj 3 herë: 'Subhane Rabbijel A'la.' (I Shenjtë është Zoti im, më i Larti.) Pastaj thuaj 'Allahu Ekber' dhe qëndro ulur për Kaaden.

**Verify:** Albanian now has steps 1–15. Step 13 ends with "qëndro ulur" — no mention of getting up.

---

## Task 5 — Repeat Tasks 2, 3, 4 for all remaining languages

**Copilot prompt:**
> In namazi.ts, for each remaining language one at a time:
> 1. Rename step14 → step15
> 2. Rename step13 → step14
> 3. Add new step13 (translated version of the Albanian text above)

**Verify:** All languages now have steps 1–15. Step 13 = Sexhdeja e dytë, Step 14 = Kaade, Step 15 = Selami.

---

## Task 6 — Fix Step 7 back-reference (Albanian first)

**Background:** Step 7 currently references another step instead of fully describing the second sujood. It needs to be fully self-contained. Note: step 7 ends with "çohesh" (get up) — unlike step 13 which ends with "qëndro ulur".

**Copilot prompt:**
> In namazi.ts, in the Albanian language object only, rewrite step7 so it fully describes the second sujood without referencing any other step. Use the text below.

**Step 7 Albanian text:**
> Thuaj 'Allahu Ekber' dhe bie përsëri në Sexhde. 7 pika duhet të prekin tokën: balli, hunda, të dyja pëllëmbët, të dy gjunjët, dhe majat e gishtave të këmbëve. Burrat: bërryla e ngritur, bërryli larg nga kërciri, krahët larg nga brinjët. Gratë: të grumbulluara. Thuaj 3 herë: 'Subhane Rabbijel A'la.' (I Shenjtë është Zoti im, më i Larti.) Kjo përfundon Rekatin e parë. Thuaj 'Allahu Ekber' dhe çohu në këmbë.

**Verify:** Step 7 contains no reference to any other step. Search namazi.ts for "hapi 6" — zero results.

---

## Task 7 — Fix Step 7 for all remaining languages

**Copilot prompt:**
> In namazi.ts, apply the same step7 fix to each remaining language. Translate appropriately. Do one language at a time.

**Verify:** Search entire namazi.ts for any back-reference like "step 6", "hapi 6", "korak 6" — zero results.

---

## Task 8 — Verify Steps 9–12 match Steps 3–6 (Albanian first)

**Background:** Steps 9–12 should be exact copies of steps 3–6. Check if they already are, and fix any that differ.

**Copilot prompt:**
> In namazi.ts, in the Albanian language object, compare:
> - step9 vs step3 (Ruku)
> - step10 vs step4 (Ngritja)
> - step11 vs step5 (Sexhdeja e parë)
> - step12 vs step6 (Ulja ndërmjet)
> If any pair differs, update steps 9–12 to exactly match steps 3–6. Do not touch any other language.

**Verify:** Steps 9–12 Albanian text is identical to steps 3–6.

---

## Task 9 — Verify Steps 9–12 for all remaining languages

**Copilot prompt:**
> In namazi.ts, for each remaining language, verify that steps 9–12 exactly match steps 3–6. Fix any that differ. Do one language at a time.

**Verify:** All languages have steps 9–12 matching steps 3–6.

---

## Task 10 — Update STEPS array and progress total

**Copilot prompt:**
> 1. In the STEPS array (wherever steps are defined as a list), add step15 so the total is now 15 steps.
> 2. Find every place in the codebase where the total step count is hardcoded as 14 (e.g. "Hapi X / 14" or totalSteps = 14) and change to 15.

**Verify:** STEPS array has 15 entries. Progress bar shows "Hapi X / 15". Search for "/ 14" and "totalSteps" — no remaining references to 14.

---

## Task 11 — Update image assignments

**Copilot prompt:**
> Update image assignments for the affected steps:
> - Step 13 (new — Sexhdeja e dytë of Rakat 2): use same image as step 7
> - Step 14 (Kaade — was step 13): keep its existing image
> - Step 15 (Selami — was step 14): keep its existing image

**Verify:** No step has a missing or undefined image. Steps 13, 14, 15 all render correctly.

---

## Task 12 — Update surah block assignments

**Copilot prompt:**
> Check and update surah block assignments to match this exactly:
> - Step 2: Subhaneke, Ta'awwudh, Al-Fatiha, Al-Kawthar, Al-Ikhlas
> - Step 8: Al-Fatiha, Al-Kawthar, Al-Ikhlas (NO Subhaneke)
> - Step 14: Attahiyyatu, Allahumma Salli, Allahumma Barik, Rabbena
> - All other steps: no surah blocks

**Verify:** Scroll through all 15 steps in the app. Surah blocks appear only under steps 2, 8, and 14.

---

## Final Verification Checklist

- [ ] Total steps = 15, progress bar shows "Hapi X / 15"
- [ ] Step 2: Subhaneke + Eudhubilahi + Fatiha + Sure — surah blocks present
- [ ] Step 7: Fully self-contained, ends with "çohesh" — no back-reference to step 6
- [ ] Step 8: Fatiha + Sure only — NO Subhaneke — surah blocks present
- [ ] Steps 9–12: Identical content to steps 3–6 respectively
- [ ] Step 13: Sexhdeja e dytë — ends with "qëndro ulur", NOT "çohesh"
- [ ] Step 14: Kaade — Attahiyyatu/Salli/Barik/Rabbena — surah blocks present
- [ ] Step 15: Selami
- [ ] All 15 steps present in every language in namazi.ts
- [ ] No back-references anywhere in namazi.ts
- [ ] All images correctly assigned
- [ ] App builds and runs without errors
