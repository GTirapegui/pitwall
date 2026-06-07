import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Platform,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useNextEvent } from '@/hooks/useNextEvent';
import { useTimezone, formatInTz } from '@/hooks/useTimezone';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { useI18n } from '@/context/I18nContext';

const A9  = 'Archivo_900Black';
const A8  = 'Archivo_800ExtraBold';
const SM  = 'SpaceMono_400Regular';
const SMB = 'SpaceMono_700Bold';
const RED = '#E10600';

// ── Freshness indicator colors ────────────────────────────────────────────────
function freshnessColor(ageMs: number): string {
  if (ageMs < 5_000)  return '#36D07B'; // green  — fresh
  if (ageMs < 15_000) return '#F2C94C'; // yellow — a bit stale
  return '#E10600';                      // red    — stale
}

// ── Live badge ────────────────────────────────────────────────────────────────
function LiveBadge() {
  const ring = useRef(new Animated.Value(0)).current;
  const dot  = useRef(new Animated.Value(0)).current;
  const ND   = Platform.OS !== 'web';
  useEffect(() => {
    const run = (v: Animated.Value) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 2000, useNativeDriver: ND }),
        Animated.timing(v, { toValue: 0, duration: 0,    useNativeDriver: ND }),
      ])).start();
    run(ring); run(dot);
  }, []);

  const ringScale   = ring.interpolate({ inputRange:[0,.7,1], outputRange:[1,1.5,1.5] });
  const ringOpacity = ring.interpolate({ inputRange:[0,.7,1], outputRange:[.55,0,0] });
  const dotScale    = dot.interpolate({ inputRange:[0,.8,1], outputRange:[.5,1.7,1.7] });
  const dotOpacity  = dot.interpolate({ inputRange:[0,.8,1], outputRange:[.9,0,0] });

  return (
    <View style={{ position:'relative' }}>
      <Animated.View style={[StyleSheet.absoluteFill,
        { borderRadius:999, backgroundColor:RED, transform:[{scale:ringScale}], opacity:ringOpacity }
      ]} />
      <View style={s.badge}>
        <View style={{ width:8, height:8, alignItems:'center', justifyContent:'center' }}>
          <Animated.View style={{ position:'absolute', width:16, height:16, borderRadius:8,
            borderWidth:1.5, borderColor:'#fff', transform:[{scale:dotScale}], opacity:dotOpacity }} />
          <View style={{ width:8, height:8, borderRadius:4, backgroundColor:'#fff' }} />
        </View>
        <Text style={s.badgeTxt}>LIVE</Text>
      </View>
    </View>
  );
}

// ── Freshness dot ─────────────────────────────────────────────────────────────
function FreshnessDot({ ageMs }: { ageMs: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const ND   = Platform.OS !== 'web';
  const color = freshnessColor(ageMs);

  useEffect(() => {
    if (ageMs < 5_000) {
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: ND }),
        Animated.timing(anim, { toValue: .4, duration: 700, useNativeDriver: ND }),
      ])).start();
    } else {
      anim.stopAnimation();
      anim.setValue(1);
    }
  }, [Math.floor(ageMs / 5_000)]); // only re-run when color tier changes

  return (
    <Animated.View style={[s.freshDot, { backgroundColor: color, opacity: anim }]} />
  );
}

// ── Position change chip ──────────────────────────────────────────────────────
function ChgBadge({ chg }: { chg: number }) {
  if (chg === 0) return null;
  const up    = chg > 0;
  const color = up ? '#36D07B' : RED;
  return (
    <Text style={[s.chgTxt, { color }]}>
      {up ? '▲' : '▼'}{Math.abs(chg)}
    </Text>
  );
}

