import Image from 'next/image'

interface DeckImageProps {
  imageUrl?: string | null
  deckName: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24'
}

/**
 * Componente reutilizável para exibir imagem de deck
 * Mostra a imagem do deck ou fallback com primeira letra
 */
export function DeckImage({ imageUrl, deckName, size = 'md' }: DeckImageProps) {
  return (
    <div className="relative shrink-0">
      <div className={`relative ${SIZE_CLASSES[size]} rounded-lg overflow-hidden border-2 border-purple-200 dark:border-purple-700`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={deckName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {deckName[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
