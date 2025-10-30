import { translations } from "@/constants/translations";
import { useAppContext } from "@root/src/context/AppContext";

export default function useTranslation() {
    const { appSettings } = useAppContext();

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
        return result ?? null;
    };

    return { tr, language };
}