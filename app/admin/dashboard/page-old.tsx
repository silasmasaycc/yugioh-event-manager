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
import { PenaltyDialogs } from '@/components/admin/penalty-dialogs'
import { AdminPlayerCard } from '@/components/admin/admin-player-card'
import { deletePlayer, deleteTournament } from '@/app/admin/actions'

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

  // Penalty dialogs state
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false)
  const [penaltyPlayerId, setPenaltyPlayerId] = useState<number | null>(null)
  const [showRemovePenaltyDialog, setShowRemovePenaltyDialog] = useState(false)
  const [removePenaltyPlayerId, setRemovePenaltyPlayerId] = useState<number | null>(null)

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

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('player-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('player-images').getPublicUrl(filePath)
      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let imageUrl = playerImageUrl

      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile)
        if (uploadedUrl) imageUrl = uploadedUrl
      }

      if (editingPlayer) {
        // Update
        if (!isAdmin) {
          toast.error('Apenas administradores podem editar jogadores')
          return
        }

        const result = await updatePlayer(editingPlayer.id, {
          name: playerName,
          image_url: imageUrl || undefined
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success('Jogador atualizado com sucesso!')
      } else {
        // Create
        const result = await createPlayer({
          name: playerName,
          image_url: imageUrl || undefined
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success('Jogador criado com sucesso!')
      }

      resetPlayerForm()
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar jogador')
    }
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

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Preparar resultados
      const results = []
      if (firstPlace) results.push({ player_id: parseInt(firstPlace), placement: 1 })
      if (secondPlace) results.push({ player_id: parseInt(secondPlace), placement: 2 })
      if (thirdPlace) results.push({ player_id: parseInt(thirdPlace), placement: 3 })
      if (fourthPlace) results.push({ player_id: parseInt(fourthPlace), placement: 4 })
      
      // Add other participants without placement (didn't finish in TOP 4)
      otherParticipants.forEach(playerId => {
        if (playerId && playerId !== firstPlace && playerId !== secondPlace && playerId !== thirdPlace && playerId !== fourthPlace) {
          results.push({ player_id: parseInt(playerId), placement: null })
        }
      })

      const tournamentData = {
        name: tournamentName,
        date: tournamentDate,
        player_count: parseInt(tournamentPlayerCount),
        tournament_type: tournamentType,
        results
      }

      if (editingTournament) {
        // Update
        if (!isAdmin) {
          toast.error('Apenas administradores podem editar torneios')
          return
        }

        const result = await updateTournament(editingTournament.id, tournamentData)

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success('Torneio atualizado com sucesso!')
      } else {
        // Create
        const result = await createTournament(tournamentData)

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success('Torneio criado com sucesso!')
      }

      resetTournamentForm()
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar torneio')
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

  const resetPlayerForm = () => {
    setShowPlayerForm(false)
    setEditingPlayer(null)
    setPlayerName('')
    setPlayerImageUrl('')
    setImageFile(null)
  }

  const handleRemovePenalty = async () => {
    if (!removePenaltyPlayerId || !removePenaltyType) {
      toast.error('Selecione o tipo de torneio')
      return
    }

    try {
      // Filtrar penalties do jogador por tipo
      const playerPenalties = penalties.filter(p => 
        p.player?.id === removePenaltyPlayerId &&
        p.penalty_type === removePenaltyType
      )

      if (playerPenalties.length === 0) {
        toast.error(`Nenhum double loss de ${removePenaltyType === 'beginner' ? 'novatos' : 'veteranos'} encontrado`)
        return
      }

      // Remover a penalty mais recente daquele tipo
      const result = await deletePenalty(playerPenalties[0].id)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Double Loss removido!')
      setShowRemovePenaltyDialog(false)
      setRemovePenaltyPlayerId(null)
      setRemovePenaltyType('')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover penalidade')
    }
  }

  const handleAddPenalty = async () => {
    if (!penaltyPlayerId || !penaltyTournamentType) {
      toast.error('Selecione o tipo de torneio')
      return
    }

    try {
      const result = await addPenalty({
        player_id: penaltyPlayerId,
        penalty_type: penaltyTournamentType
      })
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Double Loss adicionado!')
      setShowPenaltyDialog(false)
      setPenaltyPlayerId(null)
      setPenaltyTournamentType('')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar penalidade')
    }
  }

  const resetTournamentForm = () => {
    setShowTournamentForm(false)
    setEditingTournament(null)
    setTournamentName('')
    setTournamentDate('')
    setTournamentPlayerCount('')
    setTournamentType('regular')
    setFirstPlace('')
    setSecondPlace('')
    setThirdPlace('')
    setFourthPlace('')
    setOtherParticipants([])
  }

  const startEditPlayer = (player: any) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar jogadores')
      return
    }
    setEditingPlayer(player)
    setPlayerName(player.name)
    setPlayerImageUrl(player.image_url || '')
    setShowPlayerForm(true)
  }

  const startEditTournament = (tournament: any) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar torneios')
      return
    }
    setEditingTournament(tournament)
    setTournamentName(tournament.name)
    setTournamentDate(tournament.date)
    setTournamentPlayerCount(tournament.player_count.toString())
    setTournamentType(tournament.tournament_type || 'regular')
    
    // Load existing results
    const results = tournament.tournament_results || []
    setFirstPlace(results.find((r: any) => r.placement === 1)?.player?.id?.toString() || '')
    setSecondPlace(results.find((r: any) => r.placement === 2)?.player?.id?.toString() || '')
    setThirdPlace(results.find((r: any) => r.placement === 3)?.player?.id?.toString() || '')
    setFourthPlace(results.find((r: any) => r.placement === 4)?.player?.id?.toString() || '')
    
    // Load other participants (placement is NULL or doesn't exist in TOP 4)
    const otherParticipantIds = results
      .filter((r: any) => r.placement === null || r.placement > 4)
      .map((r: any) => r.player?.id?.toString())
      .filter(Boolean)
    setOtherParticipants(otherParticipantIds)
    
    setShowTournamentForm(true)
  }

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-sm text-muted-foreground">
                ({isAdmin ? 'Admin' : 'Sub-Admin'})
              </span>
              <Link href="/">
                <Button variant="ghost">Ver Site</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`px-4 py-2 font-medium ${activeTab === 'tournaments' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Torneios
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-4 py-2 font-medium ${activeTab === 'players' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Jogadores
            </button>
          </div>
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

            <Dialog open={showPlayerForm} onOpenChange={setShowPlayerForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPlayer ? 'Editar' : 'Novo'} Jogador</DialogTitle>
                  <DialogDescription>
                    {editingPlayer ? 'Edite as informações do jogador' : 'Adicione um novo jogador ao sistema'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSavePlayer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="playerName">Nome</Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playerImage">Imagem (Arquivo ou URL)</Label>
                    <Input
                      id="playerImageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="mb-2"
                    />
                    <Input
                      id="playerImageUrl"
                      type="url"
                      placeholder="Ou insira a URL da imagem"
                      value={playerImageUrl}
                      onChange={(e) => setPlayerImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Salvar</Button>
                    <Button type="button" variant="outline" onClick={resetPlayerForm}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => {
                const playerPenalties = penalties.filter(p => p.player?.id === player.id)
                const veteranPenalties = playerPenalties.filter(p => p.penalty_type !== 'beginner')
                const beginnerPenalties = playerPenalties.filter(p => p.penalty_type === 'beginner')
                
                return (
                <Card key={player.id}>
                  <CardContent className="p-4">
                    {/* Cabeçalho: Avatar + Nome + Botões de ação */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
                        {player.image_url ? (
                          <Image
                            src={player.image_url}
                            alt={player.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-purple-600">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{player.name}</h3>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditPlayer(player)}
                            title="Editar jogador"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePlayer(player.id)}
                            title="Excluir jogador"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Seção de Double Loss (separada por tipo) */}
                    {(playerPenalties.length > 0 || isAdmin) && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        {/* Double Loss Veteranos */}
                        {(veteranPenalties.length > 0 || isAdmin) && (
                          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🏆</span>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  Veteranos
                                </span>
                              </div>
                              <div className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
                                <span className="text-sm font-bold text-red-700 dark:text-red-400">
                                  {veteranPenalties.length} DL
                                </span>
                              </div>
                            </div>
                            {isAdmin && (
                              <div className="flex gap-2">
                                {veteranPenalties.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-9 gap-2 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-950/20 border-green-300 dark:border-green-800"
                                    onClick={() => {
                                      setRemovePenaltyPlayerId(player.id)
                                      setRemovePenaltyType('regular')
                                      setShowRemovePenaltyDialog(true)
                                    }}
                                  >
                                    <Minus className="h-4 w-4 text-green-600" />
                                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Remover</span>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`${veteranPenalties.length > 0 ? 'flex-1' : 'w-full'} h-9 gap-2 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-300 dark:border-red-800`}
                                  onClick={() => {
                                    setPenaltyPlayerId(player.id)
                                    setPenaltyTournamentType('regular')
                                    setShowPenaltyDialog(true)
                                  }}
                                >
                                  <Plus className="h-4 w-4 text-red-600" />
                                  <span className="text-xs font-medium text-red-700 dark:text-red-400">Adicionar</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Double Loss Novatos */}
                        {(beginnerPenalties.length > 0 || isAdmin) && (
                          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🆕</span>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  Novatos
                                </span>
                              </div>
                              <div className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                                <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                                  {beginnerPenalties.length} DL
                                </span>
                              </div>
                            </div>
                            {isAdmin && (
                              <div className="flex gap-2">
                                {beginnerPenalties.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-9 gap-2 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-950/20 border-green-300 dark:border-green-800"
                                    onClick={() => {
                                      setRemovePenaltyPlayerId(player.id)
                                      setRemovePenaltyType('beginner')
                                      setShowRemovePenaltyDialog(true)
                                    }}
                                  >
                                    <Minus className="h-4 w-4 text-green-600" />
                                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Remover</span>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`${beginnerPenalties.length > 0 ? 'flex-1' : 'w-full'} h-9 gap-2 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 border-orange-300 dark:border-orange-800`}
                                  onClick={() => {
                                    setPenaltyPlayerId(player.id)
                                    setPenaltyTournamentType('beginner')
                                    setShowPenaltyDialog(true)
                                  }}
                                >
                                  <Plus className="h-4 w-4 text-orange-600" />
                                  <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Adicionar</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )})}
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

            <Dialog open={showTournamentForm} onOpenChange={setShowTournamentForm}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTournament ? 'Editar' : 'Novo'} Torneio</DialogTitle>
                  <DialogDescription>
                    {editingTournament ? 'Edite as informações do torneio' : 'Adicione um novo torneio ao sistema'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveTournament} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tournamentName">Nome do Torneio</Label>
                    <Input
                      id="tournamentName"
                      value={tournamentName}
                      onChange={(e) => setTournamentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tournamentDate">Data</Label>
                      <Input
                        id="tournamentDate"
                        type="date"
                        value={tournamentDate}
                        onChange={(e) => setTournamentDate(e.target.value)}
                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                        className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tournamentPlayerCount">Nº de Jogadores</Label>
                      <Input
                        id="tournamentPlayerCount"
                        type="number"
                        min="4"
                        value={tournamentPlayerCount}
                        onChange={(e) => setTournamentPlayerCount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tournamentType">Tipo de Torneio</Label>
                    <Select value={tournamentType} onValueChange={setTournamentType}>
                      <SelectTrigger id="tournamentType">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">🏆 Veteranos (Ranking Principal)</SelectItem>
                        <SelectItem value="beginner">🆕 Novatos (Iniciantes)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tournamentType === 'beginner' 
                        ? 'Torneios de novatos não afetam o ranking principal' 
                        : 'Torneios de veteranos contam para o ranking principal'
                      }
                    </p>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold mb-3">Classificação Final</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="firstPlace">{MEDAL_ICONS[1]} 1º Lugar</Label>
                        <Select value={firstPlace} onValueChange={setFirstPlace}>
                          <SelectTrigger id="firstPlace">
                            <SelectValue placeholder="Selecione o jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondPlace">{MEDAL_ICONS[2]} 2º Lugar</Label>
                        <Select value={secondPlace} onValueChange={setSecondPlace}>
                          <SelectTrigger id="secondPlace">
                            <SelectValue placeholder="Selecione o jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="thirdPlace">{MEDAL_ICONS[3]} 3º Lugar</Label>
                        <Select value={thirdPlace} onValueChange={setThirdPlace}>
                          <SelectTrigger id="thirdPlace">
                            <SelectValue placeholder="Selecione o jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fourthPlace">{MEDAL_ICONS[4]} 4º Lugar</Label>
                        <Select value={fourthPlace} onValueChange={setFourthPlace}>
                          <SelectTrigger id="fourthPlace">
                            <SelectValue placeholder="Selecione o jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold mb-3">Outros Participantes (não ficaram no TOP 4)</h3>
                    <div className="space-y-2">
                      <Label>Selecione os demais jogadores que participaram</Label>
                      <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                        {players
                          .filter(p => 
                            p.id.toString() !== firstPlace && 
                            p.id.toString() !== secondPlace && 
                            p.id.toString() !== thirdPlace && 
                            p.id.toString() !== fourthPlace
                          )
                          .map((player) => (
                            <label key={player.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={otherParticipants.includes(player.id.toString())}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setOtherParticipants([...otherParticipants, player.id.toString()])
                                  } else {
                                    setOtherParticipants(otherParticipants.filter(id => id !== player.id.toString()))
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">{player.name}</span>
                            </label>
                          ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {otherParticipants.length} jogador(es) selecionado(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Salvar</Button>
                    <Button type="button" variant="outline" onClick={resetTournamentForm}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-4">
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
      </main>

      {/* Penalty Dialog */}
      <Dialog open={showPenaltyDialog} onOpenChange={setShowPenaltyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Double Loss</DialogTitle>
            <DialogDescription>
              Selecione o tipo de torneio em que o jogador recebeu o double loss
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="penaltyTournamentType">Tipo de Torneio *</Label>
              <Select value={penaltyTournamentType} onValueChange={setPenaltyTournamentType}>
                <SelectTrigger id="penaltyTournamentType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">🏆 Veteranos</SelectItem>
                  <SelectItem value="beginner">🆕 Novatos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPenaltyDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPenalty}>
                Adicionar Double Loss
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Penalty Dialog */}
      <Dialog open={showRemovePenaltyDialog} onOpenChange={setShowRemovePenaltyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Double Loss</DialogTitle>
            <DialogDescription>
              Selecione o tipo de torneio do double loss que deseja remover
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="removePenaltyType">Tipo de Torneio *</Label>
              <Select value={removePenaltyType} onValueChange={setRemovePenaltyType}>
                <SelectTrigger id="removePenaltyType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">🏆 Veteranos</SelectItem>
                  <SelectItem value="beginner">🆕 Novatos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRemovePenaltyDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleRemovePenalty}>
                Remover Double Loss
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
