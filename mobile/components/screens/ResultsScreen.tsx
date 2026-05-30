/**
 * ResultsScreen — multi-round selector + podium + classification
 * Exact match: design_handoff_pitwall/Pitwall Resultados.html
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useSchedule } from '@/hooks/useSchedule';
import { DRIVER_CODES, getCountryCode } from '@/constants/flags';
import { TEAM } from '@/constants/colors';

// ── Fonts ────────────────────────────────────────────────────────────────────
const A9  = 'Archivo_900Black';
const A8  = 'Archivo_800ExtraBold';
const A7  = 'Archivo_700Bold';
const SM  = 'SpaceMono_400Regular';
const SMB = 'SpaceMono_700Bold';

// ── Metal colors per spec ──────────────────────────────────────────────────────
const METALS = {
  light: { gold: '#C99A2E', silver: '#AEB4BC', bronze: '#C17C3F' },
  dark:  { gold: '#F2BE4B', silver: '#C2C8D0', bronze: '#D08C4F' },
};
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// Podium heights per spec: P1=118, P2=92, P3=74
const POD_H: Record<number, number> = { 1: 118, 2: 92, 3: 74 };

// ── API base ──────────────────────────────────────────────────────────────────
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchRoundResults(round: number): Promise<any> {
  const res = await fetch(`${BASE}/api/results/${round}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Race selector chip ────────────────────────────────────────────────────────
function RChip({
  meeting, round, active, onPress,
}: {
  meeting: any; round: number; active: boolean; onPress: () => void;
}) {
  const C = useColors();
  const code = getCountryCode(meeting.countryName);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        s.rchip,
        { borderColor: active ? C.ink : C.line, backgroundColor: active ? C.ink : C.surface },
      ]}
    >
      <View style={[s.rcFlag, { borderColor: C.line }]}>
        <Image source={{ uri: `https://flagcdn.com/w20/${code}.png` }}
          style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
      <Text style={[s.rcR, { color: active ? `${C.paper}B3` : C.muted }]}>
        R{String(round).padStart(2, '0')}
      </Text>
      <Text style={[s.rcN, { color: active ? C.paper : C.ink }]}>
        {meeting.meetingName.replace(' Grand Prix', '').toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

// ── Race header ───────────────────────────────────────────────────────────────
function RaceHeader({ results, round, C }: { results: any; round: number; C: any }) {
  const code = getCountryCode(results.countryName);
  return (
    <View style={[s.rHead, { backgroundColor: C.surface, borderColor: C.line }]}>
      <View style={[s.rhFlag, { borderColor: C.line }]}>
        <Image source={{ uri: `https://flagcdn.com/w80/${code}.png` }}
          style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rhMeta, { color: C.muted }]}>
          RONDA {String(round).padStart(2, '0')} · RESULTADO
          {results.totalLaps ? ` · ${results.totalLaps} VUELTAS` : ''}
        </Text>
        <Text style={[s.rhGP, { color: C.ink }]}>
          {results.meetingName?.replace(' Grand Prix', '').toUpperCase()}
        </Text>
        <Text style={[s.rhLoc, { color: C.muted }]}>{results.circuitShortName}</Text>
      </View>
    </View>
  );
}

// ── Podium column ─────────────────────────────────────────────────────────────
function PodiumCol({
  driver, visualPos, isDark,
}: {
  driver: any; visualPos: 1 | 2 | 3; isDark: boolean;
}) {
  const C = useColors();
  const m = isDark ? METALS.dark : METALS.light;
  const metal = visualPos === 1 ? m.gold : visualPos === 2 ? m.silver : m.bronze;
  const metalDark = `${metal}B8`;
  const tc = TEAM[driver.teamName as keyof typeof TEAM] ?? '#8A8A8E';
  const flagCode = DRIVER_CODES[driver.abbreviation] ?? 'un';
  const pts = POINTS[visualPos - 1] ?? 0;
  const barH = POD_H[visualPos];

  return (
    <View style={s.pcol}>
      {/* Info above the bar */}
      <View style={s.ppInfo}>
        <View style={[s.ppFlag, { borderColor: C.line }]}>
          <Image source={{ uri: `https://flagcdn.com/w40/${flagCode}.png` }}
            style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <Text style={[s.ppName, { color: C.ink }]}>{driver.lastName.toUpperCase()}</Text>
        <View style={s.ppTeam}>
          <View style={[s.ppTeamDot, { backgroundColor: tc }]} />
          <Text style={[s.ppTeamTxt, { color: C.muted }]}>{driver.teamName}</Text>
        </View>
      </View>

      {/* Podium bar with gradient */}
      <LinearGradient
        colors={[metal, metalDark]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[s.pbar, { height: barH }]}
      >
        {/* Dot texture web-only */}
        {Platform.OS === 'web' && (
          <View style={[StyleSheet.absoluteFill, {
            backgroundImage: 'radial-gradient(rgba(255,255,255,.18) 1px,transparent 1px)',
            backgroundSize: '6px 6px', opacity: 0.5,
          } as any]} />
        )}
        <Text style={s.pbPos}>{visualPos}</Text>
        <Text style={s.ppPts}>+{pts} PTS</Text>
      </LinearGradient>
    </View>
  );
}

