export default {
  nav: {
    home: 'INÍCIO', calendar: 'CALENDÁRIO', standings: 'CLASSIFICAÇÃO',
    results: 'RESULTADOS', live: 'AO VIVO',
  },
  home: {
    nextRace: 'PRÓXIMA CORRIDA', lastRace: 'ÚLTIMO GP',
    titleFight: 'BRIGA PELO TÍTULO', championship: 'CAMPEONATO',
    nextCircuit: 'PRÓXIMO CIRCUITO', headlines: 'MANCHETES',
    drivers: 'PILOTOS', constructors: 'CONSTRUTORES',
    inDays: 'EM {{n}} DIAS', seeTable: 'VER TABELA →',
    winner: '★ VENCEDOR', fastestLap: '◷ VOLTA MAIS RÁPIDA',
    racesLeft: '{{n}} CORRIDAS REST.', yourDriver: 'SEU PILOTO',
    season: 'TEMPORADA', change: '⇄ TROCAR', noSession: 'SEM SESSÃO AO VIVO',
    position: 'POSIÇÃO', points: 'PONTOS', last: 'ÚLTIMA', form: 'FORMA',
    next: 'PRÓXIMA',
  },
  calendar: {
    title: 'CALENDÁRIO', rounds: '{{n}} ETAPAS',
    nextRace: 'PRÓXIMA CORRIDA', thisWeekend: 'ESTE FIM DE SEMANA',
    completed: 'CONCLUÍDO', upcoming: 'AGENDADO',
    raceWeekend: 'HORÁRIOS DO FIM DE SEMANA', allTimes: 'HORA {{city}}',
    theCircuit: 'O CIRCUITO', weather: 'CLIMA DO FIM DE SEMANA',
    yourDriverHere: 'SEU PILOTO', viewResults: 'VER RESULTADOS COMPLETOS →',
    practice1: 'Treino Livre 1', practice2: 'Treino Livre 2', practice3: 'Treino Livre 3',
    qualifying: 'Classificação', sprintQualifying: 'Classif. Sprint',
    sprint: 'Sprint', race: 'Corrida',
    round: 'ETAPA', tomorrow: 'AMANHÃ', thisWeekendShort: 'ESTE FIM DE SEMANA',
    circuit: {
      length: 'COMPRIMENTO', laps: 'VOLTAS', distance: 'DISTÂNCIA',
      turns: 'CURVAS', drs: 'ZONAS DRS', direction: 'SENTIDO',
      clockwise: 'Horário', anticlockwise: 'Anti-horário',
      lapRecord: 'RECORDE DE VOLTA', compounds: 'COMPOSTOS',
    },
    regions: { americas: 'AMÉRICAS', europe: 'EUROPA', asiaPacific: 'ÁSIA / PACÍFICO' },
  },
  standings: {
    title: 'CLASSIFICAÇÃO', driverChampionship: 'CAMPEONATO DE PILOTOS',
    constructorChampionship: 'CAMPEONATO DE CONSTRUTORES',
    drivers: 'PILOTOS', constructors: 'CONSTRUTORES',
    points: 'PTS', worldLeader: '● LÍDER DO MUNDIAL',
  },
  results: {
    title: 'RESULTADOS', chooseRace: 'RESULTADOS · ESCOLHA A CORRIDA',
    classification: 'CLASSIFICAÇÃO', gap: 'DIF.', points: 'PTS',
    laps: '{{n}} VOLTAS', result: 'RESULTADO', round: 'ETAPA',
  },
  live: {
    title: 'AO VIVO', noSession: 'SEM SESSÃO AO VIVO',
    nextSession: 'PRÓXIMA SESSÃO', updating: 'ATUALIZANDO A CADA 4S',
    updatedAgo: 'ATUALIZADO HÁ {{n}}S', positions: 'POSIÇÕES',
    gap: 'GAP', lastLap: 'ÚLT. VOLTA', live: 'AO VIVO',
  },
  timezone: {
    title: 'Onde você está?', subtitle: 'Os horários serão ajustados ao seu fuso',
    confirm: 'CONFIRMAR', change: 'Mudar fuso horário',
    regions: { americas: 'AMÉRICAS', europe: 'EUROPA', asiaPacific: 'ÁSIA E OCEANIA' },
  },
  tooltips: {
    compounds: {
      title: 'PNEUS',
      text: 'A Pirelli define 3 compostos por corrida. C1 é o mais duro (mais durável) e C6 o mais macio (mais rápido, porém se desgasta mais).',
    },
    drs: {
      title: 'DRS',
      text: 'O DRS abre o aerofólio traseiro para reduzir o arrasto. Usado apenas em zonas designadas e quando estiver a menos de 1 segundo do carro à frente.',
    },
    lapRecord: {
      title: 'RECORDE HISTÓRICO',
      text: 'O tempo de volta mais rápido já registrado neste circuito na história da Fórmula 1.',
    },
  },
  days: { mon: 'SEG', tue: 'TER', wed: 'QUA', thu: 'QUI', fri: 'SEX', sat: 'SÁB', sun: 'DOM' },
  months: {
    jan: 'JAN', feb: 'FEV', mar: 'MAR', apr: 'ABR', may: 'MAI', jun: 'JUN',
    jul: 'JUL', aug: 'AGO', sep: 'SET', oct: 'OUT', nov: 'NOV', dec: 'DEZ',
  },
}
