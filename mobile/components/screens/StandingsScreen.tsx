/**
 * StandingsScreen — Campeonato Pilotos / Constructores
 * Exact match: design_handoff_pitwall/Pitwall Posiciones.html
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useDriverStandings, useConstructorStandings } from '@/hooks/useStandings';
import { useI18n } from '@/context/I18nContext';
import F1Loader from '@/components/ui/F1Loader';
import { DRIVER_CODES } from '@/constants/flags';
import { TEAM } from '@/constants/colors';

// ── Font tokens ───────────────────────────────────────────────────────────────
const A9  = 'Archivo_900Black';
const A8  = 'Archivo_800ExtraBold';
const SM  = 'SpaceMono_400Regular';
const SMB = 'SpaceMono_700Bold';

type Tab = 'drv' | 'con';

// ── Points font size — scaled by position ─────────────────────────────────────
function ptsFontSize(pos: number): number {
  if (pos === 0) return 42;
  if (pos <= 2)  return 36;
  if (pos <= 9)  return 28;
  return 22;
}

// ── Segment toggle ────────────────────────────────────────────────────────────
function Segment({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const C = useColors();
  const { t: tr } = useI18n();
  return (
    <View style={[s.segment, { backgroundColor: C.surface2, borderColor: C.line }]}>
      {(['drv', 'con'] as Tab[]).map(t => {
        const on = tab === t;
        return (
          <TouchableOpacity
            key={t}
            style={[
              s.segBtn,
              on && [
                { backgroundColor: C.red },
                Platform.OS === 'web'
                  ? { boxShadow: '0 6px 16px -8px #E10600' } as any
                  : { shadowColor: C.red, shadowOpacity: 0.6, shadowRadius: 8,
                      shadowOffset: { width: 0, height: 6 }, elevation: 6 },
              ],
            ]}
            onPress={() => onChange(t)}
            activeOpacity={0.8}
          >
            <Text style={[
              s.segTxt,
              { color: on ? '#fff' : C.muted },
            ]}>
              {t === 'drv' ? tr('standings.drivers') : tr('standings.constructors')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Driver row ────────────────────────────────────────────────────────────────
function DriverRow({
  driver, pos, maxPts,
}: {
  driver: any; pos: number; maxPts: number;
}) {
  const C = useColors();
  const { t } = useI18n();
  const isLeader = pos === 0;
  const tc = TEAM[driver.teamName as keyof typeof TEAM] ?? '#8A8A8E';
  const flagCode = DRIVER_CODES[driver.abbreviation] ?? 'un';
  const barPct = maxPts > 0 ? Math.max(4, (driver.points / maxPts) * 100) : 4;
  const ptsSize = ptsFontSize(pos);
  const gold = C.gold;

  const rowContent = (
    <View style={[s.row, isLeader && s.rowLeader, { borderBottomColor: C.line2 }]}>
      {/* Gold left bar for leader */}
      {isLeader && (
        <View style={[s.leaderBar,
          Platform.OS === 'web'
            ? { boxShadow: `0 0 12px ${gold}` } as any
            : { shadowColor: gold, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
          { backgroundColor: gold },
        ]} />
      )}

      {/* Pos: 30px */}
      <Text style={[s.pos, { color: isLeader ? gold : C.muted }]}>
        {String(pos + 1).padStart(2, '0')}
      </Text>

      {/* Flag: 30px */}
      <View style={[s.flag, { borderColor: C.line }]}>
        <Image
          source={{ uri: `https://flagcdn.com/w40/${flagCode}.png` }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Main: flex 1 */}
      <View style={s.main}>
        <View style={s.name}>
          <Text style={[s.firstName, { color: C.muted }]}>{driver.firstName}</Text>
          <Text
            style={[s.lastName, { color: C.ink }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {driver.lastName.toUpperCase()}
          </Text>
        </View>

        {isLeader ? (
          <View style={[s.leadTag, { borderColor: `${gold}73` }]}>
            <View style={[s.leadDot, { backgroundColor: gold }]} />
            <Text style={[s.leadTagTxt, { color: gold }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{t('standings.worldLeader')}</Text>
          </View>
        ) : (
          <View style={s.teamRow}>
            <View style={[s.teamDot, { backgroundColor: tc }]} />
            <Text style={[s.teamName, { color: C.muted }]}>{driver.teamName}</Text>
          </View>
        )}

        {/* Progress bar */}
        <View style={[s.bar, { backgroundColor: C.line2 }]}>
          <View style={[s.barFill, { width: `${barPct}%` as any, backgroundColor: tc }]} />
        </View>
      </View>

      {/* Points: auto */}
      <View style={s.ptsCol}>
        <Text style={[s.pts, { fontSize: ptsSize, color: isLeader ? gold : C.ink }]}>
          {driver.points}
        </Text>
        <Text style={[s.ptsLbl, { color: C.muted }]}>PTS</Text>
      </View>
    </View>
  );

  if (isLeader) {
    return (
      <View>
        <LinearGradient
          colors={[`${gold}33`, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {rowContent}
      </View>
    );
  }
  return rowContent;
}

// ── Constructor row ───────────────────────────────────────────────────────────
function ConstructorRow({
  ctor, pos, maxPts,
}: {
  ctor: any; pos: number; maxPts: number;
}) {
  const C = useColors();
  const { t } = useI18n();
  const isLeader = pos === 0;
  const tc = TEAM[ctor.teamName as keyof typeof TEAM] ?? '#8A8A8E';
  const barPct = maxPts > 0 ? Math.max(3, (ctor.points / maxPts) * 100) : 3;
  const ptsSize = ptsFontSize(pos);
  const gold = C.gold;

  const rowContent = (
    <View style={[s.row, isLeader && s.rowLeader, { borderBottomColor: C.line2 }]}>
      {isLeader && (
        <View style={[s.leaderBar,
          Platform.OS === 'web'
            ? { boxShadow: `0 0 12px ${gold}` } as any
            : { shadowColor: gold, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
          { backgroundColor: gold },
        ]} />
      )}

      {/* Pos: 30px */}
      <Text style={[s.pos, { color: isLeader ? gold : C.muted }]}>
        {String(pos + 1).padStart(2, '0')}
      </Text>

      {/* Color bar: 7px */}
      <View style={[s.cbar, { backgroundColor: tc }]} />

      {/* Main: flex 1 */}
      <View style={s.main}>
        <Text
          style={[s.cname, { color: C.ink }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {ctor.teamName.toUpperCase()}
        </Text>
        <Text style={[s.cdrivers, { color: C.muted }]}>
          {(ctor.drivers ?? []).join(' · ')}
        </Text>

        {isLeader && (
          <View style={[s.leadTag, { borderColor: `${gold}73`, marginTop: 6 }]}>
            <View style={[s.leadDot, { backgroundColor: gold }]} />
            <Text style={[s.leadTagTxt, { color: gold }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{t('standings.worldLeader')}</Text>
          </View>
        )}

        <View style={[s.bar, { backgroundColor: C.line2 }]}>
          <View style={[s.barFill, { width: `${barPct}%` as any, backgroundColor: tc }]} />
        </View>
      </View>

      {/* Points */}
      <View style={s.ptsCol}>
        <Text style={[s.pts, { fontSize: ptsSize, color: isLeader ? gold : C.ink }]}>
          {ctor.points}
        </Text>
        <Text style={[s.ptsLbl, { color: C.muted }]}>PTS</Text>
      </View>
    </View>
  );

  if (isLeader) {
    return (
      <View>
        <LinearGradient
          colors={[`${gold}33`, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {rowContent}
      </View>
    );
  }
  return rowContent;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function StandingsScreen() {
  const { t } = useI18n();
  const C = useColors();
  const [tab, setTab] = useState<Tab>('drv');

  const { data: driverSt,  isLoading: drvLoading  } = useDriverStandings();
  const { data: constrSt, isLoading: conLoading } = useConstructorStandings();

  const drivers      = driverSt?.standings ?? [];
  const constructors = constrSt?.standings ?? [];
  const maxDrv = drivers[0]?.points ?? 1;
  const maxCon = constructors[0]?.points ?? 1;

  const isLoading = tab === 'drv' ? drvLoading : conLoading;
  const title = tab === 'drv' ? t('standings.driverChampionship') : t('standings.constructorChampionship');

  if (isLoading) {
    return <F1Loader label={t('standings.title')} />;
  }

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: C.paper }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Segment */}
      <Segment tab={tab} onChange={setTab} />

      {/* List header */}
      <View style={s.listHead}>
        <Text style={[s.listTitle, { color: C.muted }]}>{title}</Text>
        <Text style={[s.ptsHead, { color: C.muted }]}>PTS</Text>
      </View>

      {/* Board */}
      <View style={[s.board, { backgroundColor: C.surface, borderColor: C.line }]}>
        {tab === 'drv' ? (
          drivers.map((d, i) => (
            <DriverRow key={d.driverNumber ?? i} driver={d} pos={i} maxPts={maxDrv} />
          ))
        ) : (
          constructors.map((c, i) => (
            <ConstructorRow key={c.teamName ?? i} ctor={c} pos={i} maxPts={maxCon} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:   { flex: 1 },
  content:  { padding: 14, paddingBottom: 100 },

  // Segment — .segment from HTML: grid 1fr 1fr, gap 4, radius 13, padding 4
  segment: {
    flexDirection: 'row', gap: 4, borderRadius: 13,
    borderWidth: 1, padding: 4, marginBottom: 22,
  },
  segBtn:  { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 9, alignItems: 'center' },
  segTxt:  { fontFamily: SMB, fontSize: 12, letterSpacing: .16 * 12 },

  // List header
  listHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 12 },
  listTitle: { fontFamily: SMB, fontSize: 11, letterSpacing: .2 * 11 },
  ptsHead:   { fontFamily: SMB, fontSize: 11, letterSpacing: .18 * 11 },

  // Board card
  board:  { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },

  // Row — .row.d: grid 30px 30px 1fr auto, gap 13, padding 14, radius 12
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: 13, paddingVertical: 14, paddingHorizontal: 14,
    borderBottomWidth: 1, position: 'relative',
  },
  rowLeader: {
    // Gold gradient applied via LinearGradient wrapper
  },

  // Leader left bar — .row.is-leader::before
  leaderBar: {
    position: 'absolute', left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 3, zIndex: 1,
  },

  // Position column — 30px
  pos: { fontFamily: SMB, fontSize: 14, width: 30, textAlign: 'center' },

  // Flag — 30×20
  flag: { width: 30, height: 20, borderRadius: 3, overflow: 'hidden', borderWidth: 1 },

  // Constructor color bar — 7×30
  cbar: { width: 7, height: 30, borderRadius: 3 },

  // Main info column
  main:  { flex: 1, minWidth: 0 },
  name:  { flexDirection: 'column', lineHeight: undefined },
  firstName: { fontFamily: SM, fontSize: 11, letterSpacing: .04 * 11 },
  lastName:  { fontFamily: A8, fontSize: 21, letterSpacing: -.01 * 21,
    textTransform: 'uppercase', lineHeight: 21 * 1.05 },
  cname:    { fontFamily: A8, fontSize: 21, letterSpacing: -.005 * 21,
    textTransform: 'uppercase', lineHeight: 21 },
  cdrivers: { fontFamily: SMB, fontSize: 11, letterSpacing: .08 * 11,
    textTransform: 'uppercase', marginTop: 6 },

  // Team row
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  teamDot: { width: 8, height: 8, borderRadius: 2 },
  teamName:{ fontFamily: SM, fontSize: 11 },

  // Leader badge
  leadTag: { flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    marginTop: 8, alignSelf: 'flex-start', flexShrink: 1, flexWrap: 'wrap' },
  leadDot: { width: 5, height: 5, borderRadius: 3 },
  leadTagTxt: { fontFamily: SMB, fontSize: 9, letterSpacing: .14 * 9 },

  // Progress bar — height 4, radius 3, max-width 240, margin-top 9
  bar:    { height: 4, borderRadius: 3, marginTop: 9, overflow: 'hidden', maxWidth: 240 },
  barFill:{ height: 4, borderRadius: 3 },

  // Points column
  ptsCol: { alignItems: 'flex-end', alignSelf: 'flex-start', paddingTop: 6 },
  pts:    { fontFamily: A9, letterSpacing: -.02, textAlign: 'right' },
  ptsLbl: { fontFamily: SMB, fontSize: 9, letterSpacing: .14 * 9, marginTop: 2, textAlign: 'right' },
});
