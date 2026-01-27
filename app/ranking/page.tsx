import { createClient } from '@/lib/supabase/server'
import { RankingClient } from './ranking-client'
import { filterAndProcessPlayers, processPenaltyStats } from '@/lib/utils/process-players'
import { calculateTiers } from '@/lib/utils/tier-calculator'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'

export const revalidate = 3600 // 1 hora

export default async function RankingPage() {
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

  // Query otimizada com LEFT JOIN
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select(`
      *,
      tournament_results(
        placement, 
        tournament_id,
        tournaments(date, tournament_type)
      ),
      penalties(player_id)
    `)
    .order('name')

  if (playersError) {
    logger.error(ERROR_MESSAGES.LOAD_PLAYERS_ERROR, playersError)
    return (
      <div className="text-center py-12">
        <p className="text-xl text-red-600">{ERROR_MESSAGES.LOAD_PLAYERS_ERROR}</p>
      </div>
    )
  }

  // Filtrar apenas resultados de torneios de veteranos e processar estatísticas
  // Apenas jogadores com pelo menos 1 torneio podem entrar no ranking
  const playersWithStats = filterAndProcessPlayers(players || [], regularTournamentIds, false, 'regular')
    .filter(p => p.totalTournaments > 0)

  // Calcular tiers usando função utilitária
  const { tierSlots, avgPoints, playersWithTiers } = calculateTiers(playersWithStats)

  // Query para penalidades de veteranos (sem exigir participação em torneios)
  const { data: penaltyPlayers } = await supabase
    .from('players')
    .select(`
      *,
      tournament_results(placement, tournament_id),
      penalties!inner(player_id, penalty_type)
    `)
    .neq('penalties.penalty_type', 'beginner')
    .order('name')

  // Usar função utilitária para processar jogadores com penalidades
  const penaltyPlayersProcessed = filterAndProcessPlayers(penaltyPlayers || [], regularTournamentIds, false, 'regular')
  const penaltyStats = processPenaltyStats(penaltyPlayersProcessed)

  return <RankingClient players={playersWithTiers} penaltyStats={penaltyStats} tierSlots={tierSlots} avgPoints={avgPoints} />
}