// ── Timing row ────────────────────────────────────────────────────────────────
function TowerRow({
  driver, pos, prevPos, highlight,
}: {
  driver: LiveDriver; pos: number; prevPos: number | undefined; highlight: boolean;
}) {
  const C   = useColors();
  const tc  = driver.teamColour || '#8A8A8E';
  const chg = prevPos !== undefined ? prevPos - pos : 0; // positive = moved up

  // Highlight flash when row data updates
  const flashAnim = useRef(new Animated.Value(0)).current;
  const ND        = Platform.OS !== 'web';
  useEffect(() => {
    if (highlight) {
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: ND }),
        Animated.timing(flashAnim, { toValue: 0, duration: 800, useNativeDriver: ND }),
      ]).start();
    }
  }, [highlight]);

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1], outputRange: ['rgba(225,6,0,0)', 'rgba(225,6,0,0.12)'],
  });

  return (
    <Animated.View style={[
      s.row,
      pos > 1 && { borderTopWidth: 1, borderTopColor: C.line2 },
      { backgroundColor: flashBg as any },
    ]}>
      {/* Pos + change */}
      <View style={s.rowPos}>
        <Text style={[s.rowPosNum, { color: C.muted }]}>{String(pos).padStart(2,'0')}</Text>
        <ChgBadge chg={chg} />
      </View>

      {/* Team bar */}
      <View style={[s.rowBar, { backgroundColor: tc }]} />

      {/* Driver */}
      <View style={s.rowMid}>
        <View style={s.rowDrv}>
          <Text style={[s.rowCode, { color: C.ink }]}>{driver.abbreviation}</Text>
          <Text style={[s.rowName, { color: C.muted }]} numberOfLines={1}>{driver.lastName}</Text>
        </View>
        <Text style={[s.rowTeam, { color: C.muted }]}>{driver.teamName}</Text>
      </View>

      {/* Gap + last lap */}
      <View style={s.rowTimes}>
        <Text style={[s.rowGap, { color: pos === 1 ? RED : C.ink2 }]}>{driver.gap}</Text>
        {driver.lastLap && (
          <Text style={[s.rowLap, { color: C.muted }]}>{driver.lastLap}</Text>
        )}
      </View>
    </Animated.View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  const C = useColors();
  const { t } = useI18n();
  const { data: nextEvent } = useNextEvent();
  const { tz } = useTimezone();
  const nextSession = nextEvent?.sessions?.[0];
  const gp      = nextEvent?.meetingName?.replace(' Grand Prix','').toUpperCase() ?? '—';
  const session = nextSession?.sessionName?.toUpperCase() ?? t('live.nextSession');
  const dateStr = nextSession
    ? formatInTz(nextSession.dateStart, tz, 'EEE dd MMM · HH:mm').toUpperCase()
    : '—';

  return (
    <View style={[s.emptyWrap, { backgroundColor: C.paper }]}>
      <View style={[s.emptyIcon, { borderColor: C.line }]}>
        <Text style={{ fontSize:32 }}>📡</Text>
      </View>
      <Text style={[s.emptyTitle, { color: C.ink }]}>{t('live.noSession')}</Text>
      <Text style={[s.emptySub, { color: C.muted }]}>{t('live.noSession')}</Text>
      {nextEvent?.meetingName && (
        <View style={[s.nextCard, { backgroundColor: C.surface, borderColor: C.line }]}>
          <Text style={[s.nextLbl, { color: C.muted }]}>{t('live.nextSession')}</Text>
          <Text style={[s.nextGP, { color: C.ink }]}>{gp} GP · {session}</Text>
          <Text style={[s.nextDate, { color: RED }]}>{dateStr}</Text>
        </View>
      )}
    </View>
  );
}

