import { formatDateKey, getTriggerTime } from '@/utils/date';

// ------------------------------------------------------------
// Simple runtime tests for src/utils/date.ts
// Call runDateTests() from a dev button or on app start to verify.
// Results are logged to the console.
// ------------------------------------------------------------
export function runDateTests() {
  let passed = 0;
  let failed = 0;

  function assert(label: string, actual: unknown, expected: unknown) {
    if (actual === expected) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.warn(`  ❌ ${label}\n     expected: ${expected}\n     got:      ${actual}`);
      failed++;
    }
  }

  console.log('\n📅 [dateTest] Running formatDateKey tests...');

  // --- Basic format ---
  assert(
    'Known date: Jan 1 2026 → "2026-01-01"',
    formatDateKey(new Date(2026, 0, 1)),        // month is 0-indexed
    '2026-01-01'
  );

  assert(
    'Known date: Dec 31 2025 → "2025-12-31"',
    formatDateKey(new Date(2025, 11, 31)),
    '2025-12-31'
  );

  assert(
    'Single-digit month/day are zero-padded: Feb 5 → "2026-02-05"',
    formatDateKey(new Date(2026, 1, 5)),
    '2026-02-05'
  );

  // --- No argument → today ---
  const today = new Date();
  const expectedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  assert(
    'No argument returns today in local time',
    formatDateKey(),
    expectedToday
  );

  // --- YYYY-MM-DD format validation ---
  const result = formatDateKey(new Date(2026, 3, 30));
  assert(
    'Output matches YYYY-MM-DD pattern',
    /^\d{4}-\d{2}-\d{2}$/.test(result),
    true
  );

  // --- UTC vs local time bug check ---
  // Shows that formatDateKey uses LOCAL time, unlike toISOString().split('T')[0]
  // which uses UTC. In UTC+ timezones after 22:00+ local time, these can differ.
  const utcResult = new Date().toISOString().split('T')[0];
  const localResult = formatDateKey();
  const utcMatchesLocal = utcResult === localResult;
  if (!utcMatchesLocal) {
    console.warn(`  ⚠️  UTC vs local date mismatch detected! UTC: ${utcResult} | Local: ${localResult}`);
    console.warn(`     This is expected in UTC+ timezones late at night — formatDateKey is CORRECT.`);
  } else {
    console.log(`  ℹ️  UTC and local dates match right now (${localResult}) — mismatch only visible near midnight in UTC+ zones.`);
  }

  console.log(`\n📅 [dateTest] Done — ${passed} passed, ${failed} failed.\n`);
}

// ------------------------------------------------------------
// Tests for getTriggerTime
// ------------------------------------------------------------
export function runGetTriggerTimeTests() {
  let passed = 0;
  let failed = 0;

  function assert(label: string, actual: unknown, expected: unknown) {
    if (actual === expected) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.warn(`  ❌ ${label}\n     expected: ${expected}\n     got:      ${actual}`);
      failed++;
    }
  }

  console.log('\n⏰ [getTriggerTimeTest] Running tests...');

  const now = new Date();
  const todayKey = formatDateKey(now);

  // Helper to build a future time string "HH:mm" that hasn't passed yet today
  const futureHour = (now.getHours() + 2) % 24;
  const futureTimeString = `${String(futureHour).padStart(2, '0')}:00`;

  // Helper to build a past time string "HH:mm" that has already passed today
  const pastHour = now.getHours() === 0 ? 23 : now.getHours() - 1;
  const pastTimeString = `${String(pastHour).padStart(2, '0')}:00`;

  // --- 1. Future time with no offset → scheduled for TODAY ---
  const t1 = getTriggerTime(futureTimeString, 0);
  assert(
    'Future time (no offset) → scheduled today',
    t1 ? formatDateKey(t1) : null,
    todayKey
  );

  // --- 2. Future time → correct hour set ---
  assert(
    'Future time → correct hour',
    t1 ? t1.getHours() : null,
    futureHour
  );

  // --- 3. Past time with no tomorrow string → scheduled for TOMORROW ---
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);

  const t3 = getTriggerTime(pastTimeString, 0);
  assert(
    'Past time (no tomorrowTimeString) → scheduled tomorrow',
    t3 ? formatDateKey(t3) : null,
    tomorrowKey
  );

  // --- 4. Past time with no tomorrow string → still uses today's hour ---
  assert(
    'Past time (no tomorrowTimeString) → uses today\'s hour (fallback)',
    t3 ? t3.getHours() : null,
    pastHour
  );

  // --- 5. Past time WITH tomorrow string → scheduled for TOMORROW ---
  const tomorrowHour = (pastHour + 1) % 24; // e.g. 1 hour later tomorrow
  const tomorrowTimeString = `${String(tomorrowHour).padStart(2, '0')}:30`;

  const t5 = getTriggerTime(pastTimeString, 0, tomorrowTimeString);
  assert(
    'Past time + tomorrowTimeString → scheduled tomorrow',
    t5 ? formatDateKey(t5) : null,
    tomorrowKey
  );

  // --- 6. Past time WITH tomorrow string → uses tomorrow's hour ---
  assert(
    'Past time + tomorrowTimeString → uses tomorrow\'s hour',
    t5 ? t5.getHours() : null,
    tomorrowHour
  );

  // --- 7. Past time WITH tomorrow string → uses tomorrow's minutes ---
  assert(
    'Past time + tomorrowTimeString → uses tomorrow\'s minutes (30)',
    t5 ? t5.getMinutes() : null,
    30
  );

  // --- 8. Offset applied to future time ---
  const t8 = getTriggerTime(futureTimeString, -15);
  assert(
    'Future time with -15 offset → correct minutes (45)',
    t8 ? t8.getMinutes() : null,
    45
  );

  // --- 9. Offset applied to tomorrow's time when past + tomorrowTimeString ---
  // tomorrowTimeString = "HH:30", offset = +10 → minutes should be 40
  const t9 = getTriggerTime(pastTimeString, 10, tomorrowTimeString);
  assert(
    'Past time + tomorrowTimeString + offset +10 → tomorrow\'s minutes become 40',
    t9 ? t9.getMinutes() : null,
    40
  );

  // --- 10. Invalid today's time string → returns null ---
  const t10 = getTriggerTime('not-a-time', 0);
  assert(
    'Invalid time string → returns null',
    t10,
    null
  );

  // --- 11. Invalid tomorrow string → falls back to today's hour (no crash) ---
  const t11 = getTriggerTime(pastTimeString, 0, 'bad-time');
  assert(
    'Invalid tomorrowTimeString → falls back, scheduled tomorrow with today\'s hour',
    t11 ? t11.getHours() : null,
    pastHour
  );

  // --- 12. Null tomorrow string → behaves same as no tomorrow string ---
  const t12 = getTriggerTime(pastTimeString, 0, null);
  assert(
    'null tomorrowTimeString → falls back, scheduled tomorrow with today\'s hour',
    t12 ? t12.getHours() : null,
    pastHour
  );

  // --- 13. Future time ignores tomorrowTimeString entirely ---
  const t13 = getTriggerTime(futureTimeString, 0, '01:00');
  assert(
    'Future time → tomorrowTimeString ignored, still today',
    t13 ? formatDateKey(t13) : null,
    todayKey
  );

  console.log(`\n⏰ [getTriggerTimeTest] Done — ${passed} passed, ${failed} failed.\n`);
}
