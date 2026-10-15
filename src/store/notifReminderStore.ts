import { mmkvStorage } from "@/store/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface NotifReminderState {
  notifReminderAt: number | null;
  notifReminderCount: number;
  isReady: boolean;
  setNotifReminderAt: (notifReminderAt: number | null) => void;
  setNotifReminderCount: (notifReminderCount: number) => void;
}

export const useNotifReminderStore = create<NotifReminderState>()(
  persist(
    (set) => ({
      notifReminderAt: null,
      notifReminderCount: 0,
      isReady: false,

      // Earliest time the notification reminder modal may show — null until first seen with notifications off
      setNotifReminderAt: (notifReminderAt) => {
        set({ notifReminderAt });
      },

      // How many times the modal was closed — stops for good at the limit
      setNotifReminderCount: (notifReminderCount) => {
        set({ notifReminderCount });
      },
    }),
    {
      name: "notif-reminder-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        notifReminderAt: state.notifReminderAt,
        notifReminderCount: state.notifReminderCount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
