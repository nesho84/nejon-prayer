// ------------------------------------------------------------
// Checks if a given prayer time (in "HH:mm" format) has already passed today
// ------------------------------------------------------------
export const isTimePast = (prayerTime: string): boolean => {
  const [hours, minutes] = prayerTime.split(':').map(Number);
  const now = new Date();
  const prayer = new Date();
  prayer.setHours(hours, minutes, 0, 0);
  return now > prayer;
};