// ── Coming soon (live race, timing unavailable) ───────────────────────────────
function ComingSoonState({ raceName }: { raceName: string }) {
  const C = useColors();
  return (
    <View style={[s.emptyWrap, { backgroundColor: C.paper }]}>
      <View style={[s.emptyIcon, { borderColor: RED }]}>
        <Text style={{ fontSize: 32 }}>🏁</Text>
      </View>
      <Text style={[s.emptyTitle, { color: C.ink }]}>PRÓXIMAMENTE</Text>
      <Text style={[s.emptySub, { color: C.muted }]}>
        El timing en vivo estará disponible en una próxima versión.
      </Text>
      <View style={[s.nextCard, { backgroundColor: C.surface, borderColor: RED }]}>
        <Text style={[s.nextLbl, { color: C.muted }]}>CARRERA EN CURSO</Text>
        <Text style={[s.nextGP, { color: C.ink }]}>{raceName}</Text>
        <LiveBadge />
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function LiveScreen() {
  const { isLive, session } = useLiveStatus();

  if (!isLive) return <EmptyState />;

  const gpName   = (session?.gp ?? '').replace('FORMULA 1', '').replace(/\d{4}$/, '').trim();
  const sessName = session?.name ?? '—';

  return <ComingSoonState raceName={`${gpName} · ${sessName}`} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:   { flex:1 },
  content:  { padding:14, gap:14, paddingBottom:40 },

  // Badge
  badge:    { flexDirection:'row', alignItems:'center', gap:8,
    backgroundColor:RED, paddingHorizontal:11, paddingVertical:6, borderRadius:999 },
  badgeTxt: { fontFamily:SMB, fontSize:11, color:'#fff', letterSpacing:.2*11 },

  // Hero
  hero:       { borderRadius:18, overflow:'hidden', borderWidth:1,
    borderColor:'rgba(255,255,255,.08)', padding:18, paddingBottom:14 },
  heroTop:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  heroSession:{ fontFamily:SMB, fontSize:11, color:'rgba(243,241,234,.55)', letterSpacing:.14*11 },
  heroGP:     { fontFamily:A9, fontSize:26, color:'#F3F1EA', textTransform:'uppercase',
    letterSpacing:-.015*26, lineHeight:28 },
  heroCircuit:{ fontFamily:SM, fontSize:11, color:'rgba(243,241,234,.55)', marginTop:5 },

  // Freshness
  freshRow:  { flexDirection:'row', alignItems:'center', gap:8, marginTop:12 },
  freshDot:  { width:7, height:7, borderRadius:4 },
  freshTxt:  { fontFamily:SM, fontSize:8, color:'rgba(243,241,234,.4)', letterSpacing:.1*8 },

  // Tower
  towerHead: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:4, paddingBottom:6 },
  towerHeadL:{ fontFamily:SMB, fontSize:10, letterSpacing:.18*10 },
  towerHeadR:{ fontFamily:SMB, fontSize:10, letterSpacing:.18*10 },
  tower:     { borderRadius:14, borderWidth:1, overflow:'hidden' },

  row:     { flexDirection:'row', alignItems:'center', gap:11,
    paddingVertical:11, paddingHorizontal:10, paddingRight:14 },
  rowPos:  { width:34, alignItems:'center', gap:2 },
  rowPosNum:{ fontFamily:SMB, fontSize:14 },
  chgTxt:  { fontFamily:SMB, fontSize:8 },
  rowBar:  { width:5, height:32, borderRadius:3 },
  rowMid:  { flex:1, minWidth:0 },
  rowDrv:  { flexDirection:'row', alignItems:'baseline', gap:8 },
  rowCode: { fontFamily:A8, fontSize:17, letterSpacing:.01*17 },
  rowName: { fontFamily:SM, fontSize:11, flexShrink:1 },
  rowTeam: { fontFamily:SM, fontSize:9, marginTop:3, letterSpacing:.04*9 },
  rowTimes:{ alignItems:'flex-end', gap:2 },
  rowGap:  { fontFamily:SMB, fontSize:13, textAlign:'right' },
  rowLap:  { fontFamily:SM, fontSize:10, textAlign:'right' },

  disc:    { fontFamily:SM, fontSize:9, letterSpacing:.14*9, textAlign:'center', marginTop:4 },

  // Empty
  emptyWrap: { flex:1, alignItems:'center', justifyContent:'center', padding:32, gap:14 },
  emptyIcon: { width:72, height:72, borderRadius:999, borderWidth:1,
    alignItems:'center', justifyContent:'center', marginBottom:8 },
  emptyTitle:{ fontFamily:A9, fontSize:20, textTransform:'uppercase', letterSpacing:-.01*20, textAlign:'center' },
  emptySub:  { fontFamily:SM, fontSize:11, textAlign:'center', letterSpacing:.04*11, lineHeight:18 },
  nextCard:  { marginTop:12, borderRadius:14, borderWidth:1, padding:16,
    alignItems:'center', gap:6, width:'100%', maxWidth:340 },
  nextLbl:   { fontFamily:SMB, fontSize:9, letterSpacing:.16*9 },
  nextGP:    { fontFamily:A9, fontSize:18, textTransform:'uppercase', letterSpacing:-.01*18, textAlign:'center' },
  nextDate:  { fontFamily:SMB, fontSize:12, letterSpacing:.1*12 },
});
