import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface CountdownProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: string): TimeLeft {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function Cell({ value, label }: { value: number; label: string }) {
  const C = useColors();
  const display = String(value).padStart(2, '0');

  return (
    <View style={styles.cell}>
      <View style={[styles.ghostBg, { backgroundColor: C.sep }]}>
        <Text style={[styles.number, { color: C.textPrimary }]}>{display}</Text>
      </View>
      <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(targetDate));

  useEffect(() => {
    setTime(calcTimeLeft(targetDate));
    const id = setInterval(() => setTime(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <View style={styles.container}>
      <Cell value={time.days} label="DÍAS" />
      <Text style={styles.sep}>:</Text>
      <Cell value={time.hours} label="HRS" />
      <Text style={styles.sep}>:</Text>
      <Cell value={time.minutes} label="MIN" />
      <Text style={styles.sep}>:</Text>
      <Cell value={time.seconds} label="SEG" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  cell: {
    alignItems: 'center',
    gap: 4,
  },
  ghostBg: {
    opacity: 1,
    position: 'relative',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  number: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 38,
    lineHeight: 44,
  },
  label: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 9,
    letterSpacing: 1.2,
  },
  sep: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 28,
    color: '#8A8A8E',
    marginBottom: 18,
  },
});
