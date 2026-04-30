import { formatDateKey } from '@/utils/date';

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
