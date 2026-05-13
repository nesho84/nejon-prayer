import { toDateKey } from '@/utils/dateKey';

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
// Returns grid items for the current month (empty padding + day entries)
// ------------------------------------------------------------
const getCurrentMonthGridItems = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;
  return [
    ...Array.from({ length: offset }, (_, i) => ({ empty: true as const, key: `empty-${i}` })),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
      return { empty: false as const, date, key: toDateKey(date) };
    }),
  ];
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
