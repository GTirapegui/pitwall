export default {
  nav: {
    home: 'HOME', calendar: 'KALENDER', standings: 'STAND',
    results: 'UITSLAG', live: 'LIVE',
  },
  home: {
    nextRace: 'VOLGENDE RACE', lastRace: 'LAATSTE GP',
    titleFight: 'TITELSTRIJD', championship: 'KAMPIOENSCHAP',
    nextCircuit: 'VOLGEND CIRCUIT', headlines: 'NIEUWS',
    drivers: 'RIJDERS', constructors: 'CONSTRUCTEURS',
    inDays: 'OVER {{n}} DAGEN', seeTable: 'ZIE TABEL →',
    winner: '★ WINNAAR', fastestLap: '◷ SNELSTE RONDE',
    racesLeft: '{{n}} RACES REST.', yourDriver: 'JOUW RIJDER',
    season: 'SEIZOEN', change: '⇄ WIJZIGEN', noSession: 'GEEN LIVE SESSIE',
    position: 'POSITIE', points: 'PUNTEN', last: 'LAATSTE', form: 'VORM',
    next: 'VOLGENDE',
  },
  calendar: {
    title: 'KALENDER', rounds: '{{n}} RACES',
    nextRace: 'VOLGENDE GP', thisWeekend: 'DIT WEEKEND',
    completed: 'AFGELOPEN', upcoming: 'GEPLAND',
    raceWeekend: 'RACEWEEKEND SCHEMA', allTimes: 'TIJD {{city}}',
    theCircuit: 'HET CIRCUIT', weather: 'WEER VAN HET WEEKEND',
    yourDriverHere: 'JOUW RIJDER', viewResults: 'VOLLEDIGE UITSLAG →',
    practice1: 'Vrije Training 1', practice2: 'Vrije Training 2', practice3: 'Vrije Training 3',
    qualifying: 'Kwalificatie', sprintQualifying: 'Sprint Kwalificatie',
    sprint: 'Sprint', race: 'Race',
    round: 'RONDE', tomorrow: 'MORGEN', thisWeekendShort: 'DIT WEEKEND',
    circuit: {
      length: 'LENGTE', laps: 'RONDEN', distance: 'AFSTAND',
      turns: 'BOCHTEN', drs: 'DRS ZONES', direction: 'RICHTING',
      clockwise: 'Met de klok mee', anticlockwise: 'Tegen de klok in',
      lapRecord: 'RONDERECORD', compounds: 'COMPOUNDS',
    },
    regions: { americas: 'AMERICAS', europe: 'EUROPA', asiaPacific: 'AZIË / STILLE OCEAAN' },
  },
  standings: {
    title: 'STAND', driverChampionship: 'RIJDERSKAMPIOENSCHAP',
    constructorChampionship: 'CONSTRUCTEURSKAMPIOENSCHAP',
    drivers: 'RIJDERS', constructors: 'CONSTRUCTEURS',
    points: 'PNT', worldLeader: '● KAMPIOENSCHAPSLEIDER',
  },
  results: {
    title: 'UITSLAG', chooseRace: 'UITSLAG · KIES EEN RACE',
    classification: 'KLASSEMENT', gap: 'VERSCHIL', points: 'PNT',
    laps: '{{n}} RONDEN', result: 'UITSLAG', round: 'RONDE',
  },
  live: {
    title: 'LIVE', noSession: 'GEEN LIVE SESSIE',
    nextSession: 'VOLGENDE SESSIE', updating: 'IEDERE 4S BIJGEWERKT',
    updatedAgo: '{{n}}S GELEDEN BIJGEWERKT', positions: 'POSITIES',
    gap: 'GAP', lastLap: 'LAATSTE RONDE', live: 'LIVE',
  },
  timezone: {
    title: 'Waar ben je?', subtitle: 'Sessietijden worden aangepast aan jouw tijdzone',
    confirm: 'BEVESTIGEN', change: 'Tijdzone wijzigen',
    regions: { americas: 'AMERICAS', europe: 'EUROPA', asiaPacific: 'AZIË EN OCEANIË' },
  },
  tooltips: {
    compounds: {
      title: 'BANDENMIXEN',
      text: 'Pirelli wijst per race 3 compounds toe. C1 is de hardste (meest duurzaam) en C6 de zachtste (snelste maar slijt sneller).',
    },
    drs: {
      title: 'DRS',
      text: 'DRS opent de achtervleugel om luchtweerstand te verminderen. Alleen bruikbaar in aangewezen zones en wanneer je binnen 1 seconde van de auto voor je rijdt.',
    },
    lapRecord: {
      title: 'HISTORISCH RECORD',
      text: 'De snelste rondetijd ooit op dit circuit in de geschiedenis van de Formule 1.',
    },
  },
  days: { mon: 'MA', tue: 'DI', wed: 'WO', thu: 'DO', fri: 'VR', sat: 'ZA', sun: 'ZO' },
  months: {
    jan: 'JAN', feb: 'FEB', mar: 'MRT', apr: 'APR', may: 'MEI', jun: 'JUN',
    jul: 'JUL', aug: 'AUG', sep: 'SEP', oct: 'OKT', nov: 'NOV', dec: 'DEC',
  },
}
