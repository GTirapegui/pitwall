/**
 * Design tokens — spec-exact from design_handoff_pitwall/ESPECIFICACIONES.md
 * Primary names match CSS variables in the HTML reference files.
 */

export const Dark = {
  // Core tokens
  paper:    '#0B0B0F',
  surface:  '#16161D',
  surface2: '#1D1D26',
  ink:      '#F3F1EA',
  ink2:     '#C9C7BD',
  muted:    '#76757F',
  dim:      '#3A3A44',
  line:     'rgba(255,255,255,.11)',
  line2:    'rgba(255,255,255,.055)',
  red:      '#FF2118',
  redDeep:  '#FF4438',
  gold:     '#F2BE4B',
  purple:   '#C084FC',
  silver:   '#C2C8D0',
  bronze:   '#D08C4F',
  grain:    'rgba(255,255,255,.03)',

  // Backward-compat aliases (used by non-redesigned components)
  bg:           '#0B0B0F',
  surface_old:  '#16161D',
  accent:       '#FF2118',
  textPrimary:  '#F3F1EA',
  textSecondary:'#76757F',
  sep:          'rgba(255,255,255,.11)',
  raceRowBg:    'rgba(255,33,24,0.07)',
  p1RowBg:      'rgba(242,190,75,0.06)',
} as const;

export const Light = {
  // Core tokens
  paper:    '#E7E5DE',
  surface:  '#FAF9F4',
  surface2: '#F1EFE7',
  ink:      '#16161C',
  ink2:     '#46453E',
  muted:    '#8C8A7F',
  dim:      '#C9C7BD',
  line:     'rgba(20,20,28,.12)',
  line2:    'rgba(20,20,28,.07)',
  red:      '#E10600',
  redDeep:  '#B00500',
  gold:     '#C99A2E',
  purple:   '#A855F7',
  silver:   '#AEB4BC',
  bronze:   '#C17C3F',
  grain:    'rgba(20,20,28,.045)',

  // Backward-compat aliases
  bg:           '#E7E5DE',
  surface_old:  '#FAF9F4',
  accent:       '#E10600',
  textPrimary:  '#16161C',
  textSecondary:'#8C8A7F',
  sep:          'rgba(20,20,28,.12)',
  raceRowBg:    'rgba(225,6,0,0.06)',
  p1RowBg:      'rgba(201,154,46,0.08)',
} as const;

/** Team accent colors */
export const TEAM = {
  'Mercedes':         '#00D7B6',
  'Ferrari':          '#E8002D',
  'McLaren':          '#FF8000',
  'Red Bull Racing':  '#3671C6',
  'Alpine':           '#0093CC',
  'Racing Bulls':     '#6692FF',
  'RB':               '#6692FF',
  'Haas F1 Team':     '#9CA3AF',
  'Williams':         '#1868DB',
  'Audi':             '#BB0A30',
  'Aston Martin':     '#229971',
  'Kick Sauber':      '#52E252',
} as const;

/** Tyre compound colors */
export const TYRE = {
  S: '#E8002D',
  M: '#F2C94C',
  H: '#cfcfcf',
} as const;

export type Tokens = typeof Dark;
export type ColorSchemeColors = Tokens; // full alias for useColors hook
