import React, { createContext, useContext, useCallback } from 'react';
import { useTimezone } from '@/hooks/useTimezone';
import { LOCALES, getLocaleFromTimezone } from '@/locales';

interface I18nCtx {
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
}

const Ctx = createContext<I18nCtx>({
  t: (key) => key,
  locale: 'en',
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { tz } = useTimezone();
  const locale = getLocaleFromTimezone(tz);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const keys = key.split('.');
      // Try current locale first, fall back to English
      let value: any = LOCALES[locale] ?? LOCALES['en'];
      for (const k of keys) value = value?.[k];

      if (typeof value !== 'string' && locale !== 'en') {
        value = LOCALES['en'];
        for (const k of keys) value = value?.[k];
      }
      if (typeof value !== 'string') return key;

      if (!vars) return value;
      return Object.entries(vars).reduce(
        (str, [k, v]) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
        value
      );
    },
    [locale]
  );

  return <Ctx.Provider value={{ t, locale }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  return useContext(Ctx);
}
