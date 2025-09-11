import { translations } from "@/constants/translations";
import { loadSettings } from "@/hooks/storage";
import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [currentLang, setCurrentLang] = useState("en");

    // Load saved settings
    useEffect(() => {
        let mounted = true;
        if (mounted) {
            (async () => {
                const saved = await loadSettings();
                if (saved?.language) {
                    setCurrentLang(saved.language);
                }
            })();
        }
        return () => mounted = false;
    }, []);

    // Update language
    const setContextLanguage = async (value) => {
        // just update context, screens handle saving in storage
        setCurrentLang(value);
    };

    // Full lang object
    const lang = {
        current: currentLang,
        translations,
        tr: (path) => {
            const keys = path.split(".");
            let result = translations[currentLang];
            for (const key of keys) {
                result = result?.[key];
            }
            return result ?? path;
        },
    };

    return (
        <LanguageContext.Provider value={{ lang, currentLang, setContextLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
