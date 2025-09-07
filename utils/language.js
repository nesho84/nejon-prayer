import { loadSettings } from "./storage";

const translations = {
    "en": {
        "dateFormat": "MMM dd yyyy",
        "prayers": {
            "Imsak": "Imsaku",
            "Fajr": "Fajr",
            "Sunrise": "Sunrise",
            "Dhuhr": "Dhuhr",
            "Asr": "Asr",
            "Maghrib": "Maghrib",
            "Isha": "Isha"
        },
        "labels": {
            "loading": "Loading..."
        }
    },
    "sq": {
        "dateFormat": "dd MMM yyyy",
        "prayers": {
            "Imsak": "Imsaku",
            "Fajr": "Sabahu",
            "Sunrise": "Lindja e Diellit",
            "Dhuhr": "Dreka",
            "Asr": "Ikindia",
            "Maghrib": "Akshami",
            "Isha": "Jacia"
        },
        "labels": {
            "loading": "Duke u ngarkuar..."
        }
    }
};

let currentLang = "en"; // fallback

export async function initLanguage() {
    const saved = await loadSettings();
    if (saved?.language) {
        currentLang = saved.language;
    }
}

export function lang(path) {
    const keys = path.split(".");
    let result = translations[currentLang];
    for (const key of keys) {
        result = result?.[key];
    }
    return result ?? path; // fallback to key
}

export function getPrayerName(originalName) {
    return lang("prayers." + originalName) || originalName;
}
