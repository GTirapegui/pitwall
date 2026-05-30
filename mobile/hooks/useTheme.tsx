import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';

type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {} });

const KEY = 'pitwall_theme';

function readSaved(): Theme {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const v = localStorage.getItem(KEY);
    if (v === 'dark' || v === 'light') return v;
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readSaved());

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, next);
    }
  }

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}
