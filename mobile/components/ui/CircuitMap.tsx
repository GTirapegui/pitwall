import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
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
  const [svgXml,  setSvgXml]  = useState<string | null>(null);

  useEffect(() => {
    if (!circuitKey) { setLoading(false); return; }

    setLoading(true);
    setError(false);
    setSvgXml(null);

    fetch(`${API_URL}/api/circuit-map/${circuitKey}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(text => {
        setSvgXml(text);
        setLoading(false);
      })
      .catch(err => {
        console.warn('[CircuitMap] fetch failed:', circuitKey, err.message);
        setLoading(false);
        setError(true);
      });
  }, [circuitKey]);

  const containerStyle = [
    s.container,
    { height, backgroundColor: C.surface2, borderColor: C.line },
  ];

  if (!circuitKey || error) {
    return (
      <View style={containerStyle}>
        <Text style={[s.placeholder, { color: C.muted }]}>🗺 TRAZADO DEL CIRCUITO</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {loading && <ActivityIndicator size="small" color={C.muted} />}

      {/* Web: browser renders SVG via <img> natively */}
      {Platform.OS === 'web' && !loading && svgXml && (
        <Image
          source={{ uri: `${API_URL}/api/circuit-map/${circuitKey}` }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
          resizeMode="contain"
        />
      )}

      {/* Native: react-native-svg renders the SVG markup directly */}
      {Platform.OS !== 'web' && !loading && svgXml && (
        <SvgXml
          xml={svgXml}
          width="100%"
          height={height}
        />
      )}
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
  placeholder: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
