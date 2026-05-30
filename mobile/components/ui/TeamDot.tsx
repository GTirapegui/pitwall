import React from 'react';
import { View, StyleSheet } from 'react-native';

interface TeamDotProps {
  color: string;
}

export default function TeamDot({ color }: TeamDotProps) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 3,
    height: 14,
    borderRadius: 0,
  },
});
