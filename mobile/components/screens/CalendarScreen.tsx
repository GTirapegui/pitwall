/**
 * CalendarScreen — pixel-faithful to the HTML reference (Pitwall Calendario.html)
 * Layout: left col ~420px fixed (hero + mini-cal) | right col flex (race list)
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Animated, Easing, useWindowDimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme }     from '@/hooks/useTheme';
import { useSchedule }  from '@/hooks/useSchedule';
import { useNextEvent } from '@/hooks/useNextEvent';
import { useTimezone, localDateStr, formatInTz } from '@/hooks/useTimezone';
import RaceDetailModal  from '@/components/ui/RaceDetailModal';
import { useRaceResults } from '@/hooks/useRaceResults';
import { useDriverStandings } from '@/hooks/useStandings';
import { MeetingEntry, NextEventResponse } from '@/services/api';
import { getCountryCode } from '@/constants/flags';

// ── Fonts ────────────────────────────────────────────────────────────────────
const FA  = 'Archivo_900Black';
const SM  = 'SpaceMono_400Regular';
const SMB = 'SpaceMono_700Bold';

// ── Design tokens (match the HTML reference exactly) ─────────────────────────
function useTokens() {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    bg:       d ? '#0B0B0F'               : '#E7E5DE',
    surface:  d ? '#16161D'               : '#FAF9F4',
    surface2: d ? '#1D1D26'               : '#F1EFE7',
    ink:      d ? '#F3F1EA'               : '#16161C',
    ink2:     d ? '#C9C7BD'               : '#46453E',
    muted:    d ? '#76757F'               : '#8C8A7F',
    sep:      d ? 'rgba(255,255,255,.11)' : 'rgba(20,20,28,.12)',
    line2:    d ? 'rgba(255,255,255,.055)': 'rgba(20,20,28,.07)',
    isDark: d,
  };
}

const RED  = '#E10600';
const GOLD = '#F2BE4B';

const TEAM_COLORS: Record<string,string> = {
  McLaren:'#FF8000', Ferrari:'#E8002D', Mercedes:'#27F4D2',
  'Red Bull Racing':'#3671C6', Williams:'#1868DB', 'Aston Martin':'#229971',
  RB:'#6692FF', 'Racing Bulls':'#6692FF', 'Kick Sauber':'#52E252',
  'Haas F1 Team':'#B6BABD', Alpine:'#00A1E8',
};

const SESSION_CODES: Record<string,string> = {
  'Practice 1':'P1','Practice 2':'P2','Practice 3':'P3',
  Qualifying:'Q', Sprint:'SPR', 'Sprint Qualifying':'SQ', Race:'RACE',
};

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DOW_LABELS = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function dayKey(y:number, m:number, d:number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

type Status = 'past'|'next'|'future'|'cancelled';

interface CellData { meeting:MeetingEntry; isRaceDay:boolean; status:Status }

function buildDayMap(
  meetings:MeetingEntry[], tz:string,
  nextKey:number|undefined, now:Date
): Map<string,CellData> {
  const map = new Map<string,CellData>();
  for (const m of meetings) {
    const st:Status = m.isCancelled ? 'cancelled'
      : new Date(m.dateEnd) < now ? 'past'
      : m.meetingKey === nextKey ? 'next' : 'future';
    for (const s of m.sessions) {
      const k = localDateStr(s.dateStart, tz);
      const prev = map.get(k);
      map.set(k, { meeting:m, isRaceDay:(prev?.isRaceDay??false)||s.sessionName==='Race', status:st });
    }
  }
  return map;
}

function buildGrid(year:number, month:number): (number|null)[] {
  const pad  = (new Date(year,month,1).getDay()+6)%7;
  const days = new Date(year,month+1,0).getDate();
  const out:(number|null)[] = Array(pad).fill(null);
  for (let d=1;d<=days;d++) out.push(d);
  while(out.length%7!==0) out.push(null);
  return out;
}

function weekendDays(m:MeetingEntry, tz:string): string {
  const seen=new Set<string>(); const out:string[]=[];
  [...m.sessions].sort((a,b)=>a.dateStart.localeCompare(b.dateStart)).forEach(s=>{
    const k=localDateStr(s.dateStart,tz);
    if(!seen.has(k)){seen.add(k);out.push(formatInTz(s.dateStart,tz,'EEE dd').toUpperCase());}
  });
  return out.join(' · ');
}

function daysUntil(iso:string){ return Math.ceil((new Date(iso).getTime()-Date.now())/86_400_000); }

// ── dotPing — anillo que se expande desde el dot (usado dentro del badge) ─────
function usePulseAnim() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.loop(Animated.sequence([
      Animated.timing(v,{toValue:1,duration:2200,useNativeDriver:Platform.OS!=='web'}),
      Animated.timing(v,{toValue:0,duration:0,useNativeDriver:Platform.OS!=='web'}),
    ])).start();
  },[]);
  return {
    scale:   v.interpolate({inputRange:[0,.8,1],outputRange:[.5,1.7,1.7]}),
    opacity: v.interpolate({inputRange:[0,.7,1], outputRange:[.9,0,0]}),
  };
}

function PulseDot({color='#fff',size=8}:{color?:string;size?:number}) {
  const {scale,opacity}=usePulseAnim();
  return (
    <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
      <Animated.View style={{
        position:'absolute',
        width:size+8, height:size+8,
        borderRadius:(size+8)/2,
        borderWidth:1.5, borderColor:color,
        transform:[{scale}], opacity,
      }}/>
      <View style={{width:size,height:size,borderRadius:size/2,backgroundColor:color}}/>
    </View>
  );
}

// ── pulseRing — halo que se expande alrededor del badge entero ────────────────
// Replica: @keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(225,6,0,.55)}
//                                 70%{box-shadow:0 0 0 14px rgba(225,6,0,0)} }
function PulseRingBadge({ children }: { children: React.ReactNode }) {
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.loop(Animated.sequence([
      Animated.timing(ring,{toValue:1,duration:2200,useNativeDriver:Platform.OS!=='web'}),
      Animated.timing(ring,{toValue:0,duration:0,useNativeDriver:Platform.OS!=='web'}),
    ])).start();
  },[]);
  const ringScale   = ring.interpolate({inputRange:[0,.7,1],outputRange:[1,1.5,1.5]});
  const ringOpacity = ring.interpolate({inputRange:[0,.7,1],outputRange:[.55,0,0]});
  return (
    <View>
      {/* Expanding red halo behind the badge */}
      <Animated.View style={[
        StyleSheet.absoluteFill,
        {borderRadius:999,backgroundColor:RED,transform:[{scale:ringScale}],opacity:ringOpacity}
      ]}/>
      {children}
    </View>
  );
}

