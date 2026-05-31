/**
 * RaceDetailModal — bottom sheet matching Pitwall Calendario.html §sheet
 * 6 sections: Header · Status · Sessions · Circuit · Weather · Fav Driver
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView,
  Modal, Animated, StyleSheet, Platform, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useTimezone, formatInTz } from '@/hooks/useTimezone';
import { useDriverStandings } from '@/hooks/useStandings';
import { getCircuitByEvent, COMPOUND_COLORS } from '@/constants/circuits';
import CircuitMap from '@/components/ui/CircuitMap';
import { useI18n } from '@/context/I18nContext';
import { getCountryCode } from '@/constants/flags';
import { MeetingEntry } from '@/services/api';

const A9  = 'Archivo_900Black';
const A8  = 'Archivo_800ExtraBold';
const A7  = 'Archivo_700Bold';
const SM  = 'SpaceMono_400Regular';
const SMB = 'SpaceMono_700Bold';
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Session code mapping ──────────────────────────────────────────────────────
const SESSION_CODE: Record<string, string> = {
  'Practice 1':'P1','Practice 2':'P2','Practice 3':'P3',
  'Qualifying':'Q','Sprint':'SPR','Sprint Qualifying':'SQ','Race':'GP',
};
// Session names are now derived from i18n inside the component

// ── Weather helpers ───────────────────────────────────────────────────────────
function weatherEmoji(code: number): string {
  if (code <= 1) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌦️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  return '⛈️';
}

// ── Pulsing dot ───────────────────────────────────────────────────────────────
function PulseStatus() {
  const anim = useRef(new Animated.Value(0)).current;
  const ND   = Platform.OS !== 'web';
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: ND }),
      Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: ND }),
    ])).start();
  }, []);
  const op = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return <Animated.View style={[s.pulseDot, { opacity: op }]} />;
}

// ── Section label (.ds-t) ─────────────────────────────────────────────────────
function SLabel({ text, C }: { text: string; C: any }) {
  return (
    <View style={s.sLabel}>
      <View style={[s.sLabelBar, { backgroundColor: C.red }]} />
      <Text style={[s.sLabelTxt, { color: C.muted }]}>{text}</Text>
    </View>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface Props {
  meeting: MeetingEntry | null;
  round:   number;
  totalRounds: number;
  onClose: () => void;
}

export default function RaceDetailModal({ meeting, round, totalRounds, onClose }: Props) {
  const C     = useColors();
  const { t } = useI18n();
  const router = useRouter();
  const { tz, tzOption } = useTimezone();

  const SESSION_NAME_I18N: Record<string, string> = {
    'Practice 1': t('calendar.practice1'), 'Practice 2': t('calendar.practice2'),
    'Practice 3': t('calendar.practice3'), 'Qualifying': t('calendar.qualifying'),
    'Sprint': t('calendar.sprint'), 'Sprint Qualifying': t('calendar.sprintQualifying'),
    'Race': t('calendar.race'),
  };
  const { data: standingsData } = useDriverStandings();
  const { height } = useWindowDimensions();

  const [favAbbr,    setFavAbbr]    = useState<string | null>(null);
  const [weather,    setWeather]    = useState<any[] | null>(null);
  const [wxLoading,  setWxLoading]  = useState(false);
  const [driverResult, setDriverResult] = useState<any>(null);

  // Spring animation
  const slideY = useRef(new Animated.Value(height)).current;
  const ND     = Platform.OS !== 'web';

  const open = useCallback(() => {
    Animated.spring(slideY, {
      toValue: 0, tension: 65, friction: 11, useNativeDriver: ND,
    }).start();
  }, [slideY, height, ND]);

  const close = useCallback(() => {
    Animated.timing(slideY, {
      toValue: height, duration: 250, useNativeDriver: ND,
    }).start(() => onClose());
  }, [slideY, height, ND, onClose]);

  useEffect(() => {
    if (meeting) {
      slideY.setValue(height);
      open();
    }
  }, [meeting]);

  // Load fav driver
  useEffect(() => {
    AsyncStorage.getItem('user_driver').then(v => setFavAbbr(v));
  }, []);

  const circ = meeting ? getCircuitByEvent(meeting) : null;

  // Weather fetch
  useEffect(() => {
    if (!circ?.lat || !circ?.lon || !meeting) return;
    setWxLoading(true);
    setWeather(null);
    const raceSession = meeting.sessions?.find(s => s.sessionName === 'Race');
    if (!raceSession) { setWxLoading(false); return; }

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${circ.lat}&longitude=${circ.lon}` +
      `&daily=temperature_2m_max,precipitation_probability_max,weathercode&timezone=auto&forecast_days=7`
    )
      .then(r => r.json())
      .then(data => {
        if (!data.daily?.time) return;
        // Find the 3 days of the race weekend (Fri–Sun surrounding the race)
        const raceDate = new Date(raceSession.dateStart);
        const sun = new Date(raceDate); sun.setDate(sun.getDate() - sun.getDay() || 7); // Sunday
        const fri = new Date(sun); fri.setDate(sun.getDate() - 6);
        const sat = new Date(fri); sat.setDate(fri.getDate() + 1);
        const days = [fri, sat, sun];
        const result = days.map(d => {
          const ds = d.toISOString().split('T')[0];
          const idx = data.daily.time.indexOf(ds);
          if (idx < 0) return null;
          return {
            label: formatInTz(d.toISOString(), tz, 'EEE').toUpperCase(),
            code:  data.daily.weathercode[idx] ?? 0,
            temp:  Math.round(data.daily.temperature_2m_max[idx] ?? 0),
            rain:  Math.round(data.daily.precipitation_probability_max[idx] ?? 0),
          };
        }).filter(Boolean);
        setWeather(result);
      })
      .catch(() => setWeather(null))
      .finally(() => setWxLoading(false));
  }, [circ?.key, meeting?.meetingKey]);

  // Driver result for past races
  useEffect(() => {
    if (!meeting || !favAbbr) { setDriverResult(null); return; }
    const now = new Date();
    const isPast = new Date(meeting.dateEnd) < now;
    if (!isPast) { setDriverResult(null); return; }
    fetch(`${BASE}/api/results/${round}`)
      .then(r => r.json())
      .then(data => {
        const dr = data?.results?.find((r: any) => r.abbreviation === favAbbr);
        setDriverResult(dr ?? null);
      })
      .catch(() => setDriverResult(null));
  }, [meeting?.meetingKey, favAbbr, round]);

  if (!meeting) return null;

  const now        = new Date();
  const isPast     = new Date(meeting.dateEnd) < now;
  const raceSession = meeting.sessions?.find(s => s.sessionName === 'Race');
  const isNext     = !isPast && raceSession
    ? new Date(raceSession.dateStart).getTime() - now.getTime() < 7 * 86_400_000
    : false;
  const isFuture   = !isPast && !isNext;

  const countryCode = getCountryCode(meeting.countryName ?? '');
  const gpName = meeting.meetingName.replace(' Grand Prix','').toUpperCase();

  // Days until race
  const daysUntil = raceSession
    ? Math.ceil((new Date(raceSession.dateStart).getTime() - now.getTime()) / 86_400_000)
    : null;

  // Fav driver info
  const favStanding = favAbbr && standingsData?.standings
    ? standingsData.standings.find(d => d.abbreviation === favAbbr) : null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={close} statusBarTranslucent>
      {/* Backdrop */}
      <TouchableOpacity
        style={s.backdrop}
        activeOpacity={1}
        onPress={close}
      />

      {/* Sheet */}
      <Animated.View style={[s.sheetWrap, { transform: [{ translateY: slideY }] }]}>
        <View style={[s.sheet, { backgroundColor: C.paper, borderColor: C.line,
          ...(Platform.OS==='web'?{boxShadow:'0 -20px 50px -20px rgba(0,0,0,.5)'}as any:{
            shadowColor:'#000',shadowOpacity:.35,shadowRadius:20,shadowOffset:{width:0,height:-8},elevation:24
          })
        }]}>
          {/* Handle grip */}
          <View style={[s.grip, { backgroundColor: C.dim }]} />

          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View style={s.dsHead}>
              <View style={[s.dsFlag, { borderColor: C.line }]}>
                <Image source={{ uri:`https://flagcdn.com/w80/${countryCode}.png` }}
                  style={{ width:'100%', height:'100%' }} resizeMode="cover" />
              </View>
              <View style={{ flex:1, minWidth:0 }}>
                <Text style={[s.dsGP, { color: C.ink }]}>{gpName}</Text>
                <Text style={[s.dsSub, { color: C.muted }]}>{circ?.name ?? meeting.circuitShortName}</Text>
              </View>
              <TouchableOpacity style={[s.dsX, { borderColor:C.line, backgroundColor:C.surface }]} onPress={close}>
                <Text style={{ color:C.ink2, fontSize:14, fontFamily:SM }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Round + timezone */}
            <View style={[s.dsRound, { borderTopColor:C.line, borderBottomColor:C.line }]}>
              <Text style={[s.dsRoundTxt, { color:C.muted }]}>
                RONDA {String(round).padStart(2,'0')} / {totalRounds}
              </Text>
              <Text style={[s.dsRoundTxt, { color:C.muted }]}>
                {t('calendar.allTimes', { city: (tzOption?.label ?? 'UTC').toUpperCase() })}
              </Text>
            </View>

            {/* ── Status badge ── */}
            {isNext && (
              <View style={[s.dsBadge, { backgroundColor:`rgba(${C.paper==='#0B0B0F'?'255,33,24':'225,6,0'},0.09)`,
                borderColor:`rgba(${C.paper==='#0B0B0F'?'255,33,24':'225,6,0'},0.30)` }]}>
                <PulseStatus />
                <Text style={[s.dsBadgeTxt, { color:C.red }]}>{t('calendar.nextRace')}</Text>
                <Text style={[s.dsBadgeWhen, { color:C.muted }]}>
                  {daysUntil !== null && daysUntil <= 0 ? t('calendar.thisWeekendShort')
                    : daysUntil === 1 ? t('calendar.tomorrow')
                    : daysUntil !== null ? t('home.inDays', { n: daysUntil }) : ''}
                </Text>
              </View>
            )}
            {isFuture && (
              <View style={[s.dsBadge, { backgroundColor:`rgba(226,170,50,0.12)`,
                borderColor:`rgba(226,170,50,0.30)` }]}>
                <Text style={[s.dsBadgeTxt, { color:C.gold }]}>{t('calendar.upcoming')}</Text>
                {daysUntil !== null && (
                  <Text style={[s.dsBadgeWhen, { color:C.muted }]}>EN {daysUntil} DÍAS</Text>
                )}
              </View>
            )}
            {isPast && (
              <View style={[s.dsBadge, { backgroundColor:C.surface2, borderColor:C.line }]}>
                <Text style={[s.dsBadgeTxt, { color:C.muted }]}>✓ {t('calendar.completed')}</Text>
              </View>
            )}

            {/* VER RESULTADOS button for past races */}
            {isPast && (
              <TouchableOpacity
                style={[s.dsBtn, { backgroundColor:C.ink }]}
                onPress={() => { close(); setTimeout(() => router.replace('/results' as any), 300); }}
                activeOpacity={0.85}
              >
                <Text style={[s.dsBtnTxt, { color:C.paper }]}>{t('calendar.viewResults')}</Text>
              </TouchableOpacity>
            )}

            {/* ── Sessions ── */}
            <SLabel text={t('calendar.raceWeekend')} C={C} />
            <View style={[s.dsSess, { backgroundColor:C.surface, borderColor:C.line }]}>
              {meeting.sessions?.map((sess, i) => {
                const isRace = sess.sessionName === 'Race';
                const code   = SESSION_CODE[sess.sessionName] ?? sess.sessionName.slice(0,3).toUpperCase();
                const name   = SESSION_NAME_I18N[sess.sessionName] ?? sess.sessionName;
                const dateStr = formatInTz(sess.dateStart, tz, 'EEE dd MMM').toUpperCase();
                const timeStr = formatInTz(sess.dateStart, tz, 'HH:mm');
                return (
                  <View key={sess.sessionKey} style={[
                    s.sessRow,
                    i > 0 && { borderTopWidth:1, borderTopColor:C.line2 },
                    isRace && { backgroundColor: `rgba(${C.paper==='#0B0B0F'?'255,33,24':'225,6,0'},0.09)`,
                      borderRadius:10, borderWidth:1, borderColor:`rgba(${C.paper==='#0B0B0F'?'255,33,24':'225,6,0'},0.20)`,
                      marginHorizontal:4 },
                  ]}>
                    <Text style={[s.sessCode, { color: isRace ? C.red : C.muted }]}>{code}</Text>
                    <Text style={[s.sessName, { color:C.ink, fontWeight: isRace ? '800':'600' }]} numberOfLines={1}>{name}</Text>
                    <Text style={[s.sessTime, { color: isRace ? C.red : C.ink2 }]}>
                      {dateStr} · {timeStr}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* ── Circuit ── */}
            {circ && (
              <>
                <SLabel text={t('calendar.theCircuit')} C={C} />
                <CircuitMap circuitKey={circ.key} height={158} />

                {/* Stats 3×2 grid */}
                <View style={[s.dsStats, { borderColor:C.line, backgroundColor:C.line }]}>
                  {[
                    { v:`${circ.km}`, u:'km', l:t('calendar.circuit.length') },
                    { v:`${circ.laps}`,u:'',  l:t('calendar.circuit.laps') },
                    { v:`${(circ.km*circ.laps).toFixed(1)}`,u:'km',l:t('calendar.circuit.distance') },
                    { v:`${circ.turns}`,u:'', l:t('calendar.circuit.turns') },
                    { v:`${circ.drs}`,u:'',   l:t('calendar.circuit.drs') },
                    { v:circ.clockwise?t('calendar.circuit.clockwise'):t('calendar.circuit.anticlockwise'),u:'',l:t('calendar.circuit.direction'),txt:true },
                  ].map(({ v, u, l, txt }) => (
                    <View key={l} style={[s.dsSt, { backgroundColor:C.surface }]}>
                      <Text style={[txt ? s.dsStTxt : s.dsStVal, { color:C.ink }]}>
                        {v}{u && <Text style={[s.dsStUnit,{color:C.muted}]}> {u}</Text>}
                      </Text>
                      <Text style={[s.dsStLbl, { color:C.muted }]}>{l}</Text>
                    </View>
                  ))}
                </View>

                {/* Record */}
                {circ.record !== '—' && (
                  <View style={[s.dsRecord, { backgroundColor:C.surface, borderColor:C.line }]}>
                    <View>
                      <Text style={[s.dsRecLbl, { color:C.muted }]}>{t('calendar.circuit.lapRecord')}</Text>
                      <Text style={[s.dsRecDrv, { color:C.ink }]}>{circ.recordDriver}</Text>
                    </View>
                    <View style={{ marginLeft:'auto' as any, alignItems:'flex-end' }}>
                      <Text style={[s.dsRecTime, { color:C.ink }]}>{circ.record}</Text>
                      <Text style={[s.dsRecYear, { color:C.muted }]}>{circ.recordYear}</Text>
                    </View>
                  </View>
                )}

                {/* Compounds */}
                <View style={s.dsComp}>
                  <Text style={[s.dsCompLbl, { color:C.muted }]}>{t('calendar.circuit.compounds')}</Text>
                  {circ.compounds.map(c => (
                    <View key={c} style={s.dsCompItem}>
                      <View style={[s.dsCompDot, { borderColor: COMPOUND_COLORS[c] ?? '#8A8A8E' }]} />
                      <Text style={[s.dsCompTxt, { color:C.ink2 }]}>{c}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ── Weather ── */}
            {(weather || wxLoading) && (
              <>
                <SLabel text={t('calendar.weather')} C={C} />
                <View style={s.dsWx}>
                  {wxLoading ? (
                    [0,1,2].map(i => (
                      <View key={i} style={[s.wxCard, { backgroundColor:C.surface, borderColor:C.line }]}>
                        <Text style={[s.wxDay, { color:C.muted }]}>—</Text>
                      </View>
                    ))
                  ) : weather?.map((w: any, i: number) => (
                    <View key={i} style={[s.wxCard, { backgroundColor:C.surface, borderColor:C.line }]}>
                      <Text style={[s.wxDay,  { color:C.muted }]}>{w.label}</Text>
                      <Text style={s.wxIcon}>{weatherEmoji(w.code)}</Text>
                      <Text style={[s.wxTemp, { color:C.ink }]}>{w.temp}°</Text>
                      <Text style={[s.wxRain, { color:C.muted }]}>{w.rain}% lluvia</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ── Fav driver ── */}
            {favStanding && (
              <>
                <View style={[s.dsFav, {
                  backgroundColor:`rgba(${C.paper==='#0B0B0F'?'255,33,24':'225,6,0'},0.07)`,
                  borderColor:`rgba(${C.paper==='#0B0B0F'?'255,33,24':'225,6,0'},0.22)`,
                }]}>
                  <View>
                    <Text style={[s.dsFavLbl, { color:C.red }]}>{t('calendar.yourDriverHere')}</Text>
                    <Text style={[s.dsFavName, { color:C.ink }]}>
                      {favStanding.lastName.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[s.dsFavVal, { color:C.ink }]}>
                    {driverResult
                      ? `P${driverResult.position} · +${driverResult.points} PTS`
                      : `P${favStanding.position} · ${favStanding.points} PTS`}
                  </Text>
                </View>
              </>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop: { position:'absolute', top:0,left:0,right:0,bottom:0, backgroundColor:'rgba(8,8,12,.55)',
    ...(Platform.OS==='web'?{backdropFilter:'blur(3px)'} as any:{}) },
  sheetWrap:{ position:'absolute', bottom:0, left:0, right:0, alignItems:'center' },
  sheet:    { width:'100%', maxWidth:600, borderTopLeftRadius:22, borderTopRightRadius:22,
    borderWidth:1, borderBottomWidth:0, overflow:'hidden' },
  grip:     { width:38, height:4, borderRadius:3, alignSelf:'center', marginTop:8, marginBottom:2 },
  scroll:   { maxHeight: 620 },
  scrollContent: { padding:20, paddingTop:6, paddingBottom:24 },

  // Header
  dsHead:   { flexDirection:'row', alignItems:'flex-start', gap:14, paddingBottom:14, paddingTop:10 },
  dsFlag:   { width:52, height:35, borderRadius:6, overflow:'hidden', borderWidth:1, flexShrink:0 },
  dsGP:     { fontFamily:A9, fontSize:25, textTransform:'uppercase', letterSpacing:-.015*25, lineHeight:25*.96 },
  dsSub:    { fontFamily:SM, fontSize:11, marginTop:6 },
  dsX:      { width:34, height:34, borderRadius:9, borderWidth:1, alignItems:'center',
    justifyContent:'center', flexShrink:0, marginLeft:'auto' as any },

  // Round row
  dsRound:  { flexDirection:'row', justifyContent:'space-between',
    paddingVertical:11, borderTopWidth:1, borderBottomWidth:1, marginBottom:0 },
  dsRoundTxt:{ fontFamily:SMB, fontSize:11, letterSpacing:.16*11 },

  // Status
  dsBadge:  { flexDirection:'row', alignItems:'center', gap:11,
    marginTop:16, padding:13, paddingHorizontal:15, borderRadius:13, borderWidth:1 },
  pulseDot: { width:9, height:9, borderRadius:5, backgroundColor:'#E10600', flexShrink:0 },
  dsBadgeTxt:{ fontFamily:SMB, fontSize:12, letterSpacing:.14*12, flex:1 },
  dsBadgeWhen:{ fontFamily:SM, fontSize:10, letterSpacing:.1*10 },

  // Button
  dsBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center',
    gap:8, marginTop:14, padding:14, borderRadius:12 },
  dsBtnTxt: { fontFamily:SMB, fontSize:12, letterSpacing:.1*12 },

  // Section label (.ds-t)
  sLabel:   { flexDirection:'row', alignItems:'center', gap:8, marginTop:22, marginBottom:11 },
  sLabelBar:{ width:12, height:3, borderRadius:2 },
  sLabelTxt:{ fontFamily:SMB, fontSize:10, letterSpacing:.2*10 },

  // Sessions
  dsSess:   { borderRadius:12, borderWidth:1, overflow:'hidden' },
  sessRow:  { flexDirection:'row', alignItems:'center', gap:10, padding:12, paddingHorizontal:14, flexWrap:'nowrap' },
  sessCode: { fontFamily:SMB, fontSize:11, minWidth:44, flexShrink:0 },
  sessName: { fontFamily:A7, fontSize:15, flex:1 },
  sessTime: { fontFamily:SMB, fontSize:11, textAlign:'right', flexShrink:0 },

  // Stats grid
  dsStats:  { flexDirection:'row', flexWrap:'wrap', gap:1, borderRadius:12,
    overflow:'hidden', borderWidth:1, marginTop:12 },
  dsSt:     { width:'33.33%', padding:12, paddingHorizontal:8, alignItems:'center' },
  dsStVal:  { fontFamily:A9, fontSize:18 },
  dsStTxt:  { fontFamily:A8, fontSize:13 },
  dsStUnit: { fontFamily:SM, fontSize:10 },
  dsStLbl:  { fontFamily:SMB, fontSize:8, letterSpacing:.1*8, marginTop:5 },

  // Record
  dsRecord: { flexDirection:'row', alignItems:'center', gap:10, marginTop:12,
    borderRadius:12, borderWidth:1, padding:13, paddingHorizontal:15 },
  dsRecLbl: { fontFamily:SMB, fontSize:9, letterSpacing:.14*9 },
  dsRecDrv: { fontFamily:A8, fontSize:15, marginTop:3 },
  dsRecTime:{ fontFamily:A9, fontSize:20 },
  dsRecYear:{ fontFamily:SM, fontSize:11, marginTop:2 },

  // Compounds
  dsComp:     { flexDirection:'row', alignItems:'center', gap:11, marginTop:12,
    flexWrap:'wrap' },
  dsCompLbl:  { fontFamily:SM, fontSize:10, letterSpacing:.1*10 },
  dsCompItem: { flexDirection:'row', alignItems:'center', gap:6 },
  dsCompDot:  { width:14, height:14, borderRadius:999, borderWidth:2 },
  dsCompTxt:  { fontFamily:SMB, fontSize:10, letterSpacing:.1*10 },

  // Weather
  dsWx:     { flexDirection:'row', gap:10 },
  wxCard:   { flex:1, borderRadius:12, borderWidth:1, padding:13, paddingHorizontal:8, alignItems:'center' },
  wxDay:    { fontFamily:SMB, fontSize:10, letterSpacing:.1*10 },
  wxIcon:   { fontSize:20, marginVertical:6 },
  wxTemp:   { fontFamily:A9, fontSize:18 },
  wxRain:   { fontFamily:SM, fontSize:9, marginTop:4 },

  // Fav driver
  dsFav:    { flexDirection:'row', alignItems:'center', gap:10,
    borderRadius:12, borderWidth:1, padding:13, paddingHorizontal:15, marginTop:12 },
  dsFavLbl: { fontFamily:SMB, fontSize:9, letterSpacing:.14*9 },
  dsFavName:{ fontFamily:A9, fontSize:22, textTransform:'uppercase', marginTop:3 },
  dsFavVal: { fontFamily:A8, fontSize:16, marginLeft:'auto' as any },
});
