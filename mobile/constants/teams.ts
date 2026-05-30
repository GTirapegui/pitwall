export const TEAM_COLORS: Record<string, string> = {
  'McLaren': '#FF8000',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'Red Bull Racing': '#3671C6',
  'Williams': '#1868DB',
  'Aston Martin': '#229971',
  'RB': '#6692FF',
  'Racing Bulls': '#6692FF',
  'Kick Sauber': '#52E252',
  'Haas F1 Team': '#B6BABD',
  'Alpine': '#00A1E8',
};

export const TEAM_SHORT: Record<string, string> = {
  'McLaren': 'MCL',
  'Ferrari': 'FER',
  'Mercedes': 'MER',
  'Red Bull Racing': 'RBR',
  'Williams': 'WIL',
  'Aston Martin': 'AMR',
  'RB': 'RB',
  'Racing Bulls': 'RB',
  'Kick Sauber': 'SAU',
  'Haas F1 Team': 'HAA',
  'Alpine': 'ALP',
};

export function getTeamColor(teamName: string): string {
  return TEAM_COLORS[teamName] ?? '#8A8A8E';
}
