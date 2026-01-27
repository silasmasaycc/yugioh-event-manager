import { createClient } from '@/lib/supabase/server'
import { PlayersClient } from './players-client'
import { filterPlayersByTournamentType, processPlayersWithStats } from '@/lib/utils/process-players'
import { calculateTiers } from '@/lib/utils/tier-calculator'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'

export const revalidate = 3600 // 1 hora

export default async function PlayersPage() {
  const supabase = await createClient()

  // Buscar apenas torneios de veteranos (excluir torneios de novatos)
  const { data: regularTournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('id')
    .neq('tournament_type', 'beginner')

  if (tournamentsError) {
    logger.error('Erro ao carregar torneios de veteranos', tournamentsError)
  }

  const regularTournamentIds = regularTournaments?.map(t => t.id) || []

  // Query otimizada com LEFT JOIN via Supabase
  const { data: players, error } = await supabase
    .from('players')
    .select(`
      *,
      tournament_results(placement, tournament_id, tournaments(tournament_type)),
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

  // Filtrar apenas resultados de torneios de veteranos E penalties de veteranos
  const playersFiltered = filterPlayersByTournamentType(players || [], regularTournamentIds, 'regular')

  // Processar jogadores com estatísticas e separação de penalties por tipo
  const playersWithStats = processPlayersWithStats(playersFiltered, true)

  // Calcular tiers usando função utilitária
  const { tierSlots, avgPoints, playersWithTiers } = calculateTiers(playersWithStats)

  return <PlayersClient players={playersWithTiers} tierSlots={tierSlots} avgPoints={avgPoints} isBeginnerMode={false} />
}
