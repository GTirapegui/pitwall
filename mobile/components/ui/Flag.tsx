import React from 'react';
import { Text, Image, Platform } from 'react-native';
import { CODE_TO_EMOJI } from '@/constants/flags';

interface FlagProps {
  code: string;   // ISO 3166-1 alpha-2 lowercase, e.g. "nl", "gb"
  size?: number;  // height in dp
}

export default function Flag({ code, size = 16 }: FlagProps) {
  if (Platform.OS === 'web') {
    return (
      <Image
        source={{ uri: `https://flagcdn.com/w40/${code}.png` }}
        style={{ width: size * 1.5, height: size }}
        resizeMode="contain"
        accessibilityLabel={code.toUpperCase()}
      />
    );
  }
  return (
    <Text style={{ fontSize: size, lineHeight: size * 1.25 }}>
      {CODE_TO_EMOJI[code] ?? '🏳️'}
    </Text>
  );
}
