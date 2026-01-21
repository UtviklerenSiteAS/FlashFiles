import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language, type Translations } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('flashfiles_language');
        return (saved === 'en' || saved === 'no') ? saved : 'no'; // Default to Norwegian
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('flashfiles_language', lang);
    };

    useEffect(() => {
        // Sync with localStorage on mount
        const saved = localStorage.getItem('flashfiles_language');
        if (saved === 'en' || saved === 'no') {
            setLanguageState(saved);
        }
    }, []);

    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
