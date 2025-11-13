import { useMemo } from "react";
import { translations } from "@/constants/translations";
import { useAppContext } from "@/context/AppContext";

export default function useTranslation() {
    const { appSettings } = useAppContext();

    const language = appSettings.language || "en";

    // ------------------------------------------------------------
    // Resolve translation
    // ------------------------------------------------------------
    const tr = useMemo(() => (path) => {
        const keys = path.split(".");
        let result = translations[language];
        for (const key of keys) {
            result = result?.[key];
        }
        return result ?? null;
    }, [language]);

    return { tr, language };
}