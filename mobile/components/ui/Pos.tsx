import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface PosProps {
  position: number;
  size?: number;
}

export default function Pos({ position, size = 14 }: PosProps) {
  const C = useColors();
  const label = String(position).padStart(2, '0');
  const isFirst = position === 1;

  return (
    <Text style={[styles.text, { fontSize: size, color: isFirst ? C.gold : C.textSecondary }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'DMMono_400Regular',
    textAlign: 'right',
    minWidth: 24,
  },
});
