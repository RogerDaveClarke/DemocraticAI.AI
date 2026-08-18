import React, { useState, createContext, useContext } from 'react';
import { Globe } from 'lucide-react';

interface TranslationContextType {
  userLanguage: 'en' | 'ga';
  setUserLanguage: (lang: 'en' | 'ga') => void;
  isTranslating: boolean;
  setIsTranslating: (translating: boolean) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [userLanguage, setUserLanguage] = useState<'en' | 'ga'>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  return (
    <TranslationContext.Provider value={{ userLanguage, setUserLanguage, isTranslating, setIsTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
};

interface TranslationToggleProps {
  className?: string;
}

export const TranslationToggle: React.FC<TranslationToggleProps> = ({ className = '' }) => {
  const { userLanguage, setUserLanguage } = useTranslation();

  return (
    <button
      onClick={() => setUserLanguage(userLanguage === 'en' ? 'ga' : 'en')} aria-label="Perform action"
      className={`flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
    >
      <Globe size={16} />
      <span>{userLanguage === 'en' ? 'Gaeilge' : 'English'}</span>
    </button>
  );
};

interface BilingualContent {
  en: string;
  ga: string;
}

interface BilingualMessageProps {
  content: BilingualContent;
  currentLanguage: 'en' | 'ga';
}

export const BilingualMessage: React.FC<BilingualMessageProps> = ({ content, currentLanguage }) => {
  const [showBoth, setShowBoth] = useState(false);

  return (
    <div>
      <div className="mb-2">
        {showBoth ? (
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <div className="text-xs text-blue-600 font-medium mb-1">English</div>
              <div>{content.en}</div>
            </div>
            <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
              <div className="text-xs text-green-600 font-medium mb-1">Gaeilge</div>
              <div>{content.ga}</div>
            </div>
          </div>
        ) : (
          <div>{content[currentLanguage]}</div>
        )}
      </div>
      <button
        onClick={() => setShowBoth(!showBoth)} aria-label="Perform action"
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        {showBoth ? 'Show single language' : 'Show both languages'}
      </button>
    </div>
  );
};

interface TranslatedMessageProps {
  text: string;
  originalLanguage: 'en' | 'ga';
  targetLanguage: 'en' | 'ga';
}

export const TranslatedMessage: React.FC<TranslatedMessageProps> = ({ 
  text, 
  originalLanguage, 
  targetLanguage 
}) => {
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (originalLanguage === targetLanguage) {
      setTranslatedText(text);
      return;
    }

    setIsLoading(true);
    try {
      // Mock translation - in production, call your translation API
      const mockTranslation = `[Translated to ${targetLanguage}] ${text}`;
      setTranslatedText(mockTranslation);
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslatedText(text);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    handleTranslate();
  }, [text, originalLanguage, targetLanguage]);

  if (isLoading) {
    return <div className="animate-pulse">Translating...</div>;
  }

  return <div>{translatedText || text}</div>;
};