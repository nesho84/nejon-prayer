import { toDateKey } from '@/utils/date';

// ------------------------------------------------------------
// Returns the 7 Date objects for the current week (Mon–Sun)
// ------------------------------------------------------------
export const getCurrentWeekDays = (): Date[] => {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

// ------------------------------------------------------------
// Internal: Returns grid items for the current month (including leading days from the previous month)
// ------------------------------------------------------------
const getCurrentMonthGridItems = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;

  const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();

  const leadingDays = Array.from({ length: offset }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 1, prevMonthLastDay - offset + i + 1);
    return { empty: false as const, isPrevMonth: true as const, date, key: toDateKey(date) };
  });

  const currentDays = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
    return { empty: false as const, isPrevMonth: false as const, date, key: toDateKey(date) };
  });

  return [...leadingDays, ...currentDays];
};

// ------------------------------------------------------------
// Groups month grid items into rows of 7 for rendering
// ------------------------------------------------------------
export const getCurrentMonthRows = () => {
  const items = getCurrentMonthGridItems();
  const rows: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += 7) rows.push(items.slice(i, i + 7));
  return rows;
};
