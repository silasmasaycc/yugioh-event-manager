import { createClient } from '@/lib/supabase/server'
import { RankingClient } from '../ranking-client'
import { filterAndProcessPlayers, processPenaltyStats } from '@/lib/utils/process-players'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'

export const revalidate = 3600 // 1 hora

export default async function BeginnerRankingPage() {
  const supabase = await createClient()

  // Buscar apenas torneios de novatos
  const { data: beginnerTournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('id')
    .eq('tournament_type', 'beginner')

  if (tournamentsError) {
    logger.error('Erro ao carregar torneios de novatos', tournamentsError)
    return (
      <div className="text-center py-12">
        <p className="text-xl text-red-600">Erro ao carregar torneios de novatos</p>
      </div>
    )
  }

  const beginnerTournamentIds = beginnerTournaments?.map(t => t.id) || []

  // Query otimizada com LEFT JOIN - apenas resultados de torneios de novatos
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select(`
      *,
      tournament_results!inner(
        placement, 
        tournament_id,
        tournaments(date, tournament_type)
      ),
      penalties(player_id)
    `)
    .in('tournament_results.tournament_id', beginnerTournamentIds)
    .order('name')

  if (playersError) {
    logger.error(ERROR_MESSAGES.LOAD_PLAYERS_ERROR, playersError)
    return (
      <div className="text-center py-12">
        <p className="text-xl text-red-600">{ERROR_MESSAGES.LOAD_PLAYERS_ERROR}</p>
      </div>
    )
  }

  // Filtrar apenas resultados de torneios de novatos e processar estatísticas
  const playersWithStats = filterAndProcessPlayers(players || [], beginnerTournamentIds, false, 'beginner')
    .filter(p => p.totalTournaments > 0) // Apenas jogadores com participação em torneios de novatos

  // Sem sistema de tiers para novatos
  const tierSlots = { S: 0, A: 0, B: 0 }
  const avgPoints = 0

  // Query para penalidades de novatos (sem exigir participação em torneios)
  const { data: penaltyPlayers } = await supabase
    .from('players')
    .select(`
      *,
      tournament_results(placement, tournament_id),
      penalties!inner(player_id, penalty_type)
    `)
    .eq('penalties.penalty_type', 'beginner')
    .order('name')

  // Usar função utilitária para processar jogadores com penalidades
  const penaltyPlayersProcessed = filterAndProcessPlayers(penaltyPlayers || [], beginnerTournamentIds, false, 'beginner')
  const penaltyStats = processPenaltyStats(penaltyPlayersProcessed)

  return (
    <div>
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">🆕 Ranking de Novatos</h2>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Este ranking considera apenas os torneios destinados a jogadores iniciantes. 
          Os resultados não afetam o ranking principal.
        </p>
      </div>
      <RankingClient players={playersWithStats} penaltyStats={penaltyStats} tierSlots={tierSlots} avgPoints={avgPoints} isBeginnerRanking={true} />
    </div>
  )
}
