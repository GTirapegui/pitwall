import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform, StyleSheet } from 'react-native';
import { useSWRConfig } from 'swr';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/hooks/useTheme';
import { useTimezone } from '@/hooks/useTimezone';

interface TopBarProps {
  year?: number;
  onToggleTheme?: () => void;
}

function SyncIndicator({ isRevalidating, hasError }: { isRevalidating: boolean; hasError: boolean }) {
  const C = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRevalidating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
        ])
      ).start();
    } else {
      anim.stopAnimation();
      anim.setValue(0);
    }
  }, [isRevalidating]);

  if (!isRevalidating && !hasError) return null;

  const dotColor = hasError ? '#E10600' : C.muted;
  const opacity  = isRevalidating
    ? anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })
    : 1;

  return (
    <Animated.View style={[styles.syncDot, { backgroundColor: dotColor, opacity }]} />
  );
}

// ── Main TopBar ───────────────────────────────────────────────────────────────
export default function TopBar({ year = 2026, onToggleTheme }: TopBarProps) {
  const C = useColors();
  const { theme } = useTheme();
  const { tzOption, setShowPicker } = useTimezone();
  const [hovered, setHovered] = React.useState(false);

  const { cache } = useSWRConfig();
  const [isRevalidating, setIsRevalidating] = React.useState(false);
  const [hasError,       setHasError]       = React.useState(false);

  useEffect(() => {
    const c = cache as any;
    if (typeof c?.subscribe !== 'function') return;
    const unsub = c.subscribe(() => {
      let revalidating = false;
      let error = false;
      try {
        for (const [, state] of c) {
          if (state?.isValidating) revalidating = true;
          if (state?.error)        error        = true;
        }
      } catch { /* cache not iterable in all envs */ }
      setIsRevalidating(revalidating);
      setHasError(error);
    });
    return () => unsub?.();
  }, [cache]);

  const bgStyle: any = Platform.OS === 'web'
    ? {
        backdropFilter: 'blur(14px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
      }
    : {};

  const webHoverProps: any = Platform.OS === 'web' ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return (
    <View style={[styles.container, { backgroundColor: C.paper }, bgStyle]}>
      <View style={styles.left}>
        <View style={[styles.redBar, { backgroundColor: C.red }]} />
        <Text style={[styles.wordmark, { color: C.ink }]}>PITWALL</Text>
      </View>
      <View style={styles.right}>
        <SyncIndicator isRevalidating={isRevalidating} hasError={hasError} />

        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          activeOpacity={0.75}
          style={[
            styles.tzBtn,
            {
              backgroundColor: C.surface,
              borderColor: hovered ? C.ink2 : C.line,
            },
            hovered && { transform: [{ translateY: -1 }] },
            Platform.OS === 'web' && ({ transition: 'border-color .2s, transform .2s' } as any),
          ]}
          {...webHoverProps}
        >
          <Text style={[styles.tzPin, { color: C.muted }]}>📍</Text>
          {tzOption && (
            <Text style={[styles.tzLabel, { color: C.muted }]}>
              {tzOption.label.toUpperCase()}
            </Text>
          )}
          <Text style={[styles.tzYear, { color: C.gold }]}>{year}</Text>
          <Text style={[styles.tzChevron, { color: C.muted }]}>▾</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onToggleTheme} style={styles.themeBtn}>
          <Text style={[styles.themeIcon, { color: C.muted }]}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, paddingTop: 0,
  },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  redBar:{ width: 4, height: 22, borderRadius: 1 },
  wordmark: {
    fontSize: 20, fontFamily: 'Archivo_900Black',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  syncDot: { width: 6, height: 6, borderRadius: 3 },
  tzBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tzPin:    { fontSize: 10 },
  tzLabel:  { fontFamily: 'SpaceMono_400Regular', fontSize: 9, letterSpacing: 1.0 },
  tzYear:   { fontFamily: 'SpaceMono_400Regular', fontSize: 9 },
  tzChevron:{ fontFamily: 'SpaceMono_400Regular', fontSize: 9 },
  themeBtn: { padding: 4 },
  themeIcon:{ fontSize: 16 },
});
