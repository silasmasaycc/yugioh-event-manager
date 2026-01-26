'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { PlayerCard } from '@/components/player/player-card'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Users, Award, TrendingUp, Filter, X } from 'lucide-react'
import { LABELS } from '@/lib/constants/messages'
import type { PlayerWithStatsAndTier, TierSlots } from '@/lib/types'
import { getTierBadgeColor } from '@/lib/utils/tier-styles'
import { usePlayerFilters } from '@/lib/hooks/use-player-filters'

interface PlayersClientProps {
  players: PlayerWithStatsAndTier[]
  tierSlots: TierSlots
  avgPoints: number
}

export function PlayersClient({ players }: PlayersClientProps) {
  const {
    searchTerm,
    setSearchTerm,
    tierFilter,
    setTierFilter,
    sortBy,
    setSortBy,
    filteredPlayers,
    stats,
    hasActiveFilters,
    clearFilters
  } = usePlayerFilters(players)

  return (
    <PageLayout activeRoute="/players">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">{LABELS.PLAYERS}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Lista completa de jogadores cadastrados no sistema
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Média Geral</p>
                <p className="text-2xl font-bold">{stats.avgPoints} <span className="text-sm">pts</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold">Filtros</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de Tier */}
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tiers</SelectItem>
                <SelectItem value="S">🔴 Tier S - Elite</SelectItem>
                <SelectItem value="A">🟡 Tier A - Forte</SelectItem>
                <SelectItem value="B">🟢 Tier B - Sólido</SelectItem>
                <SelectItem value="C">🔵 Tier C - Emergente</SelectItem>
                <SelectItem value="D">⚪ Tier D - Promessa</SelectItem>
                <SelectItem value="none">Sem tier</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points">📊 Pontos</SelectItem>
                <SelectItem value="tops">🏆 TOPs</SelectItem>
                <SelectItem value="participation">🎮 Participações</SelectItem>
                <SelectItem value="name">🔤 Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Mostrando {filteredPlayers.length} de {players.length} jogadores
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Jogadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map((player) => (
          <div key={player.id} className="relative">
            {player.tier && (
              <div className={`absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full ${getTierBadgeColor(player.tier)} flex items-center justify-center text-sm font-bold shadow-lg`}>
                {player.tier}
              </div>
            )}
            <PlayerCard player={player} showPenalties={true} />
          </div>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {hasActiveFilters ? 'Nenhum jogador encontrado com estes filtros' : LABELS.NO_PLAYERS}
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
