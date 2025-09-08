import { createContext, useContext, useEffect, useState } from "react";
import { loadSettings } from "../utils/storage";

const translations = {
    en: {
        prayers: {
            Imsak: "Imsak",
            Fajr: "Fajr",
            Sunrise: "Sunrise",
            Dhuhr: "Dhuhr",
            Asr: "Asr",
            Maghrib: "Maghrib",
            Isha: "Isha",
        },
        labels: {
            home: "Home",
            settings: "Settings",
            about: "About",
            loading: "Loading...",
            language: "Language",
            location: "Location",
            locationButtonText1: "Update Location",
            locationButtonText2: "Set Location",
            notifications: "Notifications",
            warning1: "Location and notifications are disabled. Prayer times are not location-based and no notifications will be sent.",
            warning2: "Location is disabled. Prayer times are not location-based.",
            warning3: "Notifications are disabled. You will not receive prayer time reminders.",
            aboutText1: "About This App",
            aboutText2: "This app provides accurate prayer times based on your location. You can enable daily notifications to remind you of prayer times.",
        },
    },
    sq: {
        prayers: {
            Imsak: "Imsaku",
            Fajr: "Sabahu",
            Sunrise: "Lindja e Diellit",
            Dhuhr: "Dreka",
            Asr: "Ikindia",
            Maghrib: "Akshami",
            Isha: "Jacia",
        },
        labels: {
            home: "Kryefaqja",
            settings: "Cilësimet",
            about: "Rreth Nesh",
            loading: "Duke u ngarkuar...",
            language: "Gjuha",
            location: "Lokacioni",
            locationButtonText1: "Përditëso Lokacionin",
            locationButtonText2: "Vendos Lokacionin",
            notifications: "Njoftimet",
            warning1: "Lokacioni dhe njoftimet janë të çaktivizuara. Kohët e lutjeve nuk bazohen në lokacion dhe nuk do të dërgohen njoftime.",
            warning2: "Lokacioni është i çaktivizuar. Kohët e lutjeve nuk bazohen në lokacion.",
            warning3: "Njoftimet janë të çaktivizuara. Nuk do të merrni kujtesa për kohët e lutjeve.",
            aboutText1: "Rreth Këtij Aplikacioni",
            aboutText2: "Kjo aplikacion ofron kohët e sakta të lutjeve bazuar në lokacionin tuaj. Mund të aktivizoni njoftime ditore për t'ju kujtuar kohët e lutjeve.",
        },
    },
    de: {
        prayers: {
            Imsak: "Imsak",
            Fajr: "Fajr",
            Sunrise: "Sonnenaufgang",
            Dhuhr: "Dhuhr",
            Asr: "Asr",
            Maghrib: "Maghrib",
            Isha: "Isha",
        },
        labels: {
            home: "Startseite",
            settings: "Einstellungen",
            about: "Über",
            loading: "Lädt...",
            language: "Sprache",
            location: "Standort",
            locationButtonText1: "Standort aktualisieren",
            locationButtonText2: "Standort festlegen",
            notifications: "Benachrichtigungen",
            warning1: "Standort und Benachrichtigungen sind deaktiviert. Die Gebetszeiten basieren nicht auf dem Standort und es werden keine Benachrichtigungen gesendet.",
            warning2: "Standort ist deaktiviert. Die Gebetszeiten basieren nicht auf dem Standort.",
            warning3: "Benachrichtigungen sind deaktiviert. Sie erhalten keine Erinnerungen an Gebetszeiten.",
            aboutText1: "Über diese App",
            aboutText2: "Diese App bietet genaue Gebetszeiten basierend auf Ihrem Standort. Sie können tägliche Benachrichtigungen aktivieren, um Sie an die Gebetszeiten zu erinnern.",
        },
    }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [currentLang, setCurrentLang] = useState("en");

    useEffect(() => {
        (async () => {
            const saved = await loadSettings();
            if (saved?.language) {
                setCurrentLang(saved.language);
            }
        })();
    }, []);

    const setContextLanguage = async (lang) => {
        setCurrentLang(lang);
    };

    const lang = (path) => {
        const keys = path.split(".");
        let result = translations[currentLang];
        for (const key of keys) {
            result = result?.[key];
        }
        return result ?? path;
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
