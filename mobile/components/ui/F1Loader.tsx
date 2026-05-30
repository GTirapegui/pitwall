import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Dark, Light } from '@/constants/colors';

const ND = Platform.OS !== 'web';

interface Props {
  label?:   string;
  compact?: boolean;  // small inline variant — no wordmark, smaller grid
}

export default function F1Loader({ label, compact = false }: Props) {
  const { theme } = useTheme();
  const C = theme === 'dark' ? Dark : Light;

  // Grid dimensions vary by mode
  const COLS = compact ? 8 : 8;
  const ROWS = compact ? 2 : 4;
  const CELL = compact ? 28 : 36;

  const STAGGER     = compact ? 28 : 38;
  const ENTER_DUR   = compact ? 180 : 220;
  const TOTAL_DIAG  = COLS + ROWS - 1;
  const ENTRANCE_END = TOTAL_DIAG * STAGGER + ENTER_DUR;

  // Per-cell animated values (opacity + translateY)
  const cellAnims = useRef(
    Array.from({ length: COLS * ROWS }, () => ({
      opacity:    new Animated.Value(0),
      translateY: new Animated.Value(10),
    }))
  ).current;

  // Grid-level breathe after entrance
  const breath = useRef(new Animated.Value(1)).current;

  // Red stripe that sweeps across the grid
  const stripe = useRef(new Animated.Value(0)).current;

  // Wordmark + label
  const wordFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── Phase 1: diagonal wave entrance ─────────────────────────────────────
    const cellEntrance = cellAnims.map((anim, idx) => {
      const col  = idx % COLS;
      const row  = Math.floor(idx / COLS);
      const diag = col + row;
      const delay = diag * STAGGER;
      return Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1, duration: ENTER_DUR, delay, useNativeDriver: ND,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0, duration: ENTER_DUR, delay, useNativeDriver: ND,
        }),
      ]);
    });

    // Red stripe sweep right after entrance
    const stripeSweep = Animated.sequence([
      Animated.delay(ENTRANCE_END - 80),
      Animated.timing(stripe, {
        toValue: 1, duration: 420, useNativeDriver: ND,
      }),
    ]);

    // Wordmark fades in as stripe completes
    const wordAnim = Animated.timing(wordFade, {
      toValue: 1, duration: 300,
      delay: ENTRANCE_END + 60,
      useNativeDriver: ND,
    });

    // Run entrance phase
    Animated.parallel([...cellEntrance, stripeSweep, wordAnim]).start(() => {
      // ── Phase 2: gentle breathe loop ──────────────────────────────────────
      Animated.loop(
        Animated.sequence([
          Animated.timing(breath, {
            toValue: 0.96, duration: 1300, useNativeDriver: ND,
          }),
          Animated.timing(breath, {
            toValue: 1.0,  duration: 1300, useNativeDriver: ND,
          }),
        ])
      ).start();
    });
  }, []);

  // ── Cell colors (always classic black & white for flag fidelity) ──────────
  const WHITE_CELL = '#F3F1EA';
  const BLACK_CELL = theme === 'dark' ? '#0D0D11' : '#16161C';

  // Stripe translates from fully left to fully right
  const stripeTranslate = stripe.interpolate({
    inputRange:  [0, 1],
    outputRange: [-COLS * CELL, COLS * CELL],
  });

  return (
    <View style={[s.container, { backgroundColor: C.paper }]}>

      {/* Checkered flag grid */}
      <Animated.View style={[
        s.grid,
        { width: COLS * CELL, height: ROWS * CELL, transform: [{ scale: breath }] },
      ]}>
        {Array.from({ length: ROWS * COLS }, (_, idx) => {
          const col     = idx % COLS;
          const row     = Math.floor(idx / COLS);
          const isWhite = (col + row) % 2 === 0;
          const { opacity, translateY } = cellAnims[idx];
          return (
            <Animated.View
              key={idx}
              style={[
                { width: CELL, height: CELL },
                {
                  backgroundColor: isWhite ? WHITE_CELL : BLACK_CELL,
                  opacity,
                  transform: [{ translateY }],
                },
              ]}
            />
          );
        })}

        {/* Red stripe overlay */}
        <Animated.View
          style={[
            s.stripe,
            { width: CELL * 1.5, transform: [{ translateX: stripeTranslate }] },
          ]}
          pointerEvents="none"
        />
      </Animated.View>

      {/* Red finish line */}
      <View style={[s.finishLine, { width: COLS * CELL }]} />

      {/* Wordmark + label — only in full mode */}
      {!compact && (
        <>
          <Animated.View style={[s.wordRow, { opacity: wordFade }]}>
            <View style={[s.redBar, { backgroundColor: C.red }]} />
            <Text style={[s.wordmark, { color: C.ink }]}>PITWALL</Text>
          </Animated.View>
          {label !== undefined && (
            <Animated.Text style={[s.label, { color: C.muted, opacity: wordFade }]}>
              {label}
            </Animated.Text>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Checkerboard grid (width/height set inline via COLS*CELL) ────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    borderRadius: 4,
  },

  // Red accent stripe (translucent, sweeps across)
  stripe: {
    position: 'absolute',
    top: 0, bottom: 0,
    left: 0,
    backgroundColor: 'rgba(225,6,0,0.25)',
  },

  // Thick red line below the flag (finish line)
  finishLine: {
    width: GRID_W,
    height: 4,
    backgroundColor: '#E10600',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginBottom: 28,
  },

  // Wordmark row
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  redBar: {
    width: 4,
    height: 22,
    borderRadius: 1,
  },
  wordmark: {
    fontFamily: 'Archivo_900Black',
    fontSize: 22,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Optional loading label
  label: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: 14,
    textTransform: 'uppercase',
  },
});
