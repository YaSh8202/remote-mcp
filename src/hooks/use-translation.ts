import { useTranslation as useReactI18nextTranslation } from 'react-i18next';

export function useTranslation(namespace?: string | string[]) {
  return useReactI18nextTranslation(namespace);
}

// Convenience hooks for specific namespaces
export function useCommonTranslation() {
  return useTranslation('common');
}

export function useSettingsTranslation() {
  return useTranslation('settings');
}
