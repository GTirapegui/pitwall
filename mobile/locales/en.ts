export default {
  nav: {
    home: 'HOME', calendar: 'CALENDAR', standings: 'STANDINGS',
    results: 'RESULTS', live: 'LIVE',
  },
  home: {
    nextRace: 'NEXT RACE', lastRace: 'LAST GP',
    titleFight: 'TITLE FIGHT', championship: 'CHAMPIONSHIP',
    nextCircuit: 'NEXT CIRCUIT', headlines: 'HEADLINES',
    drivers: 'DRIVERS', constructors: 'CONSTRUCTORS',
    inDays: 'IN {{n}} DAYS', seeTable: 'SEE TABLE →',
    winner: '★ WINNER', fastestLap: '◷ FASTEST LAP',
    racesLeft: '{{n}} RACES LEFT', yourDriver: 'YOUR DRIVER',
    season: 'SEASON', change: '⇄ CHANGE', noSession: 'NO LIVE SESSION',
    position: 'POSITION', points: 'POINTS', last: 'LAST', form: 'FORM',
    next: 'NEXT',
  },
  calendar: {
    title: 'CALENDAR', rounds: '{{n}} ROUNDS',
    nextRace: 'NEXT RACE', thisWeekend: 'THIS WEEKEND',
    completed: 'COMPLETED', upcoming: 'UPCOMING',
    raceWeekend: 'RACE WEEKEND SCHEDULE', allTimes: '{{city}} TIME',
    theCircuit: 'THE CIRCUIT', weather: 'WEEKEND WEATHER',
    yourDriverHere: 'YOUR DRIVER', viewResults: 'VIEW FULL RESULTS →',
    practice1: 'Practice 1', practice2: 'Practice 2', practice3: 'Practice 3',
    qualifying: 'Qualifying', sprintQualifying: 'Sprint Qualifying',
    sprint: 'Sprint', race: 'Race',
    round: 'ROUND', tomorrow: 'TOMORROW', thisWeekendShort: 'THIS WEEKEND',
    circuit: {
      length: 'LENGTH', laps: 'LAPS', distance: 'DISTANCE',
      turns: 'TURNS', drs: 'DRS ZONES', direction: 'DIRECTION',
      clockwise: 'Clockwise', anticlockwise: 'Anti-clockwise',
      lapRecord: 'LAP RECORD', compounds: 'COMPOUNDS',
    },
    regions: { americas: 'AMERICAS', europe: 'EUROPE', asiaPacific: 'ASIA / PACIFIC' },
  },
  standings: {
    title: 'STANDINGS', driverChampionship: 'DRIVER CHAMPIONSHIP',
    constructorChampionship: 'CONSTRUCTOR CHAMPIONSHIP',
    drivers: 'DRIVERS', constructors: 'CONSTRUCTORS',
    points: 'PTS', worldLeader: '● CHAMPIONSHIP LEADER',
  },
  results: {
    title: 'RESULTS', chooseRace: 'RESULTS · CHOOSE A RACE',
    classification: 'CLASSIFICATION', gap: 'GAP', points: 'PTS',
    laps: '{{n}} LAPS', result: 'RESULT', round: 'ROUND',
  },
  live: {
    title: 'LIVE', noSession: 'NO LIVE SESSION',
    nextSession: 'NEXT SESSION', updating: 'UPDATING EVERY 4S',
    updatedAgo: 'UPDATED {{n}}S AGO', positions: 'POSITIONS',
    gap: 'GAP', lastLap: 'LAST LAP', live: 'LIVE',
  },
  timezone: {
    title: 'Where are you?', subtitle: 'Session times will adjust to your timezone',
    confirm: 'CONFIRM', change: 'Change timezone',
    regions: { americas: 'AMERICAS', europe: 'EUROPE', asiaPacific: 'ASIA & OCEANIA' },
  },
  tooltips: {
    compounds: {
      title: 'TYRE COMPOUNDS',
      text: 'Pirelli assigns 3 compounds per race. C1 is the hardest (most durable) and C6 the softest (fastest but wears faster).',
    },
    drs: {
      title: 'DRS',
      text: 'DRS opens the rear wing to reduce drag, making overtaking easier. Only usable in designated zones within 1 second of the car ahead.',
    },
    lapRecord: {
      title: 'HISTORICAL RECORD',
      text: 'The fastest lap time ever recorded at this circuit in Formula 1 history.',
    },
  },
  days: { mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT', sun: 'SUN' },
  months: {
    jan: 'JAN', feb: 'FEB', mar: 'MAR', apr: 'APR', may: 'MAY', jun: 'JUN',
    jul: 'JUL', aug: 'AUG', sep: 'SEP', oct: 'OCT', nov: 'NOV', dec: 'DEC',
  },
}
