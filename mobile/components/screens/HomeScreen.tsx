/**
 * HomeScreen — "Tu Temporada"
 * Exact match to design_handoff_pitwall/Pitwall Home.html
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, FlatList, Platform, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useNextEvent } from '@/hooks/useNextEvent';
import { useResults } from '@/hooks/useResults';
import { useDriverStandings, useConstructorStandings } from '@/hooks/useStandings';
import { useTimezone, formatInTz } from '@/hooks/useTimezone';
import { DRIVER_CODES, getCountryCode } from '@/constants/flags';
import { TEAM } from '@/constants/colors';
import { getCircuitByEvent, COMPOUND_COLORS } from '@/constants/circuits';
import { useHeadlines, Headline } from '@/hooks/useHeadlines';
import Tooltip from '@/components/ui/Tooltip';
import CircuitMap from '@/components/ui/CircuitMap';
import F1Loader from '@/components/ui/F1Loader';
import { useI18n } from '@/context/I18nContext';

// ── Font tokens ───────────────────────────────────────────────────────────────
const A9  = 'Archivo_900Black';
const A8  = 'Archivo_800ExtraBold';
const A7  = 'Archivo_700Bold';
const A6  = 'Archivo_600SemiBold';
const SM  = 'SpaceMono_400Regular';
const SMB = 'SpaceMono_700Bold';

const RED  = '#E10600';
const GOLD = '#C99A2E'; // light mode gold per spec

// Circuit data now comes from constants/circuits.ts

// ── Form chips (mock per standings position) ──────────────────────────────────
function mockForm(pos: number): string[] {
  if (pos === 1)         return ['1','1','3','2','1'];
  if (pos <= 3)          return ['2','4','1','3','2'];
  if (pos <= 5)          return ['5','2','4','6','3'];
  if (pos <= 8)          return ['7','6','5','8','7'];
  if (pos <= 12)         return ['9','11','8','10','9'];
  return                        ['12','AB','13','14','12'];
}

// TYRE_COLORS removed — compounds now use COMPOUND_COLORS from constants/circuits.ts

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({
  title, right, onRight,
}: { title: string; right?: string; onRight?: () => void }) {
  const C = useColors();
  return (
    <View style={[s.secLabel]}>
      <View style={s.secLeft}>
        <View style={[s.secRedBar, { backgroundColor: C.red }]} />
        <Text style={[s.secTitle, { color: C.muted }]}>
          <Text style={{ color: C.red }}>{title.split(' ')[0]}</Text>
          {title.includes(' ') ? ' ' + title.split(' ').slice(1).join(' ') : ''}
        </Text>
      </View>
      <View style={[s.secLine, { backgroundColor: C.line }]} />
      {right && (
        <TouchableOpacity onPress={onRight} disabled={!onRight}>
          <Text style={[s.secRight, { color: onRight ? C.red : C.ink2 }]}>{right}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Form chip ─────────────────────────────────────────────────────────────────
function FormChip({ v, C }: { v: string; C: ReturnType<typeof useColors> }) {
  const isWin = v === '1';
  const isPod = v === '2' || v === '3';
  const isAb  = v === 'AB';
  const gold = C.gold;
  return (
    <View style={[
      s.fchip,
      { backgroundColor: C.surface2, borderColor: C.line },
      isWin && { backgroundColor: gold, borderColor: gold },
      isPod && { backgroundColor: 'transparent', borderColor: `${gold}99` },
      isAb  && { opacity: 0.5 },
    ]}>
      <Text style={[
        s.fchipTxt,
        { color: C.ink2 },
        isWin && { color: '#fff' },
        isPod && { color: gold },
        isAb  && { color: C.muted },
      ]}>{v}</Text>
    </View>
  );
}

// ── Driver card ───────────────────────────────────────────────────────────────
function DriverCard({
  driver, nextEvent, results, onChangeTap,
}: {
  driver: any; nextEvent: any; results: any; onChangeTap: () => void;
}) {
  const C = useColors();
  const { t } = useI18n();
  const { tz } = useTimezone();
  const tc = TEAM[driver.teamName as keyof typeof TEAM] ?? '#8A8A8E';
  const flagCode = DRIVER_CODES[driver.abbreviation] ?? 'un';
  const form = mockForm(driver.position);

  // Days until next race
  const raceDate = nextEvent?.sessions?.find((s: any) => s.sessionName === 'Race')?.dateStart;
  const daysUntil = raceDate
    ? Math.ceil((new Date(raceDate).getTime() - Date.now()) / 86_400_000)
    : null;

  // Last race result for this driver
  const lastResult = results?.results?.find((r: any) => r.abbreviation === driver.abbreviation);
  const lastStr = lastResult ? `P${lastResult.position}` : '—';

  return (
    <View style={[s.driverCard, { backgroundColor: C.surface, borderColor: C.line }]}>
      {/* Badge (left col 118px) */}
      <View style={[s.dcBadge, {
        ...(Platform.OS === 'web'
          ? { backgroundImage: `linear-gradient(155deg,${tc} 0%,${tc}60 100%)` } as any
          : { backgroundColor: tc }),
      }]}>
        {/* Dot texture */}
        {Platform.OS === 'web' && (
          <View style={[StyleSheet.absoluteFill, {
            backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px)',
            backgroundSize: '6px 6px', opacity: 0.5,
          } as any]} />
        )}
        <TouchableOpacity style={s.dcChange} onPress={onChangeTap}>
          <Text style={s.dcChangeTxt}>{t('home.change')}</Text>
        </TouchableOpacity>
        <Text style={s.dcNum}>{driver.driverNumber ?? '—'}</Text>
        <View style={s.dcFlag}>
          <Image
            source={{ uri: `https://flagcdn.com/w40/${flagCode}.png` }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Body (flex 1) */}
      <View style={s.dcBody}>
        <Text style={[s.dcFirst, { color: C.muted }]}>{driver.firstName}</Text>
        <Text style={[s.dcLast, { color: C.ink }]}>{driver.lastName.toUpperCase()}</Text>
        <View style={s.dcTeam}>
          <View style={[s.teamDot, { backgroundColor: tc }]} />
          <Text style={[s.dcTeamName, { color: C.ink2 }]}>{driver.teamName}</Text>
        </View>

        <View style={[s.dcStats, { borderTopColor: C.line2 }]}>
          {[
            { v: `P${driver.position}`, l: t('home.position') },
            { v: `${driver.points}`, l: t('home.points') },
            { v: lastStr, l: t('home.last') },
          ].map(({ v, l }) => (
            <View key={l} style={s.dcStat}>
              <Text style={[s.dcStatVal, { color: C.ink }]}>{v}</Text>
              <Text style={[s.dcStatLbl, { color: C.muted }]}>{l}</Text>
            </View>
          ))}
        </View>

        <View style={s.dcForm}>
          <Text style={[s.dcFormLbl, { color: C.muted }]}>{t('home.form')}</Text>
          {form.map((v, i) => <FormChip key={i} v={v} C={C} />)}
        </View>

        {nextEvent?.meetingName && daysUntil !== null && daysUntil > 0 && (
          <View style={s.dcNext}>
            <Text style={[s.dcNextNx, { color: C.muted }]}>{t('home.next')}</Text>
            <Text style={[s.dcNextTxt, { color: C.ink2 }]}>
              {nextEvent.meetingName.replace(' Grand Prix', '')} · en {daysUntil} días
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Last GP card ──────────────────────────────────────────────────────────────
function LastGPCard({ results }: { results: any }) {
  const C = useColors();
  const { t } = useI18n();
  if (!results?.results?.length) return null;

  const r = results;
  const p1 = r.results.find((d: any) => d.position === 1);
  const p2 = r.results.find((d: any) => d.position === 2);
  const p3 = r.results.find((d: any) => d.position === 3);
  const fl = r.results.find((d: any) => d.fastestLap);
  const flagCode = DRIVER_CODES[p1?.abbreviation ?? ''] ?? 'un';
  const tc1 = TEAM[p1?.teamName as keyof typeof TEAM] ?? '#8A8A8E';

  return (
    <View style={[s.card, { backgroundColor: C.surface, borderColor: C.line }]}>
      {/* Winner row */}
      <View style={[s.winnerRow, { borderBottomColor: C.line2 }]}>
        <View style={[s.wFlag, { borderColor: C.line }]}>
          <Image source={{ uri: `https://flagcdn.com/w80/${flagCode}.png` }}
            style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.wName, { color: C.ink }]}>
            {p1?.firstName?.[0]}. {p1?.lastName}
          </Text>
          <View style={s.wMeta}>
            <View style={[s.teamDotSm, { backgroundColor: tc1 }]} />
            <Text style={[s.wMetaTxt, { color: C.muted }]}>
              {p1?.teamName} · {p1?.gap ?? 'GANADOR'}
            </Text>
          </View>
        </View>
        <View style={[s.winTag, { borderColor: `${C.gold}77` }]}>
          <Text style={[s.winTagTxt, { color: C.gold }]}>{t('home.winner')}</Text>
        </View>
      </View>

      {/* Podium chips */}
      {p1 && p2 && p3 && (
        <View style={s.podiumRow}>
          {[p1, p2, p3].map((d: any, i: number) => {
            const tc = TEAM[d.teamName as keyof typeof TEAM] ?? '#8A8A8E';
            return (
              <View key={d.driverNumber} style={[s.podChip, { backgroundColor: C.surface2, borderColor: C.line }]}>
                <View style={[s.podBar, { backgroundColor: tc }]} />
                <Text style={[s.podPos, { color: C.muted }]}>P{i + 1}</Text>
                <Text style={[s.podAbbr, { color: C.ink2 }]}>{d.abbreviation}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Extra grid */}
      <View style={[s.gpExtra, { borderColor: C.line, backgroundColor: C.line }]}>
        <View style={[s.gx, { backgroundColor: C.surface }]}>
          <Text style={[s.gxLabel, { color: C.muted }]}>{t('home.fastestLap')}</Text>
          <Text style={[s.gxVal, { color: C.ink }]}>
            {fl?.abbreviation ?? '—'}
          </Text>
        </View>
        <View style={[s.gx, { backgroundColor: C.surface }]}>
          <Text style={[s.gxLabel, { color: C.muted }]}>GP</Text>
          <Text style={[s.gxVal, { color: C.ink }]}>{r.circuitShortName}</Text>
        </View>
      </View>

      <Text style={[s.headline, { color: C.ink2 }]}>
        {p1?.lastName} se impone en {r.circuitShortName} y suma {p1?.points} puntos en el campeonato.
      </Text>
    </View>
  );
}

// ── Title fight ───────────────────────────────────────────────────────────────
function TitleFightCard({
  label, leader, second, leaderColor, leaderPts, secondPts, remaining,
}: {
  label: string; leader: string; second: string;
  leaderColor: string; leaderPts: number; secondPts: number; remaining?: string;
}) {
  const C = useColors();
  const gap = leaderPts - secondPts;
  const pct = secondPts / leaderPts;

  return (
    <View style={[s.card, s.fightCard, { backgroundColor: C.surface, borderColor: C.line }]}>
      <Text style={[s.ffLbl, { color: C.muted }]}>{label}</Text>
      <View style={s.ffLeaderRow}>
        <Text style={[s.ffLeader, { color: C.ink }]}>{leader}</Text>
        <Text style={[s.ffGap, { color: C.red }]}>+{gap}</Text>
      </View>
      <Text style={[s.ffSub, { color: C.muted }]}>
        sobre {second} · {leaderPts} pts
      </Text>
      <View style={s.ffBars}>
        <View style={[s.ffBarBg, { backgroundColor: C.line2 }]}>
          <View style={[s.ffBarFill, { width: '100%', backgroundColor: leaderColor }]} />
        </View>
        <View style={[s.ffBarBg, { backgroundColor: C.line2 }]}>
          <View style={[s.ffBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: C.dim }]} />
        </View>
      </View>
    </View>
  );
}

// ── Top 5 table ───────────────────────────────────────────────────────────────
function Top5Table({ drivers }: { drivers: any[] }) {
  const C = useColors();
  const router = useRouter();

  return (
    <View style={[s.card, { backgroundColor: C.surface, borderColor: C.line, padding: 0 }]}>
      {drivers.slice(0, 5).map((d: any, i: number) => {
        const flagCode = DRIVER_CODES[d.abbreviation] ?? 'un';
        const isLead = i === 0;
        return (
          <View key={d.driverNumber}
            style={[s.t5Row, i > 0 && { borderTopWidth: 1, borderTopColor: C.line2 }]}>
            <Text style={[s.t5Pos, { color: isLead ? C.gold : C.muted }]}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Image source={{ uri: `https://flagcdn.com/w20/${flagCode}.png` }}
              style={s.t5Flag} resizeMode="cover" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.t5Name, { color: C.ink }]}>{d.lastName.toUpperCase()}</Text>
              <Text style={[s.t5Team, { color: C.muted }]}>{d.teamName}</Text>
            </View>
            <Text style={[s.t5Pts, { color: isLead ? C.gold : C.ink }]}>{d.points}</Text>
          </View>
        );
      })}
    </View>
  );
}


function CircuitCard({ nextEvent }: { nextEvent: any }) {
  const C = useColors();
  const { t } = useI18n();
  if (!nextEvent) return null;

  const circ        = getCircuitByEvent(nextEvent);
  const countryCode = getCountryCode(nextEvent.countryName ?? '');

  const name      = circ?.name      ?? nextEvent.circuitShortName ?? nextEvent.meetingName?.replace(' Grand Prix','') ?? '—';
  const country   = circ?.country   ?? nextEvent.countryName ?? '—';
  const km        = circ?.km        != null ? String(circ.km)    : '—';
  const turns     = circ?.turns     != null ? String(circ.turns) : '—';
  const laps      = circ?.laps      != null ? String(circ.laps)  : '—';
  const drs       = circ?.drs       != null ? String(circ.drs)   : '—';
  const compounds = circ?.compounds ?? ['C3', 'C4', 'C5'];
  const record    = circ?.record    ?? '—';

  return (
    <View style={[s.card, { backgroundColor: C.surface, borderColor: C.line }]}>
      {/* Header */}
      <View style={s.circHead}>
        <View style={[s.circFlag, { borderColor: C.line }]}>
          <Image source={{ uri: `https://flagcdn.com/w40/${countryCode}.png` }}
            style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View>
          <Text style={[s.circName, { color: C.ink }]}>{name.toUpperCase()}</Text>
          <Text style={[s.circLoc, { color: C.muted }]}>{country}</Text>
        </View>
      </View>

      {/* Circuit map */}
      <CircuitMap circuitKey={circ?.key ?? ''} height={170} />

      {/* Stats grid — overflow:visible so Tooltip can escape the container */}
      <View style={[s.circStats, { borderColor: C.line }]}>
        {[
          { v: km,    l: t('calendar.circuit.length'), tip: null as null },
          { v: turns, l: t('calendar.circuit.turns'),  tip: null as null },
          { v: laps,  l: t('calendar.circuit.laps'),   tip: null as null },
          { v: drs,   l: t('calendar.circuit.drs'), tip: { title: t('tooltips.drs.title'), text: t('tooltips.drs.text') } },
        ].map(({ v, l, tip }, idx) => (
          <View
            key={l}
            style={[
              s.cs,
              { backgroundColor: C.surface },
              idx > 0 && { borderLeftWidth: 1, borderLeftColor: C.line },
            ]}
          >
            <Text style={[s.csVal, { color: C.ink }]}>{v}</Text>
            {tip ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[s.csLbl, { color: C.muted }]}>{l}</Text>
                <Tooltip title={tip.title} text={tip.text} />
              </View>
            ) : (
              <Text style={[s.csLbl, { color: C.muted }]}>{l}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Compounds */}
      <View style={s.compounds}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontFamily: SM, fontSize: 10, letterSpacing: 1, color: C.muted }}>
            COMPUESTOS
          </Text>
          <Tooltip title={t('tooltips.compounds.title')} text={t('tooltips.compounds.text')} />
        </View>
        {compounds.map((c: string) => (
          <View key={c} style={s.cmp}>
            <View style={[s.cmpDot, { borderColor: COMPOUND_COLORS[c] ?? '#8A8A8E' }]} />
            <Text style={[s.cmpTxt, { color: C.ink2 }]}>{c}</Text>
          </View>
        ))}
        {record !== '—' && (
          <View style={[s.circRecordRow]}>
            <Text style={[s.circRecord, { color: C.ink2 }]}>{t('calendar.circuit.lapRecord')} {record}</Text>
            <Tooltip title={t('tooltips.lapRecord.title')} text={t('tooltips.lapRecord.text')} />
          </View>
        )}
      </View>
    </View>
  );
}

// ── Driver picker modal ───────────────────────────────────────────────────────
function PickerModal({
  visible, drivers, selectedId, onSelect, onClose,
}: {
  visible: boolean; drivers: any[];
  selectedId: string | null; onSelect: (abbr: string) => void; onClose: () => void;
}) {
  const C = useColors();
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}
      statusBarTranslucent>
      <View style={s.sheetWrap}>
        <TouchableOpacity style={s.sheetBg} onPress={onClose} activeOpacity={1} />
        <View style={[s.sheet, { backgroundColor: C.paper, borderColor: C.line }]}>
          <View style={[s.sheetGrip, { backgroundColor: C.dim }]} />
          <View style={[s.sheetHead, { borderBottomColor: C.line }]}>
            <Text style={[s.sheetTitle, { color: C.ink }]}>{t('home.yourDriver')}</Text>
            <TouchableOpacity style={[s.sheetX, { borderColor: C.line }]} onPress={onClose}>
              <Text style={[{ color: C.ink2, fontSize: 15 }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={drivers}
            keyExtractor={d => d.abbreviation}
            contentContainerStyle={{ padding: 8 }}
            renderItem={({ item: d }) => {
              const tc = TEAM[d.teamName as keyof typeof TEAM] ?? '#8A8A8E';
              const flagCode = DRIVER_CODES[d.abbreviation] ?? 'un';
              const isSel = d.abbreviation === selectedId;
              return (
                <TouchableOpacity
                  onPress={() => { onSelect(d.abbreviation); onClose(); }}
                  style={[
                    s.pickRow,
                    isSel && { backgroundColor: `${C.red}18`,
                      ...(Platform.OS === 'web'
                        ? { outline: `1px solid ${C.red}55` } as any
                        : { borderWidth: 1, borderColor: `${C.red}55` }) },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={[s.pickNum, { color: C.muted }]}>
                    {String(d.driverNumber ?? d.position).padStart(2, '0')}
                  </Text>
                  <View style={[s.pickFlag, { borderColor: C.line }]}>
                    <Image source={{ uri: `https://flagcdn.com/w20/${flagCode}.png` }}
                      style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.pickName, { color: C.ink }]}>
                      {d.lastName.toUpperCase()}
                    </Text>
                    <View style={s.pickTeamRow}>
                      <View style={[s.pickTeamDot, { backgroundColor: tc }]} />
                      <Text style={[s.pickTeamTxt, { color: C.muted }]}>{d.teamName}</Text>
                    </View>
                  </View>
                  <Text style={[s.pickPts, { color: C.ink2 }]}>{d.points} PTS</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// Tag colors — dynamic headlines from /api/headlines
const TAG_COLORS: Record<string, { bg: string; c: string }> = {
  RESULTADOS: { bg: 'rgba(201,154,46,.18)', c: '#C99A2E' },
  CAMPEONATO: { bg: 'rgba(225,6,0,.12)',    c: '#E10600' },
  PREVIA:     { bg: 'rgba(225,6,0,.12)',    c: '#E10600' },
  PILOTOS:    { bg: 'rgba(54,113,198,.16)', c: '#3671C6' },
  'TÉCNICA':  { bg: 'rgba(0,0,0,.06)',      c: '#46453E' },
};

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const C = useColors();
  const { t } = useI18n();
  const router = useRouter();
  const { data: nextEvent,   isLoading: loadingNext }       = useNextEvent();
  const { data: results,    isLoading: loadingResults }     = useResults();
  const { data: driverSt,   isLoading: loadingDrivers }     = useDriverStandings();
  const { data: constrSt,   isLoading: loadingConstrs }     = useConstructorStandings();
  const { data: headlineData, isLoading: loadingHeadlines } = useHeadlines();

  const [favAbbr,    setFavAbbr]    = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('user_driver').then(v => {
      if (v) setFavAbbr(v);
      // else first launch — user can tap CAMBIAR to pick
    });
  }, []);

  const drivers = driverSt?.standings ?? [];
  const favDriver = drivers.find(d => d.abbreviation === favAbbr) ?? drivers[0];

  const leader1    = drivers[0];
  const second1    = drivers[1];
  const constrList = constrSt?.standings ?? [];
  const cLeader    = constrList[0];
  const cSecond    = constrList[1];
  const lcColor    = TEAM[cLeader?.teamName as keyof typeof TEAM] ?? '#8A8A8E';

  const raceDate = nextEvent?.sessions?.find((s: any) => s.sessionName === 'Race')?.dateStart;
  const racesLeft = nextEvent?.totalRounds && nextEvent?.round
    ? nextEvent.totalRounds - nextEvent.round + 1
    : null;

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: C.paper }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* TU PILOTO */}
      <SectionLabel title={t('home.yourDriver')} right={`${t('home.season')} 2026`} />
      {loadingDrivers ? (
        <F1Loader compact />
      ) : favDriver ? (
        <DriverCard
          driver={favDriver}
          nextEvent={nextEvent}
          results={results}
          onChangeTap={() => setShowPicker(true)}
        />
      ) : null}

      {/* ÚLTIMO GP */}
      {loadingResults ? (
        <>
          <SectionLabel title={t('home.lastRace')} />
          <F1Loader compact />
        </>
      ) : results?.results ? (
        <>
          <SectionLabel
            title={t('home.lastRace')}
            right={results.meetingName?.replace(' Grand Prix', '').toUpperCase() + ' · R' + String(results.round).padStart(2,'0')}
          />
          <LastGPCard results={results} />
        </>
      ) : null}

      {/* LUCHA POR EL TÍTULO */}
      {(loadingDrivers || loadingConstrs) && !leader1 ? (
        <>
          <SectionLabel title={t('home.titleFight')} />
          <F1Loader compact />
        </>
      ) : leader1 && second1 ? (
        <>
          <SectionLabel
            title={t('home.titleFight')}
            right={racesLeft ? t('home.racesLeft', { n: racesLeft }) : undefined}
          />
          <View style={s.fightGrid}>
            <TitleFightCard
              label="PILOTOS"
              leader={leader1.lastName}
              second={second1.lastName}
              leaderColor={TEAM[leader1.teamName as keyof typeof TEAM] ?? '#8A8A8E'}
              leaderPts={leader1.points}
              secondPts={second1.points}
            />
            {cLeader && cSecond && (
              <TitleFightCard
                label="CONSTRUCTORES"
                leader={cLeader.teamName.split(' ')[0]}
                second={cSecond.teamName.split(' ')[0]}
                leaderColor={lcColor}
                leaderPts={cLeader.points}
                secondPts={cSecond.points}
              />
            )}
          </View>
        </>
      ) : null}

      {/* CAMPEONATO TOP 5 */}
      {loadingDrivers && drivers.length === 0 ? (
        <>
          <SectionLabel title={t('home.championship')} />
          <F1Loader compact />
        </>
      ) : drivers.length > 0 ? (
        <>
          <SectionLabel
            title={t('home.championship')}
            right={t('home.seeTable')}
            onRight={() => router.replace('/standings' as any)}
          />
          <Top5Table drivers={drivers} />
        </>
      ) : null}

      {/* PRÓXIMO CIRCUITO */}
      {loadingNext && !nextEvent ? (
        <>
          <SectionLabel title={t('home.nextCircuit')} />
          <F1Loader compact />
        </>
      ) : nextEvent && nextEvent.mode !== 'lastRace' ? (
        <>
          <SectionLabel
            title={t('home.nextCircuit')}
            right={raceDate ? t('home.inDays', { n: Math.ceil((new Date(raceDate).getTime() - Date.now()) / 86_400_000) }) : undefined}
          />
          <CircuitCard nextEvent={nextEvent} />
        </>
      ) : null}

      {/* TITULARES */}
      <SectionLabel title={t('home.headlines')} />
      {loadingHeadlines && !headlineData ? (
        <F1Loader compact />
      ) : (headlineData ?? []).map((h: Headline, i: number) => {
        const { bg, c } = TAG_COLORS[h.tag] ?? { bg: C.surface2, c: C.muted };
        return (
          <View key={i} style={[s.nrow, { backgroundColor: C.surface, borderColor: C.line }]}>
            <View style={[s.ntag, { backgroundColor: bg }]}>
              <Text style={[s.ntagTxt, { color: c }]}>{h.tag}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.ntitle, { color: C.ink }]}>{h.title}</Text>
              <Text style={[s.nmeta, { color: C.muted }]}>PITWALL · {h.time}</Text>
            </View>
          </View>
        );
      })}

      {/* Picker modal */}
      <PickerModal
        visible={showPicker}
        drivers={drivers}
        selectedId={favAbbr}
        onSelect={abbr => {
          setFavAbbr(abbr);
          AsyncStorage.setItem('user_driver', abbr);
        }}
        onClose={() => setShowPicker(false)}
      />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 100 },

  // Section label
  secLabel: { flexDirection:'row', alignItems:'center', gap:14 },
  secLeft:  { flexDirection:'row', alignItems:'center', gap:8 },
  secRedBar:{ width:14, height:3, borderRadius:2 },
  secTitle: { fontFamily:SMB, fontSize:11, letterSpacing:.22 * 16 / 1, textTransform:'uppercase' },
  secLine:  { flex:1, height:1 },
  secRight: { fontFamily:SMB, fontSize:11, letterSpacing:.1 * 16 / 1 },

  // Driver card — grid 118px | flex
  driverCard: { flexDirection:'row', borderRadius:18, overflow:'hidden', borderWidth:1 },
  dcBadge:    { width:118, alignItems:'center', justifyContent:'center', gap:10, padding:18,
    paddingHorizontal:10, position:'relative' },
  dcChange:   { position:'absolute', top:12, right:12, zIndex:2,
    backgroundColor:'rgba(0,0,0,.28)', borderWidth:1, borderColor:'rgba(255,255,255,.25)',
    borderRadius:999, paddingHorizontal:9, paddingVertical:5 },
  dcChangeTxt:{ fontFamily:SMB, fontSize:9, letterSpacing:.12 * 9, color:'#fff' },
  dcNum:      { fontFamily:A9, fontSize:54, color:'#fff', lineHeight:54*.8,
    letterSpacing:-.03*54 },
  dcFlag:     { width:40, height:27, borderRadius:4, overflow:'hidden',
    borderWidth:1, borderColor:'rgba(255,255,255,.4)' },
  dcBody:     { flex:1, padding:16, paddingBottom:15 },
  dcFirst:    { fontFamily:SM, fontSize:12, letterSpacing:.02*12 },
  dcLast:     { fontFamily:A9, fontSize:26, letterSpacing:-.015*26, lineHeight:26*.95, marginTop:1 },
  dcTeam:     { flexDirection:'row', alignItems:'center', gap:7, marginTop:7 },
  dcTeamName: { fontFamily:SM, fontSize:11 },
  teamDot:    { width:8, height:8, borderRadius:2 },
  teamDotSm:  { width:8, height:8, borderRadius:2 },
  dcStats:    { flexDirection:'row', gap:18, marginTop:14, paddingTop:13, borderTopWidth:1 },
  dcStat:     {},
  dcStatVal:  { fontFamily:A9, fontSize:21, letterSpacing:-.01*21 },
  dcStatLbl:  { fontFamily:SMB, fontSize:8.5, letterSpacing:.14*8.5, marginTop:3 },
  dcForm:     { flexDirection:'row', alignItems:'center', gap:5, marginTop:13 },
  dcFormLbl:  { fontFamily:SMB, fontSize:8.5, letterSpacing:.14*8.5, marginRight:3 },
  fchip:      { width:23, height:23, borderRadius:6, alignItems:'center', justifyContent:'center',
    borderWidth:1 },
  fchipTxt:   { fontFamily:SMB, fontSize:10 },
  dcNext:     { flexDirection:'row', alignItems:'center', gap:8, marginTop:13 },
  dcNextNx:   { fontFamily:SM, fontSize:11, letterSpacing:.1*11 },
  dcNextTxt:  { fontFamily:SM, fontSize:11 },

  // Card base
  card: { borderRadius:16, borderWidth:1, padding:16 },

  // Last GP
  winnerRow:  { flexDirection:'row', alignItems:'center', gap:13,
    paddingBottom:14, borderBottomWidth:1 },
  wFlag:      { width:46, height:31, borderRadius:5, overflow:'hidden', borderWidth:1 },
  wName:      { fontFamily:A9, fontSize:23, letterSpacing:-.01*23, lineHeight:23 },
  wMeta:      { flexDirection:'row', alignItems:'center', gap:7, marginTop:6 },
  wMetaTxt:   { fontFamily:SM, fontSize:11 },
  winTag:     { marginLeft:'auto', alignSelf:'flex-start', borderWidth:1,
    borderRadius:6, paddingHorizontal:8, paddingVertical:4 },
  winTagTxt:  { fontFamily:SMB, fontSize:9, letterSpacing:.14*9 },
  podiumRow:  { flexDirection:'row', gap:7, marginTop:14, marginBottom:4 },
  podChip:    { flexDirection:'row', alignItems:'center', gap:6, borderWidth:1,
    borderRadius:7, paddingHorizontal:8, paddingVertical:5 },
  podBar:     { width:3, height:13, borderRadius:2 },
  podPos:     { fontFamily:SM, fontSize:9 },
  podAbbr:    { fontFamily:SMB, fontSize:11 },
  gpExtra:    { flexDirection:'row', gap:1, borderRadius:11, overflow:'hidden',
    borderWidth:1, marginTop:4 },
  gx:         { flex:1, padding:11, paddingHorizontal:13 },
  gxLabel:    { fontFamily:SMB, fontSize:8.5, letterSpacing:.14*8.5 },
  gxVal:      { fontFamily:A8, fontSize:16, marginTop:5 },
  headline:   { fontFamily:A6, fontSize:14, lineHeight:14*1.4, marginTop:13 },

  // Fight
  fightGrid:  { flexDirection:'row', gap:12 },
  fightCard:  { flex:1 },
  ffLbl:      { fontFamily:SMB, fontSize:9, letterSpacing:.16*9 },
  ffLeaderRow:{ flexDirection:'row', alignItems:'baseline', gap:8, marginTop:9 },
  ffLeader:   { fontFamily:A9, fontSize:19, letterSpacing:-.01*19, flex:1 },
  ffGap:      { fontFamily:SMB, fontSize:12 },
  ffSub:      { fontFamily:SM, fontSize:10, marginTop:5 },
  ffBars:     { marginTop:11, gap:6 },
  ffBarBg:    { height:6, borderRadius:3, overflow:'hidden' },
  ffBarFill:  { height:6, borderRadius:3 },

  // Top 5
  t5Row:      { flexDirection:'row', alignItems:'center', gap:11, padding:11,
    paddingHorizontal:14 },
  t5Pos:      { fontFamily:SMB, fontSize:13, width:24, textAlign:'center' },
  t5Flag:     { width:26, height:17, borderRadius:3, overflow:'hidden' },
  t5Name:     { fontFamily:A7, fontSize:15, textTransform:'uppercase',
    letterSpacing:-.005*15 },
  t5Team:     { fontFamily:SM, fontSize:10, marginTop:1 },
  t5Pts:      { fontFamily:A9, fontSize:17 },

  // Circuit
  circHead:   { flexDirection:'row', alignItems:'center', gap:11, marginBottom:13 },
  circFlag:   { width:38, height:26, borderRadius:4, overflow:'hidden', borderWidth:1 },
  circName:   { fontFamily:A9, fontSize:20, letterSpacing:-.01*20, lineHeight:20 },
  circLoc:    { fontFamily:SM, fontSize:11, marginTop:3 },
  circMap:    { width:'100%', height:170, borderRadius:12, borderWidth:1,
    alignItems:'center', justifyContent:'center', marginBottom:0, overflow:'hidden' },
  circStats:  { flexDirection:'row', borderRadius:11, borderWidth:1, marginTop:13 },
  cs:         { flex:1, padding:11, paddingHorizontal:6, alignItems:'center' },
  csVal:      { fontFamily:A9, fontSize:17 },
  csLbl:      { fontFamily:SMB, fontSize:8, letterSpacing:.1*8, marginTop:4 },
  compounds:  { flexDirection:'row', alignItems:'center', gap:9, marginTop:13,
    flexWrap:'wrap' },
  cmp:        { flexDirection:'row', alignItems:'center', gap:6 },
  cmpDot:     { width:13, height:13, borderRadius:999, borderWidth:2 },
  cmpTxt:     { fontFamily:SMB, fontSize:10, letterSpacing:.1*10 },
  circRecordRow: { flexDirection:'row', alignItems:'center', marginLeft:'auto' },
  circRecord: { fontFamily:SMB, fontSize:10, letterSpacing:.08*10 },

  // News
  nrow:       { flexDirection:'row', gap:12, alignItems:'flex-start', borderWidth:1,
    borderRadius:13, padding:13, paddingHorizontal:15 },
  ntag:       { borderRadius:6, paddingHorizontal:8, paddingVertical:4, marginTop:2 },
  ntagTxt:    { fontFamily:SMB, fontSize:8.5, letterSpacing:.12*8.5 },
  ntitle:     { fontFamily:A7, fontSize:15, lineHeight:15*1.25 },
  nmeta:      { fontFamily:SM, fontSize:10, marginTop:6 },

  // Picker modal
  sheetWrap:  { flex:1, justifyContent:'flex-end', backgroundColor:'rgba(8,8,12,.55)' },
  sheetBg:    { position:'absolute', top:0, left:0, right:0, bottom:0 },
  sheet:      { borderTopLeftRadius:22, borderTopRightRadius:22, borderWidth:1,
    maxHeight:'82%' },
  sheetGrip:  { width:38, height:4, borderRadius:3, alignSelf:'center', marginTop:8, marginBottom:6 },
  sheetHead:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    padding:8, paddingHorizontal:20, paddingBottom:14, borderBottomWidth:1 },
  sheetTitle: { fontFamily:A9, fontSize:18, letterSpacing:-.01*18, textTransform:'uppercase' },
  sheetX:     { width:32, height:32, borderRadius:999, borderWidth:1,
    alignItems:'center', justifyContent:'center' },
  pickRow:    { flexDirection:'row', alignItems:'center', gap:13, padding:11,
    paddingHorizontal:10, borderRadius:11 },
  pickNum:    { fontFamily:SMB, fontSize:13, width:30, textAlign:'center' },
  pickFlag:   { width:30, height:20, borderRadius:3, overflow:'hidden', borderWidth:1 },
  pickName:   { fontFamily:A7, fontSize:16, textTransform:'uppercase', letterSpacing:-.005*16 },
  pickTeamRow:{ flexDirection:'row', alignItems:'center', gap:6, marginTop:3 },
  pickTeamDot:{ width:7, height:7, borderRadius:2 },
  pickTeamTxt:{ fontFamily:SM, fontSize:10 },
  pickPts:    { fontFamily:SMB, fontSize:12 },
});
