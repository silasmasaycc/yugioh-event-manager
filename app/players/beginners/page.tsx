import { createClient } from '@/lib/supabase/server'
import { PlayersClient } from '../players-client'
import { filterPlayersByTournamentType, processPlayersWithStats } from '@/lib/utils/process-players'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'

export const revalidate = 3600 // 1 hora

export default async function BeginnersPlayersPage() {
  const supabase = await createClient()

  // Buscar apenas torneios de novatos
  const { data: beginnerTournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('id')
    .eq('tournament_type', 'beginner')

  if (tournamentsError) {
    logger.error('Erro ao carregar torneios de novatos', tournamentsError)
  }

  const beginnerTournamentIds = beginnerTournaments?.map(t => t.id) || []

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

  // Filtrar apenas resultados de torneios de novatos E penalties de novatos
  const playersFiltered = filterPlayersByTournamentType(players || [], beginnerTournamentIds, 'beginner')

  // Processar jogadores com estatísticas (COM separação de penalties por tipo para exibição correta)
  const playersWithStats = processPlayersWithStats(playersFiltered, true)

  // Filtrar apenas jogadores que realmente participaram de torneios de novatos
  const activeBeginnerPlayers = playersWithStats.filter(p => p.totalTournaments > 0)

  // Para novatos, não há sistema de tiers - passar dados vazios
  return <PlayersClient 
    players={activeBeginnerPlayers.map(p => ({ ...p, tier: null }))} 
    tierSlots={{ S: 0, A: 0, B: 0 }} 
    avgPoints={0} 
    isBeginnerMode={true} 
  />
}
