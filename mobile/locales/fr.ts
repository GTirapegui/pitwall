export default {
  nav: {
    home: 'ACCUEIL', calendar: 'CALENDRIER', standings: 'CLASSEMENT',
    results: 'RÉSULTATS', live: 'EN DIRECT',
  },
  home: {
    nextRace: 'PROCHAIN GRAND PRIX', lastRace: 'DERNIER GP',
    titleFight: 'LUTTE POUR LE TITRE', championship: 'CHAMPIONNAT',
    nextCircuit: 'PROCHAIN CIRCUIT', headlines: 'ACTUALITÉS',
    drivers: 'PILOTES', constructors: 'CONSTRUCTEURS',
    inDays: 'DANS {{n}} JOURS', seeTable: 'VOIR TABLEAU →',
    winner: '★ VAINQUEUR', fastestLap: '◷ MEILLEUR TOUR',
    racesLeft: '{{n}} COURSES REST.', yourDriver: 'VOTRE PILOTE',
    season: 'SAISON', change: '⇄ CHANGER', noSession: 'AUCUNE SESSION EN DIRECT',
    position: 'POSITION', points: 'POINTS', last: 'DERNIER', form: 'FORME',
    next: 'PROCHAIN',
  },
  calendar: {
    title: 'CALENDRIER', rounds: '{{n}} MANCHES',
    nextRace: 'PROCHAIN GP', thisWeekend: 'CE WEEK-END',
    completed: 'TERMINÉ', upcoming: 'À VENIR',
    raceWeekend: 'HORAIRES DU WEEK-END', allTimes: 'HEURE {{city}}',
    theCircuit: 'LE CIRCUIT', weather: 'MÉTÉO DU WEEK-END',
    yourDriverHere: 'VOTRE PILOTE', viewResults: 'VOIR LES RÉSULTATS COMPLETS →',
    practice1: 'Essais Libres 1', practice2: 'Essais Libres 2', practice3: 'Essais Libres 3',
    qualifying: 'Qualifications', sprintQualifying: 'Sprint Qualif.',
    sprint: 'Sprint', race: 'Course',
    round: 'MANCHE', tomorrow: 'DEMAIN', thisWeekendShort: 'CE WEEK-END',
    circuit: {
      length: 'LONGUEUR', laps: 'TOURS', distance: 'DISTANCE',
      turns: 'VIRAGES', drs: 'ZONES DRS', direction: 'SENS',
      clockwise: 'Sens horaire', anticlockwise: 'Sens anti-horaire',
      lapRecord: 'RECORD DU TOUR', compounds: 'COMPOSÉS',
    },
    regions: { americas: 'AMÉRIQUES', europe: 'EUROPE', asiaPacific: 'ASIE / PACIFIQUE' },
  },
  standings: {
    title: 'CLASSEMENT', driverChampionship: 'CHAMPIONNAT PILOTES',
    constructorChampionship: 'CHAMPIONNAT CONSTRUCTEURS',
    drivers: 'PILOTES', constructors: 'CONSTRUCTEURS',
    points: 'PTS', worldLeader: '● LEADER DU CHAMPIONNAT',
  },
  results: {
    title: 'RÉSULTATS', chooseRace: 'RÉSULTATS · CHOISIR UNE COURSE',
    classification: 'CLASSEMENT', gap: 'ÉCART', points: 'PTS',
    laps: '{{n}} TOURS', result: 'RÉSULTAT', round: 'MANCHE',
  },
  live: {
    title: 'EN DIRECT', noSession: 'AUCUNE SESSION EN DIRECT',
    nextSession: 'PROCHAINE SESSION', updating: 'MISE À JOUR TOUTES LES 4S',
    updatedAgo: 'MIS À JOUR IL Y A {{n}}S', positions: 'POSITIONS',
    gap: 'ÉCART', lastLap: 'DERN. TOUR', live: 'EN DIRECT',
  },
  timezone: {
    title: 'Où êtes-vous ?', subtitle: 'Les horaires s\'adapteront à votre fuseau',
    confirm: 'CONFIRMER', change: 'Changer le fuseau horaire',
    regions: { americas: 'AMÉRIQUES', europe: 'EUROPE', asiaPacific: 'ASIE ET OCÉANIE' },
  },
  tooltips: {
    compounds: {
      title: 'PNEUMATIQUES',
      text: 'Pirelli attribue 3 composés par course. C1 est le plus dur (le plus durable) et C6 le plus tendre (le plus rapide mais s\'use vite).',
    },
    drs: {
      title: 'DRS',
      text: 'Le DRS ouvre l\'aileron arrière pour réduire la traînée aérodynamique. Utilisable uniquement dans les zones désignées et à moins d\'1 seconde du pilote devant.',
    },
    lapRecord: {
      title: 'RECORD HISTORIQUE',
      text: 'Le meilleur tour jamais réalisé sur ce circuit dans l\'histoire de la Formule 1.',
    },
  },
  days: { mon: 'LUN', tue: 'MAR', wed: 'MER', thu: 'JEU', fri: 'VEN', sat: 'SAM', sun: 'DIM' },
  months: {
    jan: 'JAN', feb: 'FÉV', mar: 'MAR', apr: 'AVR', may: 'MAI', jun: 'JUN',
    jul: 'JUL', aug: 'AOÛ', sep: 'SEP', oct: 'OCT', nov: 'NOV', dec: 'DÉC',
  },
}
