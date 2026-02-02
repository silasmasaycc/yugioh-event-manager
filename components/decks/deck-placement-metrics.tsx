import { MEDAL_ICONS } from '@/lib/constants'

interface PlacementMetricsProps {
  placements: { 1: number; 2: number; 3: number; 4: number }
  showOnlyIfExists?: boolean
}

const PLACEMENT_STYLES = {
  1: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400'
  },
  2: {
    container: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400'
  },
  3: {
    container: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400'
  },
  4: {
    container: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400'
  }
} as const

/**
 * Componente para exibir métricas de colocações (1º, 2º, 3º, 4º)
 * Mostra ícones de medalhas com contadores
 */
export function DeckPlacementMetrics({ placements, showOnlyIfExists = true }: PlacementMetricsProps) {
  const positions = [1, 2, 3, 4] as const

  return (
    <div className="flex gap-1.5 sm:gap-2 md:gap-3 shrink-0">
      {positions.map((position) => {
        const count = placements[position]
        
        // Se showOnlyIfExists=true, só mostra se tiver contagem
        if (showOnlyIfExists && count === 0) return null

        const styles = PLACEMENT_STYLES[position]
        
        return (
          <div 
            key={position}
            className={`${styles.container} rounded-lg px-1.5 sm:px-2 py-1 text-center min-w-[2.5rem] sm:min-w-[3rem]`}
          >
            <div className={`text-base sm:text-lg md:text-xl font-bold ${styles.text}`}>
              {count}
            </div>
            <div className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400">
              {MEDAL_ICONS[position]}
            </div>
          </div>
        )
      })}
    </div>
  )
}
