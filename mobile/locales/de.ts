export default {
  nav: {
    home: 'START', calendar: 'KALENDER', standings: 'WERTUNG',
    results: 'ERGEBNISSE', live: 'LIVE',
  },
  home: {
    nextRace: 'NÄCHSTES RENNEN', lastRace: 'LETZTER GP',
    titleFight: 'TITELKAMPF', championship: 'MEISTERSCHAFT',
    nextCircuit: 'NÄCHSTER KURS', headlines: 'SCHLAGZEILEN',
    drivers: 'FAHRER', constructors: 'KONSTRUKTEURE',
    inDays: 'IN {{n}} TAGEN', seeTable: 'TABELLE →',
    winner: '★ SIEGER', fastestLap: '◷ SCHNELLSTE RUNDE',
    racesLeft: '{{n}} RENNEN REST.', yourDriver: 'DEIN FAHRER',
    season: 'SAISON', change: '⇄ WECHSELN', noSession: 'KEIN LIVE-SESSION',
    position: 'POSITION', points: 'PUNKTE', last: 'LETZTES', form: 'FORM',
    next: 'NÄCHSTES',
  },
  calendar: {
    title: 'KALENDER', rounds: '{{n}} RENNEN',
    nextRace: 'NÄCHSTER GP', thisWeekend: 'DIESES WOCHENENDE',
    completed: 'ABGESCHLOSSEN', upcoming: 'GEPLANT',
    raceWeekend: 'RENNWOCHENENDE', allTimes: 'UHRZEIT {{city}}',
    theCircuit: 'DIE STRECKE', weather: 'WETTER AM WOCHENENDE',
    yourDriverHere: 'DEIN FAHRER', viewResults: 'ALLE ERGEBNISSE →',
    practice1: 'Training 1', practice2: 'Training 2', practice3: 'Training 3',
    qualifying: 'Qualifying', sprintQualifying: 'Sprint-Qualifying',
    sprint: 'Sprint', race: 'Rennen',
    round: 'RUNDE', tomorrow: 'MORGEN', thisWeekendShort: 'DIESES WOCHENENDE',
    circuit: {
      length: 'LÄNGE', laps: 'RUNDEN', distance: 'DISTANZ',
      turns: 'KURVEN', drs: 'DRS-ZONEN', direction: 'RICHTUNG',
      clockwise: 'Im Uhrzeigersinn', anticlockwise: 'Gegen den Uhrzeigersinn',
      lapRecord: 'RUNDENREKORD', compounds: 'MISCHUNGEN',
    },
    regions: { americas: 'AMERICAS', europe: 'EUROPA', asiaPacific: 'ASIEN / PAZIFIK' },
  },
  standings: {
    title: 'WERTUNG', driverChampionship: 'FAHRERWELTMEISTERSCHAFT',
    constructorChampionship: 'KONSTRUKTEURSWELTMEISTERSCHAFT',
    drivers: 'FAHRER', constructors: 'KONSTRUKTEURE',
    points: 'PKT', worldLeader: '● SPITZENREITER',
  },
  results: {
    title: 'ERGEBNISSE', chooseRace: 'ERGEBNISSE · RENNEN WÄHLEN',
    classification: 'KLASSEMENT', gap: 'ABST.', points: 'PKT',
    laps: '{{n}} RUNDEN', result: 'ERGEBNIS', round: 'RUNDE',
  },
  live: {
    title: 'LIVE', noSession: 'KEIN LIVE-SESSION',
    nextSession: 'NÄCHSTE SESSION', updating: 'AKTUALISIERUNG ALLE 4S',
    updatedAgo: 'AKTUALISIERT VOR {{n}}S', positions: 'POSITIONEN',
    gap: 'ABSTAND', lastLap: 'LETZTE RUNDE', live: 'LIVE',
  },
  timezone: {
    title: 'Wo bist du?', subtitle: 'Sessionzeiten werden an deine Zeitzone angepasst',
    confirm: 'BESTÄTIGEN', change: 'Zeitzone ändern',
    regions: { americas: 'AMERICAS', europe: 'EUROPA', asiaPacific: 'ASIEN & OZEANIEN' },
  },
  tooltips: {
    compounds: {
      title: 'REIFENMISCHUNGEN',
      text: 'Pirelli weist pro Rennen 3 Mischungen zu. C1 ist die härteste (langlebigste) und C6 die weichste (schnellste, verschleißt aber schneller).',
    },
    drs: {
      title: 'DRS',
      text: 'DRS öffnet den Heckflügel, um den Luftwiderstand zu verringern. Nur in designierten Zonen nutzbar, wenn du weniger als 1 Sekunde hinter dem Vordermann liegst.',
    },
    lapRecord: {
      title: 'HISTORISCHER REKORD',
      text: 'Die schnellste jemals auf dieser Strecke gefahrene Runde in der Geschichte der Formel 1.',
    },
  },
  days: { mon: 'MO', tue: 'DI', wed: 'MI', thu: 'DO', fri: 'FR', sat: 'SA', sun: 'SO' },
  months: {
    jan: 'JAN', feb: 'FEB', mar: 'MÄR', apr: 'APR', may: 'MAI', jun: 'JUN',
    jul: 'JUL', aug: 'AUG', sep: 'SEP', oct: 'OKT', nov: 'NOV', dec: 'DEZ',
  },
}
