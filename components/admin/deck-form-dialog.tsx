'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { createDeck, updateDeck } from '@/app/admin/actions'
import { toast } from 'sonner'

interface DeckFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingDeck: any | null
  onSuccess: () => void
  isAdmin: boolean
}

export function DeckFormDialog({ 
  open, 
  onOpenChange, 
  editingDeck, 
  onSuccess, 
  isAdmin 
}: DeckFormDialogProps) {
  const [deckName, setDeckName] = useState('')
  const [deckImageUrl, setDeckImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  // Update form values when editingDeck changes
  useEffect(() => {
    if (editingDeck) {
      setDeckName(editingDeck.name)
      setDeckImageUrl(editingDeck.image_url || '')
    } else {
      setDeckName('')
      setDeckImageUrl('')
      setImageFile(null)
    }
  }, [editingDeck])

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('deck-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('deck-images').getPublicUrl(filePath)
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
      let imageUrl = deckImageUrl

      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile)
        if (uploadedUrl) imageUrl = uploadedUrl
      }

      if (editingDeck) {
        // Update
        if (!isAdmin) {
          toast.error('Apenas administradores podem editar decks')
          return
        }

        const result = await updateDeck(editingDeck.id, {
          name: deckName,
          image_url: imageUrl || undefined
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success('Deck atualizado com sucesso!')
      } else {
        // Create
        const result = await createDeck({
          name: deckName,
          image_url: imageUrl || undefined
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success('Deck criado com sucesso!')
      }

      handleClose()
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar deck')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setDeckName('')
    setDeckImageUrl('')
    setImageFile(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingDeck ? 'Editar' : 'Novo'} Deck</DialogTitle>
          <DialogDescription>
            {editingDeck ? 'Edite as informações do deck' : 'Adicione um novo deck ao sistema'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deckName">Nome do Deck</Label>
            <Input
              id="deckName"
              placeholder="Ex: Kashtira, Snake-Eye, Labrynth..."
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deckImage">Imagem (Arquivo ou URL)</Label>
            <Input
              id="deckImageFile"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="mb-2"
              disabled={isSubmitting}
            />
            <Input
              id="deckImageUrl"
              type="url"
              placeholder="Ou insira a URL da imagem"
              value={deckImageUrl}
              onChange={(e) => setDeckImageUrl(e.target.value)}
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
