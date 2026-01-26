import { createClient } from '@/lib/supabase/server'
import { PlayersClient } from './players-client'
import { processPlayersWithStats } from '@/lib/utils/process-players'
import { calculateTiers } from '@/lib/utils/tier-calculator'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
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
      penalties(player_id, penalty_type)
    `)
    .order('name')

  if (error) {
    logger.error(ERROR_MESSAGES.LOAD_PLAYERS_ERROR, error)
    return (
      <div className="text-center py-12">
        <p className="text-xl text-red-600">{ERROR_MESSAGES.LOAD_PLAYERS_ERROR}</p>
      </div>
    )
  }

  // Processar jogadores com estatísticas e separação de penalties por tipo
  const playersWithStats = processPlayersWithStats(players || [], true)

  // Calcular tiers usando função utilitária
  const { tierSlots, avgPoints, playersWithTiers } = calculateTiers(playersWithStats)

  return <PlayersClient players={playersWithTiers} tierSlots={tierSlots} avgPoints={avgPoints} />
}
