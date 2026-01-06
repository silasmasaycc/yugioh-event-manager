'use client'

import { useState, useMemo } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X, Trophy, Users, Calendar } from 'lucide-react'
import { LABELS } from '@/lib/constants/messages'

interface TournamentsClientProps {
  tournaments: any[]
}

export function TournamentsClient({ tournaments }: TournamentsClientProps) {
  const [searchPlayer, setSearchPlayer] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  // Obter lista de meses únicos dos torneios
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    tournaments.forEach(tournament => {
      if (tournament.date) {
        const date = new Date(tournament.date)
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        months.add(monthYear)
      }
    })
    return Array.from(months).sort().reverse()
  }, [tournaments])

  // Filtrar torneios
  const filteredTournaments = useMemo(() => {
    let filtered = tournaments

    // Filtro por jogador
    if (searchPlayer) {
      filtered = filtered.filter(tournament => 
        (tournament.tournament_results || []).some((result: any) => 
          result.player?.name.toLowerCase().includes(searchPlayer.toLowerCase())
        )
      )
    }

    // Filtro por mês
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(tournament => {
        if (!tournament.date) return false
        const date = new Date(tournament.date)
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        return monthYear === selectedMonth
      })
    }

    return filtered
  }, [tournaments, searchPlayer, selectedMonth])

  // Estatísticas baseadas nos torneios filtrados
  const stats = useMemo(() => {
    const totalPlayers = new Set(
      filteredTournaments.flatMap(t => 
        (t.tournament_results || [])
          .map((r: any) => r.player?.id)
          .filter(Boolean)
      )
    ).size

    return {
      total: filteredTournaments.length,
      totalPlayers
    }
  }, [filteredTournaments])

  const hasActiveFilters = searchPlayer || selectedMonth !== 'all'

  const clearFilters = () => {
    setSearchPlayer('')
    setSelectedMonth('all')
  }

  // Função para formatar o nome do mês
  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  return (
    <PageLayout activeRoute="/tournaments">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">{LABELS.TOURNAMENTS}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Histórico completo de torneios realizados
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Torneios</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Jogadores Ativos</p>
                <p className="text-2xl font-bold">{stats.totalPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filtros</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buscar por jogador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome do jogador..."
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtrar por mês */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {formatMonth(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Mostrando {filteredTournaments.length} de {tournaments.length} torneios
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Torneios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>

      {filteredTournaments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {hasActiveFilters 
              ? 'Nenhum torneio encontrado com este jogador' 
              : LABELS.NO_TOURNAMENTS
            }
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} className="mt-4">
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </PageLayout>
  )
}
