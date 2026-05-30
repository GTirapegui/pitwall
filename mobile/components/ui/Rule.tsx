import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface RuleProps {
  accent?: boolean;
  style?: object;
}

export default function Rule({ accent = false, style }: RuleProps) {
  const C = useColors();
  return (
    <View
      style={[styles.rule, { backgroundColor: accent ? C.accent : C.sep }, style]}
    />
  );
}

const styles = StyleSheet.create({
  rule: {
    height: 1,
    width: '100%',
  },
});
