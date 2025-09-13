import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@app_settings_v1";

export async function saveSettings(settings) {
    const toStore = {
        ...settings,
        theme: settings.them || null,
        notifications: !!settings.notifications,
        coords: settings.coords || null,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

export async function loadSettings() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    parsed.notifications = parsed.notifications === true; // ensure boolean
    return parsed;
}

