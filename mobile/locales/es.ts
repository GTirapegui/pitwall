export default {
  nav: {
    home: 'INICIO', calendar: 'CALENDARIO', standings: 'POSICIONES',
    results: 'RESULTADOS', live: 'EN VIVO',
  },
  home: {
    nextRace: 'PRÓXIMA CARRERA', lastRace: 'ÚLTIMO GP',
    titleFight: 'LUCHA POR EL TÍTULO', championship: 'CAMPEONATO',
    nextCircuit: 'PRÓXIMO CIRCUITO', headlines: 'TITULARES',
    drivers: 'PILOTOS', constructors: 'CONSTRUCTORES',
    inDays: 'EN {{n}} DÍAS', seeTable: 'VER TABLA →',
    winner: '★ GANADOR', fastestLap: '◷ VUELTA RÁPIDA',
    racesLeft: '{{n}} FECHAS REST.', yourDriver: 'TU PILOTO',
    season: 'TEMPORADA', change: '⇄ CAMBIAR', noSession: 'NO HAY SESIÓN EN VIVO',
    position: 'POSICIÓN', points: 'PUNTOS', last: 'ÚLTIMA', form: 'FORMA',
    next: 'PRÓXIMA',
  },
  calendar: {
    title: 'CALENDARIO', rounds: '{{n}} FECHAS',
    nextRace: 'PRÓXIMA CARRERA', thisWeekend: 'ESTE FIN DE SEMANA',
    completed: 'FINALIZADO', upcoming: 'PROGRAMADA',
    raceWeekend: 'HORARIOS DEL FIN DE SEMANA', allTimes: 'HORA {{city}}',
    theCircuit: 'EL CIRCUITO', weather: 'CLIMA DEL FIN DE SEMANA',
    yourDriverHere: 'TU PILOTO AQUÍ', viewResults: 'VER RESULTADOS COMPLETOS →',
    practice1: 'Práctica 1', practice2: 'Práctica 2', practice3: 'Práctica 3',
    qualifying: 'Clasificación', sprintQualifying: 'Clasif. Sprint',
    sprint: 'Sprint', race: 'Carrera',
    round: 'RONDA', tomorrow: 'MAÑANA', thisWeekendShort: 'ESTE FIN DE SEMANA',
    circuit: {
      length: 'LONGITUD', laps: 'VUELTAS', distance: 'DISTANCIA',
      turns: 'CURVAS', drs: 'ZONAS DRS', direction: 'SENTIDO',
      clockwise: 'Horario', anticlockwise: 'Antihorario',
      lapRecord: 'RÉCORD DE VUELTA', compounds: 'COMPUESTOS',
    },
    regions: { americas: 'AMÉRICAS', europe: 'EUROPA', asiaPacific: 'ASIA / PACÍFICO' },
  },
  standings: {
    title: 'POSICIONES', driverChampionship: 'CAMPEONATO DE PILOTOS',
    constructorChampionship: 'CAMPEONATO DE CONSTRUCTORES',
    drivers: 'PILOTOS', constructors: 'CONSTRUCTORES',
    points: 'PTS', worldLeader: '● LÍDER DEL MUNDIAL',
  },
  results: {
    title: 'RESULTADOS', chooseRace: 'RESULTADOS · ELIGE LA CARRERA',
    classification: 'CLASIFICACIÓN', gap: 'DIF.', points: 'PTS',
    laps: '{{n}} VUELTAS', result: 'RESULTADO', round: 'RONDA',
  },
  live: {
    title: 'EN VIVO', noSession: 'NO HAY SESIÓN EN VIVO',
    nextSession: 'PRÓXIMA SESIÓN', updating: 'ACTUALIZANDO CADA 4S',
    updatedAgo: 'ACTUALIZADO HACE {{n}}S', positions: 'POSICIONES',
    gap: 'GAP', lastLap: 'ÚLT. VUELTA', live: 'EN VIVO',
  },
  timezone: {
    title: '¿Dónde estás?', subtitle: 'Los horarios de sesión se ajustarán a tu zona',
    confirm: 'CONFIRMAR', change: 'Cambiar timezone',
    regions: { americas: 'AMÉRICAS', europe: 'EUROPA', asiaPacific: 'ASIA / PACÍFICO' },
  },
  tooltips: {
    compounds: {
      title: 'NEUMÁTICOS',
      text: 'Pirelli asigna 3 compuestos por carrera. C1 es el más duro (más duradero) y C6 el más blando (más rápido pero se desgasta antes).',
    },
    drs: {
      title: 'DRS',
      text: 'El DRS abre el alerón trasero para reducir la resistencia al aire. Solo se puede usar en zonas designadas y cuando estás a menos de 1 segundo del auto de adelante.',
    },
    lapRecord: {
      title: 'RÉCORD HISTÓRICO',
      text: 'El tiempo de vuelta más rápido registrado en este circuito en toda la historia de la Fórmula 1.',
    },
  },
  days: { mon: 'LUN', tue: 'MAR', wed: 'MIÉ', thu: 'JUE', fri: 'VIE', sat: 'SÁB', sun: 'DOM' },
  months: {
    jan: 'ENE', feb: 'FEB', mar: 'MAR', apr: 'ABR', may: 'MAY', jun: 'JUN',
    jul: 'JUL', aug: 'AGO', sep: 'SEP', oct: 'OCT', nov: 'NOV', dec: 'DIC',
  },
}
