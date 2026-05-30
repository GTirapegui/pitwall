import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions,
} from 'react-native';

const TOOLTIP_W = 200;
const ICON_W    = 16;
const MARGIN    = 12;

interface TooltipProps {
  title: string;
  text:  string;
}

export default function Tooltip({ title, text }: TooltipProps) {
  const { width: SW } = useWindowDimensions();
  const [visible,     setVisible]     = useState(false);
  // Default: center tooltip on icon. Adjusted after measure fires.
  const [tooltipLeft, setTooltipLeft] = useState(-(TOOLTIP_W / 2) + (ICON_W / 2));
  const iconRef = useRef<any>(null);
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const show = () => {
    setVisible(true);
    if (Platform.OS !== 'web') {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), 3000);
    }
  };

  const hide = () => {
    setVisible(false);
    if (timer.current) clearTimeout(timer.current);
  };

  const handlePress = () => {
    if (visible) { hide(); return; }

    // Measure icon's absolute screen position to clamp tooltip within viewport
    iconRef.current?.measure(
      (_fx: number, _fy: number, _w: number, _h: number, px: number, _py: number) => {
        let left = -(TOOLTIP_W / 2) + (ICON_W / 2); // center on icon

        // Clamp right edge
        const rightEdge = px + left + TOOLTIP_W;
        if (rightEdge > SW - MARGIN) {
          left -= rightEdge - SW + MARGIN;
        }

        // Clamp left edge
        if (px + left < MARGIN) {
          left = -px + MARGIN;
        }

        setTooltipLeft(left);
      }
    );

    // Show immediately — position will update when measure callback fires
    show();
  };

  const webHoverProps: any = Platform.OS === 'web'
    ? { onMouseEnter: () => { if (!visible) handlePress(); }, onMouseLeave: hide }
    : {};

  // Arrow always points to icon center regardless of tooltip clamping
  const arrowLeft = Math.max(8, Math.min(
    -tooltipLeft + ICON_W / 2 - 6,   // 6 = half of 12px arrow square
    TOOLTIP_W - 20                     // don't let arrow fall off right edge
  ));

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        ref={iconRef}
        onPress={handlePress}
        style={[s.icon, visible && s.iconActive]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
        {...webHoverProps}
      >
        <Text style={[s.q, visible && s.qActive]}>?</Text>
      </TouchableOpacity>

      {visible && (
        <View style={[s.popover, { left: tooltipLeft }]}>
          <View style={[s.arrow, { left: arrowLeft }]} />
          <View style={s.header}>
            <Text style={s.hIcon}>ⓘ</Text>
            <Text style={s.hTitle}>{title.toUpperCase()}</Text>
          </View>
          <View style={s.sep} />
          <Text style={s.body}>{text}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'relative',
    marginLeft: 5,
    zIndex: 200,
  },

  icon: {
    width: ICON_W, height: ICON_W, borderRadius: ICON_W / 2,
    backgroundColor: 'rgba(20,20,28,.08)',
    borderWidth: 1, borderColor: 'rgba(20,20,28,.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: 'rgba(225,6,0,.15)',
    borderColor: '#E10600',
  },
  q: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9, color: '#76757F',
    includeFontPadding: false,
  },
  qActive: { color: '#E10600' },

  popover: {
    position: 'absolute',
    bottom: 26,
    width: TOOLTIP_W,
    backgroundColor: '#16161C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.12)',
    padding: 12,
    paddingHorizontal: 14,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },

  arrow: {
    position: 'absolute',
    bottom: -6,
    width: 12, height: 12,
    backgroundColor: '#16161C',
    borderBottomWidth: 1, borderRightWidth: 1,
    borderBottomColor: 'rgba(255,255,255,.12)',
    borderRightColor:  'rgba(255,255,255,.12)',
    transform: [{ rotate: '45deg' }],
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hIcon:  { fontSize: 13, color: '#E10600', includeFontPadding: false },
  hTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9, fontWeight: '700',
    letterSpacing: 9 * 0.14,
    color: '#F3F1EA', flex: 1,
  },

  sep: {
    height: 1, backgroundColor: '#E10600',
    opacity: 0.4, marginTop: 8, marginBottom: 8,
  },

  body: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10, color: 'rgba(243,241,234,.7)',
    lineHeight: 16,
  },
});
