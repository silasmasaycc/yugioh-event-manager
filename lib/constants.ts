/**
 * Constantes compartilhadas do projeto
 */

// Cache e Revalidação
export const REVALIDATE_TIME = 3600 // 1 hora em segundos

// Posições em Torneios
export const TOP_POSITIONS = 4
export const FIRST_PLACE = 1
export const SECOND_PLACE = 2
export const THIRD_PLACE = 3
export const FOURTH_PLACE = 4

// Limites de Rankings e Gráficos
export const TOP_PLAYERS_LIMIT = 10
export const MINIMUM_TOURNAMENTS_FOR_RANKING = 2

// Cores de Medalhas
export const MEDAL_COLORS = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600',
  4: 'text-gray-300'
} as const

// Emojis de Medalhas
export const MEDAL_EMOJIS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
  4: '4️⃣'
} as const
