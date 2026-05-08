// Standalone Node test for getTriggerTime — run with: node src/tests/getTriggerTimeTest.mjs

const formatDateKey = (date) => {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function getTriggerTime(timeStringRaw, offsetMinutes = 0, tomorrowTimeStringRaw) {
  const timeString = timeStringRaw.replace(/\u00A0/g, ' ').trim();
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const triggerTime = new Date();
  triggerTime.setHours(hour, minute, 0, 0);
  if (offsetMinutes !== 0) triggerTime.setMinutes(triggerTime.getMinutes() + offsetMinutes);
  const now = new Date();
  if (triggerTime <= now) {
    if (tomorrowTimeStringRaw) {
      const ts = tomorrowTimeStringRaw.replace(/\u00A0/g, ' ').trim();
      const tm = ts.match(/^(\d{1,2}):(\d{2})$/);
      if (tm) {
        triggerTime.setHours(Number(tm[1]), Number(tm[2]), 0, 0);
        if (offsetMinutes !== 0) triggerTime.setMinutes(triggerTime.getMinutes() + offsetMinutes);
      }
    }
    triggerTime.setDate(triggerTime.getDate() + 1);
  }
  return triggerTime;
}

let passed = 0, failed = 0;
function assert(label, actual, expected) {
  if (actual === expected) { console.log(`  ✅ ${label}`); passed++; }
  else { console.log(`  ❌ ${label}\n     expected: ${expected}\n     got:      ${actual}`); failed++; }
}

const now = new Date();
const todayKey = formatDateKey(now);
const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
const tomorrowKey = formatDateKey(tomorrow);
const futureHour = (now.getHours() + 2) % 24;
const futureTimeString = String(futureHour).padStart(2, '0') + ':00';
const pastHour = now.getHours() === 0 ? 23 : now.getHours() - 1;
const pastTimeString = String(pastHour).padStart(2, '0') + ':00';
const tomorrowHour = (pastHour + 1) % 24;
const tomorrowTimeString = String(tomorrowHour).padStart(2, '0') + ':30';

console.log(`\nnow=${now.toLocaleTimeString()}  future=${futureTimeString}  past=${pastTimeString}  tomorrow=${tomorrowTimeString}\n`);

const t1 = getTriggerTime(futureTimeString, 0);
assert('Future time → today', t1 ? formatDateKey(t1) : null, todayKey);
assert('Future time → correct hour', t1 ? t1.getHours() : null, futureHour);

const t3 = getTriggerTime(pastTimeString, 0);
assert('Past, no tomorrowStr → scheduled tomorrow', t3 ? formatDateKey(t3) : null, tomorrowKey);
assert("Past, no tomorrowStr → today's hour (fallback)", t3 ? t3.getHours() : null, pastHour);

const t5 = getTriggerTime(pastTimeString, 0, tomorrowTimeString);
assert('Past + tomorrowStr → scheduled tomorrow', t5 ? formatDateKey(t5) : null, tomorrowKey);
assert("Past + tomorrowStr → tomorrow's hour", t5 ? t5.getHours() : null, tomorrowHour);
assert("Past + tomorrowStr → tomorrow's minutes (30)", t5 ? t5.getMinutes() : null, 30);

const t8 = getTriggerTime(futureTimeString, -15);
assert('Future -15 offset → minutes = 45', t8 ? t8.getMinutes() : null, 45);

const t9 = getTriggerTime(pastTimeString, 10, tomorrowTimeString);
assert('Past + tomorrowStr + offset +10 → minutes = 40', t9 ? t9.getMinutes() : null, 40);

assert('Invalid time string → null', getTriggerTime('not-a-time', 0), null);

const t11 = getTriggerTime(pastTimeString, 0, 'bad-time');
assert("Invalid tomorrowStr → fallback, today's hour", t11 ? t11.getHours() : null, pastHour);

const t12 = getTriggerTime(pastTimeString, 0, null);
assert("null tomorrowStr → fallback, today's hour", t12 ? t12.getHours() : null, pastHour);

const t13 = getTriggerTime(futureTimeString, 0, '01:00');
assert('Future time → tomorrowStr ignored, still today', t13 ? formatDateKey(t13) : null, todayKey);

console.log(`\n⏰ Result: ${passed} passed, ${failed} failed.\n`);
