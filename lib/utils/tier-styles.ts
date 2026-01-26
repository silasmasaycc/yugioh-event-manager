/**
 * Utilitários para estilização de tiers
 * Centraliza as cores e estilos CSS dos badges de tier
 */

/**
 * Retorna as classes CSS para o badge de tier
 * @param tier - Tier do jogador (S, A, B, C, D ou null)
 * @returns Classes Tailwind CSS para o badge
 */
export function getTierBadgeColor(tier: string | null): string {
  switch (tier) {
    case 'S': return 'bg-red-500 text-white border-red-600'
    case 'A': return 'bg-yellow-500 text-white border-yellow-600'
    case 'B': return 'bg-green-500 text-white border-green-600'
    case 'C': return 'bg-blue-500 text-white border-blue-600'
    case 'D': return 'bg-gray-500 text-white border-gray-600'
    default: return 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
  }
}

/**
 * Retorna as classes CSS para a borda lateral colorida por tier
 * @param tier - Tier do jogador (S, A, B, C, D ou null)
 * @returns Classes Tailwind CSS para a borda lateral
 */
export function getTierBorderColor(tier: string | null): string {
  switch (tier) {
    case 'S': return 'border-l-4 border-l-red-500'
    case 'A': return 'border-l-4 border-l-yellow-500'
    case 'B': return 'border-l-4 border-l-green-500'
    case 'C': return 'border-l-4 border-l-blue-500'
    case 'D': return 'border-l-4 border-l-gray-500'
    default: return 'border-l-4 border-l-gray-300 dark:border-l-gray-700'
  }
}
