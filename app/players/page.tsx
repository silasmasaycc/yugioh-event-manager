import { createClient } from '@/lib/supabase/server'
import { PageLayout } from '@/components/layout/page-layout'
import { PlayerCard } from '@/components/player/player-card'
import { calculatePlayerStats } from '@/lib/utils/player-stats'
import { ERROR_MESSAGES, LABELS } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'

export const revalidate = 3600 // 1 hora

export default async function PlayersPage() {
  const supabase = await createClient()

  // Query otimizada com LEFT JOIN via Supabase
  const { data: players, error } = await supabase
    .from('players')
    .select(`
      *,
      tournament_results(placement, tournament_id),
      penalties(player_id)
    `)
    .order('name')

  if (error) {
    logger.error(ERROR_MESSAGES.LOAD_PLAYERS_ERROR, error)
    return (
      <PageLayout activeRoute="/players">
        <div className="text-center py-12">
          <p className="text-xl text-red-600">{ERROR_MESSAGES.LOAD_PLAYERS_ERROR}</p>
        </div>
      </PageLayout>
    )
  }

  // Calcular estatísticas para cada jogador usando a função utilitária
  const playersWithStats = players?.map(player => 
    calculatePlayerStats(player, player.penalties || [])
  ).sort((a, b) => {
    // Ordenar pelo mesmo critério do ranking: Pontos → TOPs → Percentual
    const pointsA = (a.firstPlace * 4) + (a.secondPlace * 3) + (a.thirdPlace * 2) + (a.fourthPlace * 2)
    const pointsB = (b.firstPlace * 4) + (b.secondPlace * 3) + (b.thirdPlace * 2) + (b.fourthPlace * 2)
    
    if (pointsB !== pointsA) return pointsB - pointsA
    if (b.totalTops !== a.totalTops) return b.totalTops - a.totalTops
    return b.topPercentage - a.topPercentage
  })

  return (
    <PageLayout activeRoute="/players">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">{LABELS.PLAYERS}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Lista completa de jogadores cadastrados no sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {playersWithStats?.map((player) => (
          <PlayerCard key={player.id} player={player} showPenalties={true} />
        ))}
      </div>

      {(!playersWithStats || playersWithStats.length === 0) && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {LABELS.NO_PLAYERS}
          </p>
        </div>
      )}
    </PageLayout>
  )
}
