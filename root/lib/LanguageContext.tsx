import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, type Language, type Translations } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'flashfiles_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('no'); // Default to Norwegian
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load saved language preference on mount
        const loadLanguage = async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved === 'en' || saved === 'no') {
                    setLanguageState(saved);
                }
            } catch (error) {
                console.warn('Failed to load language preference:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, lang);
        } catch (error) {
            console.warn('Failed to save language preference:', error);
        }
    };

    const t = translations[language];

    // Don't render children until language is loaded to prevent flicker
    if (!isLoaded) {
        return null;
    }

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
