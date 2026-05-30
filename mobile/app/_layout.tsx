import React, { useEffect } from 'react';
import { SWRConfig } from 'swr';
import { SWR_GLOBAL } from '@/hooks/useSWRConfig';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold,
  Archivo_700Bold, Archivo_800ExtraBold, Archivo_900Black,
} from '@expo-google-fonts/archivo';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { BarlowCondensed_700Bold, BarlowCondensed_400Regular } from '@expo-google-fonts/barlow-condensed';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { Barlow_400Regular } from '@expo-google-fonts/barlow';
import { Dark, Light } from '@/constants/colors';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { TimezoneProvider } from '@/hooks/useTimezone';
import { I18nProvider } from '@/context/I18nContext';
import TimezoneModal from '@/components/ui/TimezoneModal';

// Archivo variable font URL — all weights in one file (woff2)
const ARCHIVO_URL = 'https://fonts.gstatic.com/s/archivo/v25/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sLydOxI.woff2';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const STYLE_ID = 'pitwall-web-fonts';
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      /* ── Archivo variable font (all weights 100–900) ── */
      @font-face{font-family:'Archivo';font-style:normal;font-weight:100 900;font-display:swap;
        src:url(${ARCHIVO_URL}) format('woff2');}
      /* Named weight aliases for React Native Web fontFamily strings */
      @font-face{font-family:'Archivo_400Regular';font-style:normal;font-weight:400;font-display:swap;
        src:url(${ARCHIVO_URL}) format('woff2');}
      @font-face{font-family:'Archivo_500Medium';font-style:normal;font-weight:500;font-display:swap;
        src:url(${ARCHIVO_URL}) format('woff2');}
      @font-face{font-family:'Archivo_600SemiBold';font-style:normal;font-weight:600;font-display:swap;
        src:url(${ARCHIVO_URL}) format('woff2');}
      @font-face{font-family:'Archivo_700Bold';font-style:normal;font-weight:700;font-display:swap;
        src:url(${ARCHIVO_URL}) format('woff2');}
      @font-face{font-family:'Archivo_800ExtraBold';font-style:normal;font-weight:800;font-display:swap;
        src:url(${ARCHIVO_URL}) format('woff2');}
      @font-face{font-family:'Archivo_900Black';font-style:normal;font-weight:900;font-display:swap;
        src:url(${ARCHIVO_URL}) format('woff2');}

      /* ── Space Mono ── */
      @font-face{font-family:'SpaceMono_400Regular';font-style:normal;font-weight:400;font-display:swap;
        src:url(https://fonts.gstatic.com/s/spacemono/v17/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff2) format('woff2');}
      @font-face{font-family:'SpaceMono_700Bold';font-style:normal;font-weight:700;font-display:swap;
        src:url(https://fonts.gstatic.com/s/spacemono/v17/i7dMIFZifjKcF5UAWdDRaPpZUFWaHg.woff2) format('woff2');}

      /* ── Legacy fonts (keep until migration complete) ── */
      @font-face{font-family:'BarlowCondensed_700Bold';font-style:normal;font-weight:700;font-display:swap;
        src:url(https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuQ.woff2) format('woff2');}
      @font-face{font-family:'BarlowCondensed_400Regular';font-style:normal;font-weight:400;font-display:swap;
        src:url(https://fonts.gstatic.com/s/barlowcondensed/v13/HTx3L3I-JCGChYJ8VI-L6OO_au7B6xHT2g.woff2) format('woff2');}
      @font-face{font-family:'Barlow_400Regular';font-style:normal;font-weight:400;font-display:swap;
        src:url(https://fonts.gstatic.com/s/barlow/v13/7cHpv4kjgoGqM7E_DMs5.woff2) format('woff2');}
      @font-face{font-family:'DMMono_400Regular';font-style:normal;font-weight:400;font-display:swap;
        src:url(https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBA.woff2) format('woff2');}
      @font-face{font-family:'DMMono_500Medium';font-style:normal;font-weight:500;font-display:swap;
        src:url(https://fonts.gstatic.com/s/dmmono/v16/aFTR7PB1QTsUX8KYvumzEYOtbQ.woff2) format('woff2');}

      /* ── Global resets matching spec ── */
      *{box-sizing:border-box}
      body{font-family:'Archivo',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
    `;
    document.head.appendChild(s);
  }
}

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  return (
    <SWRConfig value={SWR_GLOBAL}>
      <ThemeProvider>
        <TimezoneProvider>
          <I18nProvider>
            <RootLayoutInner />
          </I18nProvider>
        </TimezoneProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}

function RootLayoutInner() {
  const { theme } = useTheme();
  const C = theme === 'dark' ? Dark : Light;

  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    BarlowCondensed_700Bold,
    BarlowCondensed_400Regular,
    DMMono_400Regular,
    DMMono_500Medium,
    Barlow_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded && Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {});
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    }
  }, [fontsLoaded, theme]);

  if (!fontsLoaded && Platform.OS !== 'web') return null;

  return (
    <SafeAreaProvider>
      <TimezoneModal isFirstUse />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.paper },
          animation: 'none',
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
