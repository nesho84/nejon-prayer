import { mmkvStorage } from "@/store/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface NotifReminderState {
  notifReminderNextShowAt: number | null;
  notifReminderShownAt: number | null;
  notifReminderShownCount: number;
  notifReminderDone: boolean;
  isReady: boolean;
  setNotifReminderNextShowAt: (notifReminderNextShowAt: number | null) => void;
  setNotifReminderShownAt: (notifReminderShownAt: number | null) => void;
  setNotifReminderShownCount: (notifReminderShownCount: number) => void;
  setNotifReminderDone: (notifReminderDone: boolean) => void;
}

export const useNotifReminderStore = create<NotifReminderState>()(
  persist(
    (set) => ({
      notifReminderNextShowAt: null,
      notifReminderShownAt: null,
      notifReminderShownCount: 0,
      notifReminderDone: false,
      isReady: false,

      // Earliest time the modal may show — null until first seen with notifications off
      setNotifReminderNextShowAt: (notifReminderNextShowAt) => {
        set({ notifReminderNextShowAt });
      },

      // Last time the modal was shown
      setNotifReminderShownAt: (notifReminderShownAt) => {
        set({ notifReminderShownAt });
      },

      // How many times the modal was shown
      setNotifReminderShownCount: (notifReminderShownCount) => {
        set({ notifReminderShownCount });
      },

      // Stopped for good — shown the max times (until notifications are granted and turned off again)
      setNotifReminderDone: (notifReminderDone) => {
        set({ notifReminderDone });
      },
    }),
    {
      name: "notif-reminder-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        notifReminderNextShowAt: state.notifReminderNextShowAt,
        notifReminderShownAt: state.notifReminderShownAt,
        notifReminderShownCount: state.notifReminderShownCount,
        notifReminderDone: state.notifReminderDone,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
