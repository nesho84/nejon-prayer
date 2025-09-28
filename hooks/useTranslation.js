import { translations } from "@/constants/translations";
import { useSettingsContext } from "@/contexts/SettingsContext";

export default function useTranslation() {
    const { appSettings } = useSettingsContext();

    const language = appSettings.language || "en";

    // ------------------------------------------------------------
    // Resolve translation
    // ------------------------------------------------------------
    const tr = (path) => {
        const keys = path.split(".");
        let result = translations[language];
        for (const key of keys) {
            result = result?.[key];
        }
        return result ?? path;
    };

    return { tr, language };
}