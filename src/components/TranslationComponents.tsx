/**
 * Translation Integration for Enquire Chat Component
 * Enhances the existing chat with real-time translation capabilities
 */

import React, { useState, useEffect } from 'react';
import { Globe, Languages, RotateCcw } from 'lucide-react';
import { translationService, BilingualContent } from '../services/TranslationService';

interface TranslationToggleProps {
  currentLanguage: 'en' | 'ga';
  onLanguageChange: (language: 'en' | 'ga') => void;
  isTranslating?: boolean;
}

export function TranslationToggle({ 
  currentLanguage, 
  onLanguageChange, 
  isTranslating = false 
}: TranslationToggleProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
      <Globe className="w-4 h-4 text-gray-500" />
      <button
        onClick={() => onLanguageChange(currentLanguage === 'en' ? 'ga' : 'en')} aria-label="Perform action"
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLanguage === 'en'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        }`}
        disabled={isTranslating}
      >
        {currentLanguage === 'en' ? 'English' : 'Gaeilge'}
      </button>
      {isTranslating && (
        <RotateCcw className="w-4 h-4 text-gray-400 animate-spin" />
      )}
    </div>
  );
}

interface BilingualMessageProps {
  content: BilingualContent;
  userLanguage: 'en' | 'ga';
}

export function BilingualMessage({ 
  content, 
  userLanguage 
}: BilingualMessageProps) {
  const primaryText = userLanguage === 'en' ? content.en : content.ga;
  const secondaryText = userLanguage === 'en' ? content.ga : content.en;
  
  const [showBoth, setShowBoth] = useState(false);

  return (
    <div className="space-y-2">
      <div className="text-gray-900">
        {primaryText}
      </div>
      
      {secondaryText && (
        <div className="border-t border-gray-100 pt-2">
          <button
            onClick={() => setShowBoth(!showBoth)} aria-label="Perform action"
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <Languages className="w-3 h-3" />
            {showBoth 
              ? `Hide ${userLanguage === 'en' ? 'Irish' : 'English'}` 
              : `Show ${userLanguage === 'en' ? 'Irish' : 'English'}`
            }
          </button>
          
          {showBoth && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600 italic">
              {secondaryText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TranslationContext {
  userLanguage: 'en' | 'ga';
  setUserLanguage: (language: 'en' | 'ga') => void;
  translateMessage: (message: string) => Promise<BilingualContent>;
  isTranslating: boolean;
}

export const TranslationContext = React.createContext<TranslationContext | null>(null);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [userLanguage, setUserLanguage] = useState<'en' | 'ga'>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  const translateMessage = async (message: string): Promise<BilingualContent> => {
    setIsTranslating(true);
    try {
      const result = await translationService.translateChatMessage(message, userLanguage);
      return result;
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    // Load user language preference from localStorage
    const savedLanguage = localStorage.getItem('userLanguagePreference') as 'en' | 'ga';
    if (savedLanguage) {
      setUserLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Save user language preference
    localStorage.setItem('userLanguagePreference', userLanguage);
  }, [userLanguage]);

  return (
    <TranslationContext.Provider value={{
      userLanguage,
      setUserLanguage,
      translateMessage,
      isTranslating
    }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = React.useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

// Hook for accessing bilingual parliamentary data
export function useBilingualData() {
  const { userLanguage } = useTranslation();

  const getBilingualText = (data: any, field: string): string => {
    const enField = `${field}_en`;
    const gaField = `${field}_ga`;
    
    if (userLanguage === 'ga' && data[gaField]) {
      return data[gaField];
    }
    
    return data[enField] || data[gaField] || '';
  };

  const getBilingualContent = (data: any, field: string): BilingualContent | null => {
    const enField = `${field}_en`;
    const gaField = `${field}_ga`;
    
    if (data[enField] || data[gaField]) {
      return {
        en: data[enField] || '',
        ga: data[gaField] || ''
      };
    }
    
    return null;
  };

  return {
    getBilingualText,
    getBilingualContent,
    userLanguage
  };
}

// Utility function for parliamentary terms
export function getParliamentaryTermTranslation(
  term: string, 
  targetLanguage: 'en' | 'ga'
): string {
  const commonTerms: Record<string, { en: string; ga: string }> = {
    'dail': { en: 'Dáil', ga: 'Dáil' },
    'seanad': { en: 'Seanad', ga: 'Seanad' },
    'td': { en: 'TD', ga: 'Teachta Dála' },
    'minister': { en: 'Minister', ga: 'Aire' },
    'taoiseach': { en: 'Taoiseach', ga: 'Taoiseach' },
    'tánaiste': { en: 'Tánaiste', ga: 'Tánaiste' },
    'yes': { en: 'Yes', ga: 'Tá' },
    'no': { en: 'No', ga: 'Níl' },
    'abstain': { en: 'Abstain', ga: 'Staon' },
    'bill': { en: 'Bill', ga: 'Bille' },
    'act': { en: 'Act', ga: 'Acht' },
    'parliament': { en: 'Parliament', ga: 'Parlaimint' },
    'debate': { en: 'Debate', ga: 'Díospóireacht' },
    'committee': { en: 'Committee', ga: 'Coiste' },
    'motion': { en: 'Motion', ga: 'Rún' },
    'amendment': { en: 'Amendment', ga: 'Leasú' },
    'question': { en: 'Question', ga: 'Ceist' },
    'member': { en: 'Member', ga: 'Ball' },
    'constituency': { en: 'Constituency', ga: 'Toghcheantar' }
  };

  const normalizedTerm = term.toLowerCase();
  const termData = commonTerms[normalizedTerm];
  
  if (termData) {
    return termData[targetLanguage];
  }
  
  return term; // Return original if no translation found
}