// ── Sweep overlay — péndulo ←→← que replica el CSS ease-in-out infinite ───────
// HTML: @keyframes sweep { 0%,100%{translateX(-35%)} 50%{translateX(35%)} }
//       animation: 6.5s ease-in-out infinite
function SweepOverlay() {
  const anim = useRef(new Animated.Value(-1)).current;  // empieza en -35%
  useEffect(()=>{
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim,{toValue:1, duration:3250,easing:Easing.inOut(Easing.ease),useNativeDriver:Platform.OS!=='web'}),
        Animated.timing(anim,{toValue:-1,duration:3250,easing:Easing.inOut(Easing.ease),useNativeDriver:Platform.OS!=='web'}),
      ])
    ).start();
  },[]);
  // ±180 px ≈ 35% de una card de ~420px — sin saltos, movimiento continuo
  const tx = anim.interpolate({inputRange:[-1,1],outputRange:[-180,180]});
  return (
    <Animated.View style={[
      {position:'absolute',top:0,bottom:0,left:-500,width:1400,transform:[{translateX:tx}]},
      {pointerEvents:'none'} as any,
    ]}>
      <LinearGradient
        colors={['transparent','rgba(225,6,0,0.16)','rgba(255,140,0,0.06)','transparent']}
        locations={[0.3,0.48,0.56,0.7]}
        start={{x:0,y:0}} end={{x:1,y:1}}
        style={{flex:1}}
      />
    </Animated.View>
  );
}

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(iso?:string) {
  const [t,setT]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{
    if(!iso) return;
    const tick=()=>{
      const diff=Math.max(0,new Date(iso).getTime()-Date.now());
      setT({d:Math.floor(diff/86_400_000),h:Math.floor(diff%86_400_000/3_600_000),
            m:Math.floor(diff%3_600_000/60_000),s:Math.floor(diff%60_000/1_000)});
    };
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id);
  },[iso]);
  return t;
}

