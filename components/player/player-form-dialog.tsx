import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { createPlayer, updatePlayer } from '@/app/admin/actions'
import { SUCCESS_MESSAGES, ERROR_MESSAGES, PLACEHOLDERS } from '@/lib/constants/messages'
import type { Player } from '@/lib/types'

interface PlayerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlayer: Player | null
  isAdmin: boolean
  onSuccess: () => void
  onImageUpload: (file: File) => Promise<string | null>
}

export function PlayerFormDialog({ 
  open, 
  onOpenChange, 
  editingPlayer, 
  isAdmin,
  onSuccess,
  onImageUpload 
}: PlayerFormDialogProps) {
  const [playerName, setPlayerName] = useState(editingPlayer?.name || '')
  const [playerImageUrl, setPlayerImageUrl] = useState(editingPlayer?.image_url || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setPlayerName('')
    setPlayerImageUrl('')
    setImageFile(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let imageUrl = playerImageUrl

      if (imageFile) {
        const uploadedUrl = await onImageUpload(imageFile)
        if (uploadedUrl) imageUrl = uploadedUrl
      }

      if (editingPlayer) {
        if (!isAdmin) {
          toast.error(ERROR_MESSAGES.ADMIN_ONLY)
          return
        }

        const result = await updatePlayer(editingPlayer.id, {
          name: playerName,
          image_url: imageUrl || undefined
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success(SUCCESS_MESSAGES.PLAYER_UPDATED)
      } else {
        const result = await createPlayer({
          name: playerName,
          image_url: imageUrl || undefined
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success(SUCCESS_MESSAGES.PLAYER_CREATED)
      }

      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || ERROR_MESSAGES.PLAYER_SAVE_ERROR)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingPlayer ? 'Editar Jogador' : 'Novo Jogador'}</DialogTitle>
          <DialogDescription>
            {editingPlayer ? 'Atualize as informações do jogador' : 'Adicione um novo jogador ao sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="player-name">Nome *</Label>
            <Input
              id="player-name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={PLACEHOLDERS.PLAYER_NAME}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-image">URL da Imagem</Label>
            <Input
              id="player-image"
              value={playerImageUrl}
              onChange={(e) => setPlayerImageUrl(e.target.value)}
              placeholder={PLACEHOLDERS.IMAGE_URL}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-file">Ou faça upload de uma imagem</Label>
            <div className="flex gap-2">
              <Input
                id="player-file"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {imageFile && (
                <Button type="button" variant="outline" size="icon" disabled>
                  <Upload className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingPlayer ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
