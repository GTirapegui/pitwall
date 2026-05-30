export default {
  nav: {
    home: 'HOME', calendar: 'CALENDARIO', standings: 'CLASSIFICA',
    results: 'RISULTATI', live: 'IN DIRETTA',
  },
  home: {
    nextRace: 'PROSSIMA GARA', lastRace: 'ULTIMO GP',
    titleFight: 'LOTTA PER IL TITOLO', championship: 'CAMPIONATO',
    nextCircuit: 'PROSSIMO CIRCUITO', headlines: 'NOTIZIE',
    drivers: 'PILOTI', constructors: 'COSTRUTTORI',
    inDays: 'TRA {{n}} GIORNI', seeTable: 'VEDI TABELLA →',
    winner: '★ VINCITORE', fastestLap: '◷ GIRO VELOCE',
    racesLeft: '{{n}} GARE RIM.', yourDriver: 'IL TUO PILOTA',
    season: 'STAGIONE', change: '⇄ CAMBIA', noSession: 'NESSUNA SESSIONE IN DIRETTA',
    position: 'POSIZIONE', points: 'PUNTI', last: 'ULTIMA', form: 'FORMA',
    next: 'PROSSIMA',
  },
  calendar: {
    title: 'CALENDARIO', rounds: '{{n}} GARE',
    nextRace: 'PROSSIMO GP', thisWeekend: 'QUESTO WEEKEND',
    completed: 'COMPLETATO', upcoming: 'IN PROGRAMMA',
    raceWeekend: 'WEEKEND DI GARA', allTimes: 'ORA {{city}}',
    theCircuit: 'IL CIRCUITO', weather: 'METEO DEL WEEKEND',
    yourDriverHere: 'IL TUO PILOTA', viewResults: 'VEDI RISULTATI COMPLETI →',
    practice1: 'Prove Libere 1', practice2: 'Prove Libere 2', practice3: 'Prove Libere 3',
    qualifying: 'Qualifiche', sprintQualifying: 'Qualifiche Sprint',
    sprint: 'Sprint', race: 'Gara',
    round: 'ROUND', tomorrow: 'DOMANI', thisWeekendShort: 'QUESTO WEEKEND',
    circuit: {
      length: 'LUNGHEZZA', laps: 'GIRI', distance: 'DISTANZA',
      turns: 'CURVE', drs: 'ZONE DRS', direction: 'SENSO',
      clockwise: 'Senso orario', anticlockwise: 'Senso antiorario',
      lapRecord: 'RECORD SUL GIRO', compounds: 'MESCOLE',
    },
    regions: { americas: 'AMERICHE', europe: 'EUROPA', asiaPacific: 'ASIA / PACIFICO' },
  },
  standings: {
    title: 'CLASSIFICA', driverChampionship: 'CAMPIONATO PILOTI',
    constructorChampionship: 'CAMPIONATO COSTRUTTORI',
    drivers: 'PILOTI', constructors: 'COSTRUTTORI',
    points: 'PTS', worldLeader: '● LEADER DEL MONDIALE',
  },
  results: {
    title: 'RISULTATI', chooseRace: 'RISULTATI · SCEGLI LA GARA',
    classification: 'CLASSIFICA', gap: 'DIST.', points: 'PTS',
    laps: '{{n}} GIRI', result: 'RISULTATO', round: 'ROUND',
  },
  live: {
    title: 'IN DIRETTA', noSession: 'NESSUNA SESSIONE IN DIRETTA',
    nextSession: 'PROSSIMA SESSIONE', updating: 'AGGIORNAMENTO OGNI 4S',
    updatedAgo: 'AGGIORNATO {{n}}S FA', positions: 'POSIZIONI',
    gap: 'DISTACCO', lastLap: 'ULT. GIRO', live: 'IN DIRETTA',
  },
  timezone: {
    title: 'Dove sei?', subtitle: 'Gli orari si adatteranno al tuo fuso orario',
    confirm: 'CONFERMA', change: 'Cambia fuso orario',
    regions: { americas: 'AMERICHE', europe: 'EUROPA', asiaPacific: 'ASIA E OCEANIA' },
  },
  tooltips: {
    compounds: {
      title: 'MESCOLE',
      text: 'La Pirelli assegna 3 mescole per gara. C1 è la più dura (più duratura) e C6 la più morbida (più rapida ma si consuma prima).',
    },
    drs: {
      title: 'DRS',
      text: 'Il DRS apre l\'ala posteriore per ridurre la resistenza aerodinamica. Usabile solo nelle zone designate e quando si è a meno di 1 secondo dall\'auto davanti.',
    },
    lapRecord: {
      title: 'RECORD STORICO',
      text: 'Il tempo sul giro più veloce mai registrato su questo circuito nella storia della Formula 1.',
    },
  },
  days: { mon: 'LUN', tue: 'MAR', wed: 'MER', thu: 'GIO', fri: 'VEN', sat: 'SAB', sun: 'DOM' },
  months: {
    jan: 'GEN', feb: 'FEB', mar: 'MAR', apr: 'APR', may: 'MAG', jun: 'GIU',
    jul: 'LUG', aug: 'AGO', sep: 'SET', oct: 'OTT', nov: 'NOV', dec: 'DIC',
  },
}
