import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatInTimeZone } from 'date-fns-tz';
import { TIMEZONES, TzOption } from '@/constants/timezones';

const KEY = 'user_timezone';

interface TimezoneCtx {
  tz: string;
  tzOption: TzOption | undefined;
  isLoaded: boolean;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
  setTz: (tz: string) => Promise<void>;
}

const Ctx = createContext<TimezoneCtx>({
  tz: 'Europe/London',
  tzOption: undefined,
  isLoaded: false,
  showPicker: false,
  setShowPicker: () => {},
  setTz: async () => {},
});

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [tz, setTzState] = useState('Europe/London');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(saved => {
      if (saved) {
        setTzState(saved);
      } else {
        // Detect device timezone and pre-select the closest match
        try {
          const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const match = TIMEZONES.find(t => t.tz === deviceTz);
          if (match) setTzState(match.tz);
        } catch { /* Intl not available */ }
        setShowPicker(true);
      }
      setIsLoaded(true);
    });
  }, []);

  const setTz = useCallback(async (newTz: string) => {
    setTzState(newTz);
    setShowPicker(false);
    await AsyncStorage.setItem(KEY, newTz);
  }, []);

  return (
    <Ctx.Provider value={{
      tz,
      tzOption: TIMEZONES.find(t => t.tz === tz),
      isLoaded,
      showPicker,
      setShowPicker,
      setTz,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTimezone(): TimezoneCtx {
  return useContext(Ctx);
}

// Utility: format a UTC ISO string in the user's timezone
// fmt uses date-fns format tokens
export function formatInTz(
  isoString: string,
  tz: string,
  fmt = 'EEE dd MMM · HH:mm',
): string {
  try {
    return formatInTimeZone(new Date(isoString), tz, fmt);
  } catch {
    return isoString;
  }
}

// Returns "yyyy-MM-dd" local date string for a given UTC ISO string in a timezone
export function localDateStr(isoString: string, tz: string): string {
  return formatInTz(isoString, tz, 'yyyy-MM-dd');
}
