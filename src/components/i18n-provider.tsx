import i18n from '@/lib/i18n';
import { type ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useLocalStorage } from 'usehooks-ts';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language] = useLocalStorage('language', 'en');

  useEffect(() => {
    // Update the i18n language when the stored language changes
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
