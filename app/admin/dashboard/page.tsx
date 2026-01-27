'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trophy, LogOut, Plus, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useUserRole } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import { PlayerFormDialog } from '@/components/admin/player-form-dialog'
import { TournamentFormDialog } from '@/components/admin/tournament-form-dialog'
import { AdminPlayerCard } from '@/components/admin/admin-player-card'
import { deletePlayer, deleteTournament, addPenalty, deletePenalty } from '@/app/admin/actions'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { role, isAdmin, loading: roleLoading } = useUserRole()
  const [activeTab, setActiveTab] = useState<'players' | 'tournaments'>('tournaments')
  const [players, setPlayers] = useState<any[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
  const [penalties, setPenalties] = useState<any[]>([])
  
  // Player form state
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<any>(null)
  
  // Tournament form state
  const [showTournamentForm, setShowTournamentForm] = useState(false)
  const [editingTournament, setEditingTournament] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    const [{ data: playersData }, { data: tournamentsData }, { data: penaltiesData }] = await Promise.all([
      supabase.from('players').select('*').order('name'),
      supabase
        .from('tournaments')
        .select(`
          *,
          tournament_results (
            placement,
            player:players (
              id,
              name,
              image_url
            )
          )
        `)
        .order('date', { ascending: false }),
      supabase
        .from('penalties')
        .select(`
          *,
          player:players (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
    ])
    
    setPlayers(playersData || [])
    setTournaments(tournamentsData || [])
    setPenalties(penaltiesData || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleDeletePlayer = async (id: number) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir jogadores')
      return
    }

    if (!confirm('Tem certeza que deseja excluir este jogador?')) return

    try {
      const result = await deletePlayer(id)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Jogador excluído com sucesso!')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir jogador')
    }
  }

  const handleDeleteTournament = async (id: number) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir torneios')
      return
    }

    if (!confirm('Tem certeza que deseja excluir este torneio?')) return

    try {
      const result = await deleteTournament(id)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Torneio excluído com sucesso!')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir torneio')
    }
  }

  const startEditPlayer = (player: any) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar jogadores')
      return
    }
    setEditingPlayer(player)
    setShowPlayerForm(true)
  }

  const startEditTournament = (tournament: any) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar torneios')
      return
    }
    setEditingTournament(tournament)
    setShowTournamentForm(true)
  }

  const handleAddPenalty = async (playerId: number, type: string) => {
    const typeName = type === 'beginner' ? 'novatos' : 'veteranos'
    if (!confirm(`Tem certeza que deseja adicionar um Double Loss de ${typeName}?`)) return

    try {
      const result = await addPenalty({
        player_id: playerId,
        penalty_type: type
      })
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Double Loss adicionado!')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar penalidade')
    }
  }

  const handleRemovePenalty = async (playerId: number, type: string) => {
    const typeName = type === 'beginner' ? 'novatos' : 'veteranos'
    if (!confirm(`Tem certeza que deseja remover um Double Loss de ${typeName}?`)) return

    try {
      // Filtrar penalties do jogador por tipo
      const playerPenalties = penalties.filter(p => 
        p.player?.id === playerId &&
        p.penalty_type === type
      )

      if (playerPenalties.length === 0) {
        toast.error(`Nenhum double loss de ${typeName} encontrado`)
        return
      }

      // Remover a penalty mais recente daquele tipo
      const result = await deletePenalty(playerPenalties[0].id.toString())
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Double Loss removido!')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover penalidade')
    }
  }

  const handlePlayerFormClose = () => {
    setShowPlayerForm(false)
    setEditingPlayer(null)
  }

  const handleTournamentFormClose = () => {
    setShowTournamentForm(false)
    setEditingTournament(null)
  }

  if (roleLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    )
  }

  if (!isAdmin && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="mb-4">Você não tem permissão para acessar esta área.</p>
          <Link href="/">
            <Button>Voltar para Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isAdmin ? 'Administrador' : 'Moderador'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">Ver Site</Button>
            </Link>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'tournaments'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Torneios
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'players'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Jogadores
          </button>
        </div>

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Jogadores</h2>
              <Button onClick={() => setShowPlayerForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Jogador
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => {
                const playerPenalties = penalties.filter(p => p.player?.id === player.id)
                
                return (
                  <AdminPlayerCard
                    key={player.id}
                    player={player}
                    penalties={playerPenalties}
                    isAdmin={isAdmin}
                    onEdit={startEditPlayer}
                    onDelete={handleDeletePlayer}
                    onAddPenalty={handleAddPenalty}
                    onRemovePenalty={handleRemovePenalty}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Torneios</h2>
              <Button onClick={() => setShowTournamentForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Torneio
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  actions={
                    isAdmin ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditTournament(tournament)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTournament(tournament.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <PlayerFormDialog
        open={showPlayerForm}
        onOpenChange={handlePlayerFormClose}
        editingPlayer={editingPlayer}
        onSuccess={loadData}
        isAdmin={isAdmin}
      />

      <TournamentFormDialog
        open={showTournamentForm}
        onOpenChange={handleTournamentFormClose}
        editingTournament={editingTournament}
        players={players}
        onSuccess={loadData}
        isAdmin={isAdmin}
      />
    </div>
  )
}
