import { translations } from "@/constants/translations";
import { useSettingsContext } from "@/contexts/SettingsContext";

export default function useTranslation() {
    const { settings } = useSettingsContext();

    const currentLang = settings.language || "en";

    const tr = (path) => {
        const keys = path.split(".");
        let result = translations[currentLang];
        for (const key of keys) {
            result = result?.[key];
        }
        return result ?? path;
    };

    return { tr, currentLang };
}