import { createMMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

export const storage = createMMKV({
  id: "app-storage",
  // Optional: encryptionKey: 'some_encryption_key',
});

export const mmkvStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.remove(name),
}