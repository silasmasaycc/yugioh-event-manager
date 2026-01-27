'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addPenalty, deletePenalty } from '@/app/admin/actions'
import { toast } from 'sonner'

interface Penalty {
  id: number
  player?: { id: number }
  penalty_type: string
}

interface PenaltyDialogsProps {
  // Add penalty dialog
  showAddDialog: boolean
  onAddDialogChange: (open: boolean) => void
  playerId: number | null
  
  // Remove penalty dialog  
  showRemoveDialog: boolean
  onRemoveDialogChange: (open: boolean) => void
  removePlayerId: number | null
  penalties: Penalty[]
  
  onSuccess: () => void
}

export function PenaltyDialogs({ 
  showAddDialog,
  onAddDialogChange,
  playerId,
  showRemoveDialog,
  onRemoveDialogChange,
  removePlayerId,
  penalties,
  onSuccess
}: PenaltyDialogsProps) {
  const [penaltyTournamentType, setPenaltyTournamentType] = useState('')
  const [removePenaltyType, setRemovePenaltyType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddPenalty = async () => {
    if (!playerId || !penaltyTournamentType) {
      toast.error('Selecione o tipo de torneio')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addPenalty({
        player_id: playerId,
        penalty_type: penaltyTournamentType
      })
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Double Loss adicionado!')
      setPenaltyTournamentType('')
      onAddDialogChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar penalidade')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemovePenalty = async () => {
    if (!removePlayerId || !removePenaltyType) {
      toast.error('Selecione o tipo de torneio')
      return
    }

    setIsSubmitting(true)
    try {
      // Filtrar penalties do jogador por tipo
      const playerPenalties = penalties.filter(p => 
        p.player?.id === removePlayerId &&
        p.penalty_type === removePenaltyType
      )

      if (playerPenalties.length === 0) {
        toast.error(`Nenhum double loss de ${removePenaltyType === 'beginner' ? 'novatos' : 'veteranos'} encontrado`)
        return
      }

      // Remover a penalty mais recente daquele tipo
      const result = await deletePenalty(playerPenalties[0].id.toString())
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Double Loss removido!')
      setRemovePenaltyType('')
      onRemoveDialogChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover penalidade')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Add Penalty Dialog */}
      <Dialog open={showAddDialog} onOpenChange={onAddDialogChange}>
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
              <Select 
                value={penaltyTournamentType} 
                onValueChange={setPenaltyTournamentType}
                disabled={isSubmitting}
              >
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
              <Button 
                variant="outline" 
                onClick={() => onAddDialogChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddPenalty} disabled={isSubmitting}>
                {isSubmitting ? 'Adicionando...' : 'Adicionar Double Loss'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Penalty Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={onRemoveDialogChange}>
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
              <Select 
                value={removePenaltyType} 
                onValueChange={setRemovePenaltyType}
                disabled={isSubmitting}
              >
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
              <Button 
                variant="outline" 
                onClick={() => onRemoveDialogChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRemovePenalty}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Removendo...' : 'Remover Double Loss'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