// ── Classification row (P4+) ──────────────────────────────────────────────────
function ClassRow({
  driver, pos, isFav,
}: {
  driver: any; pos: number; isFav: boolean;
}) {
  const C = useColors();
  const tc = TEAM[driver.teamName as keyof typeof TEAM] ?? '#8A8A8E';
  const flagCode = DRIVER_CODES[driver.abbreviation] ?? 'un';
  const pts = POINTS[pos - 1] ?? 0;
  const gapStr = driver.gap ?? 'DNF';

  return (
    <View style={[
      s.crow,
      { borderTopColor: C.line2 },
      pos > 4 && { borderTopWidth: 1 },
      isFav && { backgroundColor: `${C.red}12` },
    ]}>
      {/* Fav left bar */}
      {isFav && <View style={[s.favBar, { backgroundColor: C.red }]} />}

      {/* Pos */}
      <Text style={[s.cpos, { color: C.muted }]}>{String(pos).padStart(2, '0')}</Text>

      {/* Flag */}
      <View style={[s.cfl, { borderColor: C.line }]}>
        <Image source={{ uri: `https://flagcdn.com/w20/${flagCode}.png` }}
          style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>

      {/* Name + team */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.cname, { color: C.ink }]} numberOfLines={1}>
          {driver.lastName.toUpperCase()}
          <Text style={[s.cnameSmall, { color: C.muted }]}>  {driver.teamName}</Text>
        </Text>
      </View>

      {/* Gap with team-color bar */}
      <View style={s.cgap}>
        <View style={[s.cgapBar, { backgroundColor: tc }]} />
        <Text style={[s.cgapTxt, { color: C.ink2 }]}>{gapStr}</Text>
      </View>

      {/* Points */}
      <Text style={[s.cpts, pts === 0 && s.cptsZero, { color: pts === 0 ? C.muted : C.ink }]}>
        {pts}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ResultsScreen() {
  const C = useColors();
  const isDark = C.paper === '#0B0B0F';

  const { data: schedData } = useSchedule();
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [favAbbr, setFavAbbr] = useState<string | null>(null);
  const cache = useRef<Map<number, any>>(new Map());

  // Load fav driver from storage
  useEffect(() => {
    AsyncStorage.getItem('user_driver').then(v => setFavAbbr(v));
  }, []);

  // Completed race meetings (past races in order, most recent first)
  const completedRaces = useMemo(() => {
    if (!schedData?.meetings) return [];
    const now = new Date();
    return schedData.meetings
      .filter((m: any) => new Date(m.dateEnd) < now && !m.isCancelled)
      .map((m: any) => ({ meeting: m, round: m.round }))   // use server-provided round number
      .reverse(); // most recent first
  }, [schedData]);

  // Auto-select most recent race
  useEffect(() => {
    if (completedRaces.length > 0 && selectedRound === null) {
      setSelectedRound(completedRaces[0].round);
    }
  }, [completedRaces]);

  // Fetch results when round changes
  useEffect(() => {
    if (selectedRound === null) return;
    if (cache.current.has(selectedRound)) {
      setResults(cache.current.get(selectedRound));
      return;
    }
    setLoading(true);
    fetchRoundResults(selectedRound)
      .then(data => {
        cache.current.set(selectedRound, data);
        setResults(data);
      })
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [selectedRound]);

  const raceResults: any[] = results?.results ?? [];
  const p1 = raceResults.find((r: any) => r.position === 1);
  const p2 = raceResults.find((r: any) => r.position === 2);
  const p3 = raceResults.find((r: any) => r.position === 3);
  const p4plus = raceResults.filter((r: any) => r.position >= 4);

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: C.paper }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Selector label */}
      <View style={s.selLblRow}>
        <View style={[s.selRedBar, { backgroundColor: C.red }]} />
        <Text style={[s.selLbl, { color: C.muted }]}>RESULTADOS · ELIGE LA CARRERA</Text>
      </View>

      {/* Race chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.selectorContent}
        style={s.selector}
      >
        {completedRaces.map(({ meeting, round }: any) => (
          <RChip
            key={round}
            meeting={meeting}
            round={round}
            active={round === selectedRound}
            onPress={() => setSelectedRound(round)}
          />
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator color={C.red} size="large" />
        </View>
      ) : results && p1 && p2 && p3 ? (
        <>
          {/* Header */}
          <RaceHeader results={results} round={selectedRound!} C={C} />

          {/* Podium — order: P2 | P1 | P3 */}
          <View style={s.podiumViz}>
            <PodiumCol driver={p2} visualPos={2} isDark={isDark} />
            <PodiumCol driver={p1} visualPos={1} isDark={isDark} />
            <PodiumCol driver={p3} visualPos={3} isDark={isDark} />
          </View>
          <View style={[s.podiumBase, { backgroundColor: C.line }]} />

          {/* Classification P4+ */}
          <View style={s.clsHead}>
            <Text style={[s.clsHeadTxt, { color: C.muted }]}>CLASIFICACIÓN</Text>
            <Text style={[s.clsHeadTxt, { color: C.muted }]}>DIF. / PTS</Text>
          </View>
          <View style={[s.cls, { backgroundColor: C.surface, borderColor: C.line }]}>
            {p4plus.map((d: any) => (
              <ClassRow
                key={d.driverNumber}
                driver={d}
                pos={d.position}
                isFav={d.abbreviation === favAbbr}
              />
            ))}
          </View>
        </>
      ) : results && !loading ? (
        <View style={s.loader}>
          <Text style={[s.emptyTxt, { color: C.muted }]}>Sin datos para esta carrera</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:   { flex: 1 },
  content:  { padding: 14, paddingBottom: 100, gap: 0 },
  loader:   { paddingVertical: 48, alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { fontFamily: SM, fontSize: 12 },

  // Selector label
  selLblRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  selRedBar: { width: 14, height: 3, borderRadius: 2 },
  selLbl:    { fontFamily: SMB, fontSize: 11, letterSpacing: .22 * 11 },

  // Race chips
  selector:        { marginBottom: 18 },
  selectorContent: { gap: 8, paddingBottom: 4 },
  rchip:     { flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, paddingHorizontal: 13, borderRadius: 11, borderWidth: 1 },
  rcFlag:    { width: 22, height: 15, borderRadius: 3, overflow: 'hidden', borderWidth: 1 },
  rcR:       { fontFamily: SMB, fontSize: 10, letterSpacing: .06 * 10 },
  rcN:       { fontFamily: A7, fontSize: 13, textTransform: 'uppercase', letterSpacing: -.005 * 13 },

  // Race header
  rHead:  { flexDirection: 'row', alignItems: 'center', gap: 15, borderRadius: 16,
    borderWidth: 1, padding: 16, paddingHorizontal: 18, marginBottom: 18 },
  rhFlag: { width: 52, height: 35, borderRadius: 6, overflow: 'hidden', borderWidth: 1 },
  rhMeta: { fontFamily: SMB, fontSize: 10, letterSpacing: .14 * 10 },
  rhGP:   { fontFamily: A9, fontSize: 26, letterSpacing: -.015 * 26,
    lineHeight: 26 * .95, textTransform: 'uppercase', marginTop: 5 },
  rhLoc:  { fontFamily: SM, fontSize: 11, marginTop: 4 },

  // Podium
  podiumViz: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 8 },
  pcol:     { flex: 1, alignItems: 'center' },
  ppInfo:   { alignItems: 'center', marginBottom: 11 },
  ppFlag:   { width: 34, height: 23, borderRadius: 4, overflow: 'hidden',
    borderWidth: 1, marginBottom: 8 },
  ppName:   { fontFamily: A8, fontSize: 15, textTransform: 'uppercase',
    letterSpacing: -.01 * 15, lineHeight: 15 },
  ppTeam:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  ppTeamDot:{ width: 7, height: 7, borderRadius: 2 },
  ppTeamTxt:{ fontFamily: SM, fontSize: 9 },
  pbar:     { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10,
    alignItems: 'center', justifyContent: 'flex-start', paddingTop: 12, overflow: 'hidden' },
  pbPos:    { fontFamily: A9, fontSize: 30, color: '#fff', letterSpacing: -.02 * 30,
    ...(Platform.OS === 'web' ? { textShadow: '0 1px 8px rgba(0,0,0,.25)' } as any : {
      textShadowColor: 'rgba(0,0,0,.25)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 },
    }) },
  ppPts:    { fontFamily: SMB, fontSize: 11, color: '#fff', opacity: .85, marginTop: 3,
    position: 'relative' },
  podiumBase:{ height: 5, borderRadius: 3, marginBottom: 22 },

  // Classification
  clsHead:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 6, paddingBottom: 10 },
  clsHeadTxt: { fontFamily: SMB, fontSize: 10, letterSpacing: .18 * 10 },
  cls:        { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },

  crow:    { position: 'relative', flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 12, paddingLeft: 12, paddingRight: 15 },
  favBar:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  cpos:    { fontFamily: SMB, fontSize: 14, width: 30, textAlign: 'center' },
  cfl:     { width: 26, height: 17, borderRadius: 3, overflow: 'hidden', borderWidth: 1 },
  cname:   { fontFamily: A7, fontSize: 16, textTransform: 'uppercase',
    letterSpacing: -.005 * 16 },
  cnameSmall:{ fontFamily: SM, fontSize: 10, fontWeight: '400', textTransform: 'none' },
  cgap:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cgapBar: { width: 3, height: 15, borderRadius: 2 },
  cgapTxt: { fontFamily: SM, fontSize: 12 },
  cpts:    { fontFamily: SMB, fontSize: 13, minWidth: 24, textAlign: 'right' },
  cptsZero:{ opacity: .55 },
});
