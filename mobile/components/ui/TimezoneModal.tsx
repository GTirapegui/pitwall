import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTimezone } from '@/hooks/useTimezone';
import { useI18n } from '@/context/I18nContext';
import { TIMEZONES, TzOption } from '@/constants/timezones';
import Flag from '@/components/ui/Flag';

interface Props {
  isFirstUse?: boolean;
}

export default function TimezoneModal({ isFirstUse = false }: Props) {
  const C = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { tz, showPicker, setShowPicker, setTz } = useTimezone();
  const [selected, setSelected] = useState(tz);

  const REGION_LABELS: Record<TzOption['region'], string> = {
    'Americas':    t('timezone.regions.americas'),
    'Europe':      t('timezone.regions.europe'),
    'Asia/Pacific':t('timezone.regions.asiaPacific'),
  };

  const scrollRef = useRef<ScrollView>(null);
  const regionYPositions = useRef<Map<string, number>>(new Map());
  const itemYPositions = useRef<Map<string, number>>(new Map());

  // Sync selected to current tz when modal opens
  useEffect(() => {
    if (showPicker) {
      setSelected(tz);
    }
  }, [showPicker, tz]);

  // Auto-scroll to selected item when modal opens
  useEffect(() => {
    if (!showPicker) return;
    const timer = setTimeout(() => {
      const selectedOption = TIMEZONES.find(t => t.tz === tz);
      if (!selectedOption) return;
      const regionY = regionYPositions.current.get(selectedOption.region) ?? 0;
      const itemY = itemYPositions.current.get(tz) ?? 0;
      scrollRef.current?.scrollTo({ y: Math.max(0, regionY + itemY - 80), animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, [showPicker, tz]);

  if (!showPicker) return null;

  const regions: TzOption['region'][] = ['Americas', 'Europe', 'Asia/Pacific'];

  const confirm = () => setTz(selected);

  return (
    <Modal transparent animationType="slide" visible statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: C.surface, borderColor: C.sep }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: C.sep }]}>
            <View>
              <Text style={[styles.title, { color: C.textPrimary }]}>
                {isFirstUse ? t('timezone.title') : t('timezone.change')}
              </Text>
              <Text style={[styles.subtitle, { color: C.textSecondary }]}>
                {t('timezone.subtitle')}
              </Text>
            </View>
            {!isFirstUse && (
              <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.closeBtn}>
                <Text style={[styles.closeIcon, { color: C.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Options list */}
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {regions.map(region => (
              <View
                key={region}
                onLayout={(e) => { regionYPositions.current.set(region, e.nativeEvent.layout.y); }}
              >
                <Text style={[styles.regionLabel, { color: C.textSecondary }]}>
                  {REGION_LABELS[region]}
                </Text>
                {TIMEZONES.filter(t => t.region === region).map(opt => {
                  const isActive = opt.tz === selected;
                  return (
                    <TouchableOpacity
                      key={opt.tz}
                      onLayout={(e) => { itemYPositions.current.set(opt.tz, e.nativeEvent.layout.y); }}
                      style={[
                        styles.option,
                        { borderColor: C.sep },
                        isActive && { backgroundColor: C.raceRowBg, borderColor: C.accent },
                      ]}
                      onPress={() => setSelected(opt.tz)}
                      activeOpacity={0.7}
                    >
                      <Flag code={opt.code} size={18} />
                      <Text style={[styles.optionLabel, { color: isActive ? C.textPrimary : C.textSecondary }]}>
                        {opt.label}
                      </Text>
                      {isActive && (
                        <View style={[styles.dot, { backgroundColor: C.accent }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Confirm */}
          <View style={[styles.footer, { borderTopColor: C.sep, paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: C.accent }]}
              onPress={confirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>{t('timezone.confirm')}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 22,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  closeBtn: { padding: 4 },
  closeIcon: { fontSize: 16, fontFamily: 'DMMono_400Regular' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 4 },

  regionLabel: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 9,
    letterSpacing: 1.4,
    marginTop: 12,
    marginBottom: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 4,
  },
  optionLabel: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  footer: {
    padding: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  confirmBtn: {
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 14,
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
});