// ── HERO CARD ─────────────────────────────────────────────────────────────────
function HeroCard({next,tz,tzLabel}:{next:NextEventResponse;tz:string;tzLabel:string}) {
  const T = useTokens();
  const race = next.sessions?.find(s=>s.sessionName==='Race');
  const cd   = useCountdown(race?.dateStart);
  const code = getCountryCode(next.countryName);

  return (
    <View style={[s.hero,
      Platform.OS === 'web'
        ? {boxShadow:'0 26px 60px -30px rgba(225,6,0,.55),0 10px 30px -20px rgba(0,0,0,.7)'} as any
        : {shadowColor:RED,shadowOpacity:.45,shadowRadius:30,shadowOffset:{width:0,height:14},elevation:20},
    ]}>
      <LinearGradient colors={['#1a1a22','#0d0d12']}
        start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
      <SweepOverlay/>
      {Platform.OS==='web' && (
        <View style={[StyleSheet.absoluteFill,{opacity:.5,pointerEvents:'none'} as any,{
          // @ts-ignore — web-only CSS for dot texture
          backgroundImage:'radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)',
          backgroundSize:'5px 5px',
          WebkitMaskImage:'linear-gradient(160deg,#000,transparent 60%)',
        } as any]}/>
      )}

      <View style={{position:'relative',zIndex:1}}>
        {/* Header */}
        <View style={s.heroTop}>
          <PulseRingBadge>
            <View style={s.nextBadge}>
              <PulseDot color="#fff" size={8}/>
              <Text style={s.nextBadgeTxt}>PRÓXIMA CARRERA</Text>
            </View>
          </PulseRingBadge>
          <Text style={s.heroRound}>R{String(next.round).padStart(2,'0')}</Text>
        </View>

        {/* Identity */}
        <View style={s.heroId}>
          <Image source={{uri:`https://flagcdn.com/w80/${code}.png`}}
            style={s.heroFlag} resizeMode="cover"/>
          <View style={{flex:1}}>
            <Text style={s.heroGP} numberOfLines={2}>
              {next.meetingName.replace(' Grand Prix','').toUpperCase()}
            </Text>
            <Text style={s.heroCircuit}>{next.circuitShortName}</Text>
          </View>
        </View>

        {/* Countdown */}
        {race && (
          <View style={s.cdSection}>
            <View style={s.cdLabelRow}>
              <View style={{width:14,height:3,backgroundColor:RED,borderRadius:2}}/>
              <Text style={s.cdSectionLbl}>SEMÁFORO EN VERDE EN</Text>
            </View>
            <View style={s.cdUnits}>
              {[{v:cd.d,l:'DÍAS'},{v:cd.h,l:'HRS'},{v:cd.m,l:'MIN'},{v:cd.s,l:'SEG'}].map(({v,l})=>(
                <View key={l} style={s.cdBox}>
                  <Text style={s.cdNum}>{String(v).padStart(2,'0')}</Text>
                  <Text style={s.cdLbl}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Session chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:2}}>
          <View style={{flexDirection:'row',gap:8}}>
            {next.sessions?.map(sess=>{
              const isRace=sess.sessionName==='Race';
              const code2=SESSION_CODES[sess.sessionName]??sess.sessionName.slice(0,4).toUpperCase();
              return (
                <View key={sess.sessionKey} style={[s.sessChip,isRace&&s.sessChipRace]}>
                  <Text style={[s.sessCode,isRace&&{color:'rgba(255,255,255,.8)'}]}>{code2}</Text>
                  <Text style={s.sessDay}>{formatInTz(sess.dateStart,tz,'EEE dd').toUpperCase()}</Text>
                  <Text style={s.sessTime}>{formatInTz(sess.dateStart,tz,'HH:mm')}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <Text style={s.tzNote}>HORARIOS · {tzLabel.toUpperCase()}</Text>
      </View>
    </View>
  );
}

// ── DOT PULSE (calendar) ─────────────────────────────────────────────────────
function DotPulse({color}:{color:string}) {
  const {scale,opacity}=usePulseAnim();
  return (
    <View style={{width:5,height:5,alignItems:'center',justifyContent:'center'}}>
      <Animated.View style={{position:'absolute',width:9,height:9,borderRadius:5,
        borderWidth:1.5,borderColor:color,transform:[{scale}],opacity}}/>
      <View style={{width:5,height:5,borderRadius:3,backgroundColor:color}}/>
    </View>
  );
}

// ── MINI CALENDAR ─────────────────────────────────────────────────────────────
function MiniCalendar({
  meetings,tz,dayMap,todayKey,
  viewYear,viewMonth,onPrev,onNext,onDayPress,
}:{
  meetings:MeetingEntry[]; tz:string;
  dayMap:Map<string,CellData>; todayKey:string;
  viewYear:number; viewMonth:number;
  onPrev:()=>void; onNext:()=>void;
  onDayPress:(m:MeetingEntry)=>void;
}) {
  const T = useTokens();

  // Cell background colors matching HTML color-mix exactly
  const rPastBg  = T.isDark ? '#1D1D26'              : '#F1EFE7';
  const rNextBg  = T.isDark ? 'rgba(225,6,0,0.14)'   : 'rgba(225,6,0,0.10)';
  const rNextBdr = T.isDark ? 'rgba(225,6,0,0.35)'   : 'rgba(225,6,0,0.30)';
  const rFutBg   = T.isDark ? 'rgba(255,215,0,0.16)' : 'rgba(255,215,0,0.12)';

  // Sub-label: "X CARRERAS · R08 — R10"
  const prefix = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-`;
  const seen = new Set<number>(); const rounds:number[]=[];
  meetings.forEach(m=>{
    if(seen.has(m.meetingKey)) return;
    if(m.sessions.some(s=>localDateStr(s.dateStart,tz).startsWith(prefix))){
      seen.add(m.meetingKey);
      rounds.push(meetings.findIndex(x=>x.meetingKey===m.meetingKey)+1);
    }
  });
  const sub = rounds.length
    ? `${rounds.length} CARR. · R${String(rounds[0]).padStart(2,'0')}${rounds.length>1?` — R${String(rounds[rounds.length-1]).padStart(2,'0')}`:''}`
    : 'SIN CARRERAS';

  const cells = useMemo(()=>buildGrid(viewYear,viewMonth),[viewYear,viewMonth]);
  const weekRows:(number|null)[][]=[];
  for(let i=0;i<cells.length;i+=7) weekRows.push(cells.slice(i,i+7));

  return (
    <View style={[s.calCard,{backgroundColor:T.surface,borderColor:T.sep}]}>
      {/* Nav */}
      <View style={s.calNav}>
        <TouchableOpacity style={[s.calArrow,{borderColor:T.sep}]} onPress={onPrev} hitSlop={10}>
          <Text style={{fontFamily:FA,fontSize:18,lineHeight:22,color:T.ink2}}>‹</Text>
        </TouchableOpacity>
        <View style={{alignItems:'center'}}>
          <Text style={[s.calTitle,{color:T.ink}]}>
            {MONTHS[viewMonth].toUpperCase()}{' '}
            <Text style={{color:T.muted}}>{viewYear}</Text>
          </Text>
        </View>
        <TouchableOpacity style={[s.calArrow,{borderColor:T.sep}]} onPress={onNext} hitSlop={10}>
          <Text style={{fontFamily:FA,fontSize:18,lineHeight:22,color:T.ink2}}>›</Text>
        </TouchableOpacity>
      </View>
      <Text style={[s.calSub,{color:T.muted}]}>{sub}</Text>

      {/* DOW headers */}
      <View style={{flexDirection:'row',gap:2,marginBottom:4}}>
        {DOW_LABELS.map(d=>(
          <View key={d} style={{flex:1,alignItems:'center',paddingBottom:4}}>
            <Text style={{fontFamily:SMB,fontSize:9,letterSpacing:.08,color:T.muted}}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid — flex:1 + aspectRatio:1 = perfect squares filling full width */}
      <View style={{gap:2}}>
        {weekRows.map((week,wi)=>(
          <View key={wi} style={{flexDirection:'row',gap:2}}>
            {week.map((day,di)=>{
              const k   = day ? dayKey(viewYear,viewMonth,day) : `p-${wi}-${di}`;
              const data = day ? dayMap.get(dayKey(viewYear,viewMonth,day)) : undefined;
              const isToday = k===todayKey;
              const isPast  = day ? k<todayKey : false;
              const st      = data?.status;
              const isRace  = data?.isRaceDay??false;
              const isNextSun = isRace && st==='next';

              let bg:string|undefined;
              if(data){
                if(st==='past')   bg=rPastBg;
                else if(st==='next')   bg=rNextBg;
                else if(st==='future') bg=rFutBg;
              }
              const dotColor = st==='past'?T.muted:st==='next'?RED:GOLD;
              let borderColor='transparent';
              if(isToday) borderColor=T.ink;
              else if(data&&st==='next') borderColor=rNextBdr;

              return (
                <TouchableOpacity key={k}
                  onPress={()=>data?.meeting&&onDayPress(data.meeting)}
                  disabled={!data&&!isToday} activeOpacity={data?0.75:1}
                  style={[
                    {
                      flex:1, aspectRatio:1, borderRadius:9, borderWidth:1,
                      alignItems:'center', justifyContent:'center', gap:2,
                      overflow:'hidden', borderColor,
                      // Explicit backgroundColor — avoids conditional-object edge cases
                      backgroundColor: bg ?? 'transparent',
                    },
                    isNextSun&&(Platform.OS==='web'
                      ?{boxShadow:'inset 0 0 0 1.5px #E10600,0 6px 16px -8px #E10600'} as any
                      :{shadowColor:RED,shadowOpacity:.6,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:6}) as any,
                  ]}
                >
                  {day&&(
                    <>
                      <Text style={{
                        fontFamily:SMB,fontSize:13,
                        fontWeight:isToday?'800':'600',
                        color:isToday?T.ink:isPast&&!data?T.muted:T.ink,
                        opacity:isPast&&!data?.meeting?.meetingKey?0.5:1,
                      }}>{day}</Text>
                      {isToday&&(
                        <Text style={{position:'absolute',bottom:2,
                          fontFamily:SMB,fontSize:6.5,letterSpacing:.1,color:T.ink}}>HOY</Text>
                      )}
                      {data&&(st==='next'?<DotPulse color={RED}/>
                        :<View style={{width:5,height:5,borderRadius:3,backgroundColor:dotColor}}/>
                      )}
                      {isRace&&data?.meeting&&(
                        <Image
                          source={{uri:`https://flagcdn.com/w20/${getCountryCode(data.meeting.countryName)}.png`}}
                          style={{position:'absolute',top:3,right:3,width:14,height:9,borderRadius:2}}
                          resizeMode="cover"
                        />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={[s.legend,{borderTopColor:T.line2}]}>
        {[{c:T.muted,l:'PASADAS'},{c:RED,l:'PRÓXIMA'},{c:GOLD,l:'PROGRAMADAS'}].map(({c,l})=>(
          <View key={l} style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <View style={{width:9,height:9,borderRadius:5,backgroundColor:c}}/>
            <Text style={{fontFamily:SM,fontSize:9,letterSpacing:.1,color:T.muted}}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── PODIUM CHIP — TeamDot (circle) + position + abbreviation ─────────────────
function PodiumChip({pos,abbr,teamColor}:{pos:1|2|3;abbr:string;teamColor:string}) {
  const T = useTokens();
  const isFirst = pos===1;
  return (
    <View style={[s.pod,{
      backgroundColor: T.surface,
      borderColor: isFirst ? 'rgba(224,169,46,0.6)' : T.sep,
    }]}>
      {/* TeamDot: small filled circle with team color */}
      <View style={{width:8,height:8,borderRadius:4,backgroundColor:teamColor}}/>
      <Text style={{fontFamily:SMB,fontSize:9,color:isFirst?GOLD:T.muted}}>P{pos}</Text>
      <Text style={{fontFamily:SMB,fontSize:11,color:T.ink2}}>{abbr}</Text>
    </View>
  );
}

interface FavoriteEntry { abbreviation:string; teamColor:string }

// ── RACE CARD ─────────────────────────────────────────────────────────────────
function RaceCard({meeting,round,status,tz,onPress,favorites}:{
  meeting:MeetingEntry; round:number; status:Status; tz:string; onPress:()=>void;
  favorites?: FavoriteEntry[] | null;
}) {
  const T = useTokens();
  const { podium } = useRaceResults(status==='past' ? round : null);

  const days = weekendDays(meeting,tz);
  const code = getCountryCode(meeting.countryName);
  const raceDate = meeting.sessions.find(s=>s.sessionName==='Race')?.dateStart;
  const d = raceDate?daysUntil(raceDate):0;
  const isPast=status==='past', isNext=status==='next', isFut=status==='future';

  // Explicit per-state bg so light mode differences are clear
  const cardBg = isPast ? T.surface2
    : isNext ? (T.isDark ? 'rgba(225,6,0,0.07)' : 'rgba(225,6,0,0.06)')
    : T.surface;
  const cardBorder = isNext
    ? 'rgba(225,6,0,0.40)'
    : T.sep;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={[s.raceCard,{borderColor:cardBorder,backgroundColor:cardBg}]}
    >
      {/* Left red bar with glow — next race only */}
      {isNext&&(
        <View style={[s.raceBar,{backgroundColor:RED},
          Platform.OS==='web'
            ?{boxShadow:'2px 0 12px #E10600'} as any
            :{shadowColor:RED,shadowOpacity:.9,shadowRadius:8,shadowOffset:{width:2,height:0}} as any,
        ]}/>
      )}

      {/* Flag */}
      <View style={[s.raceFlag,isPast&&{opacity:0.65,
        ...(Platform.OS==='web'?{filter:'saturate(0.55)'}:{})}]}>
        <Image source={{uri:`https://flagcdn.com/w80/${code}.png`}}
          style={{width:'100%',height:'100%'}} resizeMode="cover"/>
      </View>

      {/* Info */}
      <View style={{flex:1}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Text style={[s.raceName,{color:isPast?T.ink2:T.ink}]} numberOfLines={1}>
            {meeting.meetingName.replace(' Grand Prix','').toUpperCase()}
          </Text>
          <Text style={{fontFamily:SMB,fontSize:11,letterSpacing:.1,color:T.muted}}>
            R{String(round).padStart(2,'0')}
          </Text>
        </View>
        <Text style={{fontFamily:SM,fontSize:11,color:T.muted,marginTop:4}}>
          {meeting.circuitShortName}
        </Text>
        <Text style={{fontFamily:SMB,fontSize:11,letterSpacing:.04,
          color:isPast?T.ink2:T.ink,marginTop:5}}>
          {days}
        </Text>
        {/* Podium chips — past races with results */}
        {isPast&&podium&&podium.length>=3&&(
          <View style={s.podium}>
            <PodiumChip pos={1} abbr={podium[0].abbreviation} teamColor={podium[0].teamColor}/>
            <PodiumChip pos={2} abbr={podium[1].abbreviation} teamColor={podium[1].teamColor}/>
            <PodiumChip pos={3} abbr={podium[2].abbreviation} teamColor={podium[2].teamColor}/>
          </View>
        )}
        {/* Championship leaders shown as "favorites" for next race */}
        {isNext&&favorites&&favorites.length>=3&&(
          <View style={{marginTop:8}}>
            <Text style={{fontFamily:SM,fontSize:8,color:T.muted,letterSpacing:.12,marginBottom:4}}>
              LÍDERES CAMPEONATO
            </Text>
            <View style={s.podium}>
              <PodiumChip pos={1} abbr={favorites[0].abbreviation} teamColor={favorites[0].teamColor}/>
              <PodiumChip pos={2} abbr={favorites[1].abbreviation} teamColor={favorites[1].teamColor}/>
              <PodiumChip pos={3} abbr={favorites[2].abbreviation} teamColor={favorites[2].teamColor}/>
            </View>
          </View>
        )}
      </View>

      {/* Status */}
      <View style={{alignItems:'flex-end',alignSelf:'flex-start',minWidth:72,gap:4}}>
        {isPast&&<Text style={{fontFamily:SMB,fontSize:10,color:T.muted,letterSpacing:.14}}>FINALIZADO</Text>}
        {isNext&&(
          <>
            <View style={{flexDirection:'row',alignItems:'center',gap:7}}>
              <PulseDot color={RED} size={8}/>
              <Text style={{fontFamily:SMB,fontSize:10,color:RED,letterSpacing:.14}}>PRÓXIMA</Text>
            </View>
            {d>0&&<Text style={{fontFamily:SM,fontSize:8,color:RED,letterSpacing:.1}}>EN {d} DÍAS</Text>}
          </>
        )}
        {isFut&&<Text style={{fontFamily:SMB,fontSize:10,color:GOLD,letterSpacing:.14}}>PROGRAMADA</Text>}
        {status==='cancelled'&&<Text style={{fontFamily:SMB,fontSize:10,color:T.muted,letterSpacing:.1}}>SIN DATOS</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const T = useTokens();
  const { width } = useWindowDimensions();
  const { data: schedData }    = useSchedule();
  const { data: nextEvt }      = useNextEvent();
  const { data: standingsData } = useDriverStandings();
  const { tz, tzOption }       = useTimezone();

  const now      = new Date();
  const todayKey2 = dayKey(now.getFullYear(),now.getMonth(),now.getDate());

  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected,  setSelected]  = useState<MeetingEntry|null>(null);

  const meetings    = schedData?.meetings??[];
  const nextMeeting = meetings.find(m=>!m.isCancelled&&new Date(m.dateEnd)>now);

  const dayMap = useMemo(
    ()=>buildDayMap(meetings,tz,nextMeeting?.meetingKey,now),
    [meetings,tz,nextMeeting?.meetingKey]
  );

  const prevMonth = useCallback(()=>{
    if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}
    else setViewMonth(m=>m-1);
  },[viewMonth]);
  const nextMonth = useCallback(()=>{
    if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}
    else setViewMonth(m=>m+1);
  },[viewMonth]);

  const tzLabel = tzOption?tzOption.label:'UTC';
  const showHero = nextEvt&&nextEvt.mode!=='lastRace'&&nextEvt.meetingName;
  const isWide   = width>=768;

  // Left column: 420px on wide screens
  const LEFT_W = Math.min(420, width * 0.42);

  const leftContent = (
    <View style={{gap:20,padding:16,paddingBottom:32}}>
      {showHero&&(
        <HeroCard next={nextEvt as NextEventResponse} tz={tz} tzLabel={tzLabel}/>
      )}
      <MiniCalendar
        meetings={meetings} tz={tz} dayMap={dayMap} todayKey={todayKey2}
        viewYear={viewYear} viewMonth={viewMonth}
        onPrev={prevMonth} onNext={nextMonth}
        onDayPress={setSelected}
      />
    </View>
  );

  const rightContent = (
    <View style={{padding:16,paddingBottom:40}}>
      {/* Header */}
      <View style={{flexDirection:'row',justifyContent:'space-between',
        alignItems:'baseline',marginBottom:4,paddingHorizontal:2}}>
        <Text style={{fontFamily:SMB,fontSize:12,letterSpacing:.24,color:T.muted}}>
          CALENDARIO {now.getFullYear()}
        </Text>
        <Text style={{fontFamily:SM,fontSize:12,color:T.muted}}>{meetings.length} FECHAS</Text>
      </View>
      {/* Separator with red gradient */}
      <View style={{height:1,marginVertical:10,marginHorizontal:2,overflow:'hidden',
        backgroundColor:T.sep}}>
        <View style={{position:'absolute',left:0,top:0,bottom:0,width:'40%',
          backgroundColor:RED,opacity:.7}}/>
      </View>

      <View style={{gap:10}}>
        {meetings.map((m,i)=>{
          const st:Status = m.isCancelled?'cancelled'
            :new Date(m.dateEnd)<now?'past'
            :m.meetingKey===nextMeeting?.meetingKey?'next'
            :'future';
          // For next race: pass top-3 standings as championship favorites
          const favorites = st === 'next' && standingsData?.standings
            ? standingsData.standings.slice(0, 3).map(d => ({
                abbreviation: d.abbreviation,
                teamColor: d.teamColor,
              }))
            : null;

          return (
            <RaceCard key={m.meetingKey} meeting={m} round={i+1}
              status={st} tz={tz} onPress={()=>setSelected(m)} favorites={favorites}/>
          );
        })}
      </View>

      <Text style={{fontFamily:SM,fontSize:10,letterSpacing:.2,color:T.muted,
        textAlign:'center',marginTop:30}}>
        PITWALL · TEMPORADA {now.getFullYear()} · {meetings.length} GRANDES PREMIOS
      </Text>
    </View>
  );

  // Web-only dot texture on light mode background
  const webBgTexture = Platform.OS === 'web' && !T.isDark ? {
    backgroundImage: 'radial-gradient(rgba(20,20,28,.04) 1px,transparent 1px)',
    backgroundSize: '4px 4px',
  } as any : {};

  return (
    <View style={[{flex:1,backgroundColor:T.bg}, webBgTexture]}>
      {isWide ? (
        <View style={{flex:1,flexDirection:'row'}}>
          <ScrollView style={{width:LEFT_W,borderRightWidth:1,borderRightColor:T.sep}}
            showsVerticalScrollIndicator={false}>
            {leftContent}
          </ScrollView>
          <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false}>
            {rightContent}
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false}>
          {leftContent}
          {rightContent}
        </ScrollView>
      )}

      <RaceDetailModal
        meeting={selected}
        round={selected?meetings.findIndex(m=>m.meetingKey===selected.meetingKey)+1:1}
        totalRounds={schedData?.totalRounds??24}
        onClose={()=>setSelected(null)}
      />
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Hero — always dark regardless of theme
  hero: {borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,.08)',
    padding:22,paddingBottom:20,backgroundColor:'#0d0d12'},
  heroTop: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},
  nextBadge: {flexDirection:'row',alignItems:'center',gap:9,
    backgroundColor:RED,paddingHorizontal:12,paddingVertical:7,borderRadius:999},
  nextBadgeTxt: {fontFamily:SMB,fontSize:11,color:'#fff',letterSpacing:.2},
  heroRound: {fontFamily:SMB,fontSize:13,color:'rgba(255,255,255,.55)',letterSpacing:.12},
  heroId: {flexDirection:'row',alignItems:'center',gap:16,marginBottom:22},
  heroFlag: {width:62,height:42,borderRadius:4,borderWidth:1,borderColor:'rgba(255,255,255,.12)'},
  heroGP: {fontFamily:FA,fontSize:40,color:'#F3F1EA',lineHeight:40,textTransform:'uppercase'},
  heroCircuit: {fontFamily:SM,fontSize:12,color:'rgba(243,241,234,.6)',letterSpacing:.04,marginTop:6},
  cdSection: {borderTopWidth:1,borderBottomWidth:1,borderColor:'rgba(255,255,255,.1)',
    paddingVertical:16,marginBottom:18},
  cdLabelRow: {flexDirection:'row',alignItems:'center',gap:8,marginBottom:12},
  cdSectionLbl: {fontFamily:SM,fontSize:10,color:'rgba(243,241,234,.5)',letterSpacing:.26},
  cdUnits: {flexDirection:'row',gap:10},
  cdBox: {flex:1,alignItems:'center',backgroundColor:'rgba(255,255,255,.04)',
    borderWidth:1,borderColor:'rgba(255,255,255,.07)',borderRadius:10,paddingVertical:10},
  cdNum: {fontFamily:FA,fontSize:34,color:'#F3F1EA',lineHeight:36},
  cdLbl: {fontFamily:SM,fontSize:9,color:'rgba(243,241,234,.45)',letterSpacing:.18,marginTop:7},
  sessChip: {borderWidth:1,borderColor:'rgba(255,255,255,.1)',borderRadius:10,
    paddingHorizontal:11,paddingVertical:8,minWidth:78},
  sessChipRace: {backgroundColor:RED,borderColor:RED},
  sessCode: {fontFamily:SM,fontSize:9,color:'rgba(243,241,234,.5)',letterSpacing:.14,textTransform:'uppercase'},
  sessDay: {fontFamily:FA,fontSize:11,color:'rgba(243,241,234,.85)',marginTop:5},
  sessTime: {fontFamily:SMB,fontSize:14,color:'#F3F1EA',marginTop:1},
  tzNote: {fontFamily:SM,fontSize:9,color:'rgba(243,241,234,.4)',letterSpacing:.16,marginTop:10,textAlign:'right'},

  // Calendar
  calCard: {borderRadius:18,borderWidth:1,paddingTop:18,paddingHorizontal:16,paddingBottom:16},
  calNav: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},
  calArrow: {width:34,height:34,borderRadius:9,borderWidth:1,alignItems:'center',justifyContent:'center'},
  calTitle: {fontFamily:FA,fontSize:20,letterSpacing:.02,textTransform:'uppercase'},
  calSub: {fontFamily:SM,fontSize:10,letterSpacing:.2,textAlign:'center',marginBottom:14},
  legend: {flexDirection:'row',flexWrap:'wrap',gap:14,marginTop:16,paddingTop:14,borderTopWidth:1},

  // Race cards
  raceCard: {flexDirection:'row',alignItems:'center',borderRadius:14,borderWidth:1,
    overflow:'hidden',paddingVertical:14,paddingRight:14,paddingLeft:14,gap:14},
  raceBar: {position:'absolute',left:0,top:0,bottom:0,width:4},
  raceFlag: {width:42,height:28,borderRadius:4,overflow:'hidden',
    borderWidth:1,borderColor:'rgba(0,0,0,.1)',flexShrink:0},
  raceName: {fontFamily:FA,fontWeight:'900',fontSize:22,flex:1,lineHeight:23,letterSpacing:-.01},
  podium: {flexDirection:'row',gap:6,marginTop:10,flexWrap:'wrap'},
  pod: {flexDirection:'row',alignItems:'center',gap:5,
    borderWidth:1,borderRadius:7,paddingHorizontal:8,paddingVertical:4},
});
