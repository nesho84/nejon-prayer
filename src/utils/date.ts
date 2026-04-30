// ------------------------------------------------------------
// Returns a local date key in YYYY-MM-DD format for a given date (defaults to today)
// ------------------------------------------------------------
export const formatDateKey = (date?: Date): string => {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
