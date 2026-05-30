import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface CircuitMapProps {
  circuitKey: string;
  height?: number;
}

export default function CircuitMap({ circuitKey, height = 170 }: CircuitMapProps) {
  const C = useColors();
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const containerStyle = [
    s.container,
    { height, backgroundColor: C.surface2, borderColor: C.line },
  ];

  // Empty key means no circuit data — show placeholder immediately
  if (!circuitKey) {
    return (
      <View style={containerStyle}>
        <Text style={[s.placeholderText, { color: C.muted }]}>🗺 TRAZADO DEL CIRCUITO</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={containerStyle}>
        <Text style={[s.placeholderText, { color: C.muted }]}>🗺 TRAZADO DEL CIRCUITO</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {loading && <ActivityIndicator size="small" color={C.muted} />}
      <Image
        source={{ uri: `${API_URL}/api/circuit-map/${circuitKey}` }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
        resizeMode="contain"
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
