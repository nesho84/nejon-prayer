import { toDateKey } from '@/utils/datetime';

// ------------------------------------------------------------
// Returns the 7 Date objects for the current week (Mon–Sun)
// ------------------------------------------------------------
export const getWeekDays = (today: Date): Date[] => {
  const monday = new Date(today);
  // (getDay() + 6) % 7 → days since Monday (Mon=0 … Sun=6); step back that many days
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

// ------------------------------------------------------------
// Internal: Returns grid items for the current month, padded with leading
// previous-month and trailing next-month days so every row is a full 7
// ------------------------------------------------------------
const getCurrentMonthGridItems = (today: Date) => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // (getDay() + 6) % 7 → weekday index with Monday=0 … Sunday=6 (count of leading blanks before day 1)
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const leadingDays = Array.from({ length: offset }, (_, i) => {
    const date = new Date(year, month - 1, prevMonthLastDay - offset + i + 1);
    return { isPrevMonth: true as const, isNextMonth: false as const, date, key: toDateKey(date) };
  });

  const currentDays = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    return { isPrevMonth: false as const, isNextMonth: false as const, date, key: toDateKey(date) };
  });

  // Pad the final row with next-month days (mirrors the week view, which always spans Mon–Sun)
  const trailing = (7 - ((offset + daysInMonth) % 7)) % 7;
  const trailingDays = Array.from({ length: trailing }, (_, i) => {
    const date = new Date(year, month + 1, i + 1);
    return { isPrevMonth: false as const, isNextMonth: true as const, date, key: toDateKey(date) };
  });

  return [...leadingDays, ...currentDays, ...trailingDays];
};

// ------------------------------------------------------------
// Groups month grid items into rows of 7 for rendering
// ------------------------------------------------------------
export const getMonthRows = (today: Date) => {
  const items = getCurrentMonthGridItems(today);
  const rows: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += 7) rows.push(items.slice(i, i + 7));
  return rows;
};
