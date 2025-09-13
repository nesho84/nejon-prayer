import { translations } from "@/constants/translations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [currentLang, setCurrentLang] = useState("en");

    let languageKey = "@Language_Key";

    useEffect(() => {
        let mounted = true;
        if (mounted) {
            loadLanguage();
        }
        return () => mounted = false;
    }, [currentLang]);

    // Change language
    const changeLanguage = (language) => {
        setCurrentLang(language);
        saveInStorage(language);
    };

    // Read from AsyncStorage
    const loadLanguage = async () => {
        try {
            let storageLanguage = await AsyncStorage.getItem(languageKey);
            if (storageLanguage !== null) {
                setCurrentLang(JSON.parse(storageLanguage));
            } else {
                saveInStorage(currentLang);
            }
        } catch (err) {
            console.log(err);
        }
    };

    // Save in AsyncStorage
    const saveInStorage = async (newLanguage) => {
        try {
            await AsyncStorage.setItem(languageKey, JSON.stringify(newLanguage));
        } catch (err) {
            console.log(err);
        }
    };

    // Full lang object
    const lang = {
        translations,
        current: currentLang,
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
        <LanguageContext.Provider value={{ lang, currentLang, changeLanguage, loadLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
