import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

type BadgeVariant = 'accent' | 'gold' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export default function Badge({ label, variant = 'outline' }: BadgeProps) {
  const C = useColors();

  const containerStyle = [
    styles.container,
    variant === 'accent' && { backgroundColor: C.accent, borderColor: C.accent },
    variant === 'gold' && { backgroundColor: 'transparent', borderColor: C.gold },
    variant === 'outline' && { backgroundColor: 'transparent', borderColor: C.sep },
  ];

  const textStyle = [
    styles.text,
    variant === 'accent' && { color: '#FFFFFF' },
    variant === 'gold' && { color: C.gold },
    variant === 'outline' && { color: C.textSecondary },
  ];

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  text: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
});
