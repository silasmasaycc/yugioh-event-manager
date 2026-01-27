'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { createPlayer, updatePlayer } from '@/app/admin/actions'
import { toast } from 'sonner'

interface PlayerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlayer: any | null
  onSuccess: () => void
  isAdmin: boolean
}

export function PlayerFormDialog({ 
  open, 
  onOpenChange, 
  editingPlayer, 
  onSuccess, 
  isAdmin 
}: PlayerFormDialogProps) {
  const [playerName, setPlayerName] = useState('')
  const [playerImageUrl, setPlayerImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  // Update form values when editingPlayer changes
  useEffect(() => {
    if (editingPlayer) {
      setPlayerName(editingPlayer.name)
      setPlayerImageUrl(editingPlayer.image_url || '')
    } else {
      setPlayerName('')
      setPlayerImageUrl('')
      setImageFile(null)
    }
  }, [editingPlayer])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

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

      handleClose()
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar jogador')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setPlayerName('')
    setPlayerImageUrl('')
    setImageFile(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingPlayer ? 'Editar' : 'Novo'} Jogador</DialogTitle>
          <DialogDescription>
            {editingPlayer ? 'Edite as informações do jogador' : 'Adicione um novo jogador ao sistema'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Nome</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
            <Input
              id="playerImageUrl"
              type="url"
              placeholder="Ou insira a URL da imagem"
              value={playerImageUrl}
              onChange={(e) => setPlayerImageUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
