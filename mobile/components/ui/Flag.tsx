import React from 'react';
import { Image } from 'react-native';

interface FlagProps {
  code: string;   // ISO 3166-1 alpha-2 lowercase, e.g. "nl", "gb"
  size?: number;  // height in dp
}

export default function Flag({ code, size = 16 }: FlagProps) {
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w40/${code}.png` }}
      style={{ width: size * 1.5, height: size }}
      resizeMode="contain"
      accessibilityLabel={code.toUpperCase()}
    />
  );
}
