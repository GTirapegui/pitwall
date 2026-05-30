import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBar from '@/components/ui/TopBar';
import BottomNav, { TabName } from '@/components/ui/BottomNav';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/hooks/useTheme';

export default function TabsLayout() {
  const router  = useRouter();
  const path    = usePathname();
  const insets  = useSafeAreaInsets();
  const { toggle } = useTheme();
  const C = useColors();

  function getActive(): TabName {
    if (path.includes('calendar'))  return 'CALENDAR';
    if (path.includes('standings')) return 'STANDINGS';
    if (path.includes('results'))   return 'RESULTS';
    if (path.includes('live'))      return 'LIVE';
    return 'HOME';
  }

  function handleTab(tab: TabName) {
    const routes: Record<TabName, string> = {
      HOME:      '/',
      CALENDAR:  '/calendar',
      STANDINGS: '/standings',
      RESULTS:   '/results',
      LIVE:      '/live',
    };
    router.replace(routes[tab] as any);
  }

  return (
    <View style={[s.root, { backgroundColor: C.paper }]}>
      <View style={[s.topWrap, { paddingTop: insets.top }]}>
        <TopBar year={new Date().getFullYear()} onToggleTheme={toggle} />
      </View>
      <View style={s.content}>
        <Slot />
      </View>
      <View style={[s.navWrap, { paddingBottom: insets.bottom }]}>
        <BottomNav active={getActive()} onPress={handleTab} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  topWrap: {},
  content: { flex: 1 },
  navWrap: {},
});
