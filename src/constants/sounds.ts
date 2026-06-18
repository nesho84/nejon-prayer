export const SOUNDS = {
  // Azan sounds
  azan1_short: 'azan_short.mp3',
  azan2_fajr: 'fajr_mishary_rashid_alafasy.mp3',
  azan3: 'abdullah_al_zaili.mp3',
  azan4: 'mohamed_tarek.mp3',

  // Alarm sounds
  alarm1: 'alarm1.mp3',
  alarm2: 'alarm2.mp3',
  alarm3: 'alarm3.mp3',
};

// ------------------------------------------------------------
// @TODO (iOS): Native notification sound files (Apple requires .caf/.aiff/.wav, ≤30s)
// Convert + trim each SOUNDS file with ffmpeg, drop them in assets/sounds-ios/,
// then map them here. src/plugins/resBuild.js already copies and registers
// anything placed in assets/sounds-ios/ with the Xcode project.
// ------------------------------------------------------------
// export const IOS_SOUNDS: Partial<Record<string, string>> = {
//   [SOUNDS.azan1_short]: 'azan_short.caf',
//   [SOUNDS.azan2_fajr]: 'fajr_mishary_rashid_alafasy.caf',
//   [SOUNDS.azan3]: 'abdullah_al_zaili.caf',
//   [SOUNDS.azan4]: 'mohamed_tarek.caf',
//   [SOUNDS.alarm1]: 'alarm1.caf',
//   [SOUNDS.alarm2]: 'alarm2.caf',
//   [SOUNDS.alarm3]: 'alarm3.caf',
// };

// ------------------------------------------------------------
// @TODO (iOS): Resolve the native sound filename for a given SOUNDS value
// Returns undefined for 'no sound' or an unmapped value (falls back to iOS default)
// ------------------------------------------------------------
// export function getIosSound(sound?: string): string | undefined {
//   return sound ? IOS_SOUNDS[sound] : undefined;
// }