export default {
  nav: {
    home: 'ホーム', calendar: 'カレンダー', standings: 'ランキング',
    results: 'リザルト', live: 'ライブ',
  },
  home: {
    nextRace: '次のレース', lastRace: '最終GP',
    titleFight: 'タイトル争い', championship: 'チャンピオンシップ',
    nextCircuit: '次のサーキット', headlines: 'ニュース',
    drivers: 'ドライバー', constructors: 'コンストラクター',
    inDays: '{{n}}日後', seeTable: '表を見る →',
    winner: '★ 優勝', fastestLap: '◷ ファステストラップ',
    racesLeft: '残り{{n}}戦', yourDriver: 'あなたのドライバー',
    season: 'シーズン', change: '⇄ 変更', noSession: 'ライブセッションなし',
    position: '順位', points: 'ポイント', last: '最終', form: '調子',
    next: '次回',
  },
  calendar: {
    title: 'カレンダー', rounds: '{{n}}戦',
    nextRace: '次のGP', thisWeekend: '今週末',
    completed: '終了', upcoming: '予定',
    raceWeekend: 'レースウィークスケジュール', allTimes: '{{city}}時間',
    theCircuit: 'サーキット', weather: '週末の天気',
    yourDriverHere: 'あなたのドライバー', viewResults: '全リザルトを見る →',
    practice1: 'フリー走行1', practice2: 'フリー走行2', practice3: 'フリー走行3',
    qualifying: '予選', sprintQualifying: 'スプリント予選',
    sprint: 'スプリント', race: '決勝',
    round: 'ラウンド', tomorrow: '明日', thisWeekendShort: '今週末',
    circuit: {
      length: '距離', laps: '周回数', distance: '総距離',
      turns: 'コーナー数', drs: 'DRSゾーン', direction: '周回方向',
      clockwise: '時計回り', anticlockwise: '反時計回り',
      lapRecord: 'ラップレコード', compounds: 'コンパウンド',
    },
    regions: { americas: 'アメリカ', europe: 'ヨーロッパ', asiaPacific: 'アジア・太平洋' },
  },
  standings: {
    title: 'ランキング', driverChampionship: 'ドライバーズチャンピオンシップ',
    constructorChampionship: 'コンストラクターズチャンピオンシップ',
    drivers: 'ドライバー', constructors: 'コンストラクター',
    points: 'pts', worldLeader: '● チャンピオンシップリーダー',
  },
  results: {
    title: 'リザルト', chooseRace: 'リザルト · レースを選択',
    classification: '分類', gap: 'ギャップ', points: 'pts',
    laps: '{{n}}周', result: 'リザルト', round: 'ラウンド',
  },
  live: {
    title: 'ライブ', noSession: 'ライブセッションなし',
    nextSession: '次のセッション', updating: '4秒ごとに更新',
    updatedAgo: '{{n}}秒前に更新', positions: '順位',
    gap: 'ギャップ', lastLap: '最終ラップ', live: 'ライブ',
  },
  timezone: {
    title: '現在地を選択', subtitle: 'セッション時刻はタイムゾーンに合わせて表示',
    confirm: '確認', change: 'タイムゾーンを変更',
    regions: { americas: 'アメリカ', europe: 'ヨーロッパ', asiaPacific: 'アジア・オセアニア' },
  },
  tooltips: {
    compounds: {
      title: 'タイヤコンパウンド',
      text: 'ピレリはレースごとに3種類のコンパウンドを指定します。C1が最も硬く耐久性が高く、C6が最も柔らかく速いですが摩耗が早いです。',
    },
    drs: {
      title: 'DRS',
      text: 'DRSはリアウイングを開いて空気抵抗を減らします。指定ゾーン内で前車との差が1秒以内の場合のみ使用可能です。',
    },
    lapRecord: {
      title: 'サーキットレコード',
      text: 'このサーキットにおけるF1の全歴史を通じての最速ラップタイム。',
    },
  },
  days: { mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土', sun: '日' },
  months: {
    jan: '1月', feb: '2月', mar: '3月', apr: '4月', may: '5月', jun: '6月',
    jul: '7月', aug: '8月', sep: '9月', oct: '10月', nov: '11月', dec: '12月',
  },
}
