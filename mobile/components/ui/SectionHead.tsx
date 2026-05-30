import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface SectionHeadProps {
  label: string;
  trailing?: string;
  accent?: boolean;
}

export default function SectionHead({ label, trailing, accent = false }: SectionHeadProps) {
  const C = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[styles.label, { color: accent ? C.accent : C.textSecondary }]}>
          {label.toUpperCase()}
        </Text>
        <View style={[styles.line, { backgroundColor: C.sep }]} />
      </View>
      {trailing && (
        <Text style={[styles.trailing, { color: C.textSecondary }]}>{trailing}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    gap: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  label: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
    letterSpacing: 1.2,
    flexShrink: 0,
  },
  line: {
    height: 1,
    flex: 1,
  },
  trailing: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
