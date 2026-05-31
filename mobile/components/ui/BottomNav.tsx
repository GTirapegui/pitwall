/**
 * BottomNav — floating pill, exact SVG icons, live status polling
 * Spec: design_handoff_pitwall HTML references
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform, Alert,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { useI18n } from '@/context/I18nContext';

export type TabName = 'HOME' | 'CALENDAR' | 'STANDINGS' | 'RESULTS' | 'LIVE';

const SMB = 'SpaceMono_700Bold';
const SM  = 'SpaceMono_400Regular';

// ── SVG icons — exact paths from HTML reference ───────────────────────────────
function IconHome({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 15a8 8 0 0 1 16 0" />
      <Path d="M12 15l4.2-4.6" />
      <Circle cx={12} cy={15} r={1.4} fill={color} stroke="none" />
      <Path d="M3 19h18" />
    </Svg>
  );
}
function IconCalendar({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3.5} y={5} width={17} height={15.5} rx={2.5} />
      <Path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      <Circle cx={8}  cy={13.5} r={1} fill={color} stroke="none" />
      <Circle cx={12} cy={13.5} r={1} fill={color} stroke="none" />
      <Circle cx={16} cy={13.5} r={1} fill={color} stroke="none" />
    </Svg>
  );
}
function IconStandings({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 20V11M12 20V4M19 20v-6" />
      <Path d="M3 20h18" />
    </Svg>
  );
}
function IconResults({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 4h10v3a5 5 0 0 1-10 0z" />
      <Path d="M7 5H4.5v1.5A2.5 2.5 0 0 0 7 9" />
      <Path d="M17 5h2.5v1.5A2.5 2.5 0 0 1 17 9" />
      <Path d="M12 12v3M9 20h6M10 20l.5-3h3l.5 3" />
    </Svg>
  );
}
function IconLive({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={2.2} fill={color} stroke="none" />
      <Path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
      <Path d="M5 5a9.5 9.5 0 0 0 0 14M19 5a9.5 9.5 0 0 1 0 14" />
    </Svg>
  );
}

const ICONS: Record<TabName, React.ComponentType<{ color: string }>> = {
  HOME: IconHome, CALENDAR: IconCalendar, STANDINGS: IconStandings,
  RESULTS: IconResults, LIVE: IconLive,
};
// Labels built dynamically inside the component via useI18n()
const TABS: TabName[] = ['HOME', 'CALENDAR', 'STANDINGS', 'RESULTS', 'LIVE'];

// ── Live pip (pulsing red dot) ────────────────────────────────────────────────
function LivePip() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
    ])).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return <Animated.View style={[s.livePip, { opacity }]} />;
}

// ── Web tooltip ───────────────────────────────────────────────────────────────
function WebTooltip({ visible, onHide }: { visible: boolean; onHide: () => void }) {
  const C = useColors();
  const { t } = useI18n();
  useEffect(() => {
    if (visible) { const timer = setTimeout(onHide, 2000); return () => clearTimeout(timer); }
  }, [visible]);
  if (!visible) return null;
  return (
    <View style={[s.tooltip, { backgroundColor: C.surface2, borderColor: C.line }]}>
      <Text style={[s.tooltipTxt, { color: C.muted }]}>{t('live.noSession')}</Text>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { active: TabName; onPress: (t: TabName) => void }

export default function BottomNav({ active, onPress }: Props) {
  const C = useColors();
  const { t } = useI18n();
  const { isLive } = useLiveStatus();
  const [showTooltip, setShowTooltip] = useState(false);

  const LABELS: Record<TabName, string> = {
    HOME: t('nav.home'), CALENDAR: t('nav.calendar'), STANDINGS: t('nav.standings'),
    RESULTS: t('nav.results'), LIVE: t('nav.live'),
  };

  const handlePress = (tab: TabName) => {
    if (tab === 'LIVE' && !isLive) {
      if (Platform.OS === 'web') {
        setShowTooltip(true);
      } else {
        Alert.alert(t('nav.live'), t('live.noSession'), [{ text: 'OK' }]);
      }
      return;
    }
    onPress(tab);
  };

  return (
    <View style={s.wrapper}>
      {/* Web tooltip for inactive EN VIVO */}
      {Platform.OS === 'web' && (
        <WebTooltip visible={showTooltip} onHide={() => setShowTooltip(false)} />
      )}

      <View style={[s.pill, {
        backgroundColor: C.surface, borderColor: C.line,
        ...(Platform.OS === 'web' ? {
          backdropFilter: 'blur(18px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
          boxShadow: '0 18px 40px -18px rgba(0,0,0,.45),0 2px 0 rgba(255,255,255,.04) inset',
        } as any : {
          shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 }, elevation: 12,
        }),
      }]}>
        {TABS.map(tab => {
          const isActive  = tab === active;
          const isLiveTab = tab === 'LIVE';
          // Live tab is muted when not live, even if "active" somehow
          const iconColor = isLiveTab
            ? (isLive ? C.red : C.muted)
            : (isActive ? C.red : C.muted);
          const TabIcon = ICONS[tab];

          return (
            <TouchableOpacity
              key={tab}
              style={s.item}
              onPress={() => handlePress(tab)}
              activeOpacity={0.7}
            >
              {/* Active indicator bar */}
              {isActive && !isLiveTab && (
                <View style={[s.indicator, { backgroundColor: C.red },
                  Platform.OS === 'web'
                    ? { boxShadow: '0 0 10px #E10600' } as any
                    : { shadowColor: C.red, shadowOpacity: 0.7, shadowRadius: 5, shadowOffset: { width: 0, height: 1 } },
                ]} />
              )}
              {isActive && isLiveTab && isLive && (
                <View style={[s.indicator, { backgroundColor: C.red },
                  Platform.OS === 'web'
                    ? { boxShadow: '0 0 10px #E10600' } as any
                    : { shadowColor: C.red, shadowOpacity: 0.7, shadowRadius: 5, shadowOffset: { width: 0, height: 1 } },
                ]} />
              )}

              {/* Icon + live pip */}
              <View style={{ position: 'relative' }}>
                <TabIcon color={iconColor} />
                {isLiveTab && isLive && <LivePip />}
              </View>

              {/* Label */}
              <Text
                style={[s.label, { color: iconColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {LABELS[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:   { paddingHorizontal: 10, paddingBottom: 12, alignItems: 'center', position: 'relative' },
  pill:      { width: '100%', maxWidth: 520, flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  item:      { flex: 1, alignItems: 'center', paddingTop: 13, paddingBottom: 12, gap: 6, position: 'relative' },
  indicator: { position: 'absolute', top: 0, width: 24, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  label:     { fontFamily: SMB, fontSize: 8.5, letterSpacing: 0.5 },
  livePip:   { position: 'absolute', top: 0, right: -2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#E10600' },
  // Tooltip
  tooltip:   { position: 'absolute', bottom: '100%', alignSelf: 'center',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  tooltipTxt:{ fontFamily: SMB, fontSize: 9, letterSpacing: 1.2 },
});
