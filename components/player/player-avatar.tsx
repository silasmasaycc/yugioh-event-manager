'use client'

import { useState } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'

interface PlayerAvatarProps {
  imageUrl?: string | null
  playerName: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallbackIcon?: boolean
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-24 h-24 text-4xl'
}

export function PlayerAvatar({ 
  imageUrl, 
  playerName, 
  size = 'md',
  className = '',
  showFallbackIcon = false
}: PlayerAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(!!imageUrl)

  // Extrair iniciais do nome
  const getInitials = (name: string) => {
    const words = name.trim().split(' ')
    if (words.length === 1) {
      return name.charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  const initials = getInitials(playerName)

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setImageError(false)
    setIsLoading(false)
  }

  // Validação: só mostra imagem se tiver URL válida E não houver erro
  const shouldShowImage = imageUrl && !imageError

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {shouldShowImage ? (
        <>
          <Image
            src={imageUrl!}
            alt={playerName}
            fill
            sizes={`${sizeClasses[size]}`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`object-cover rounded-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-800 dark:to-blue-800 rounded-full animate-pulse">
              <div className={`${size === 'xs' || size === 'sm' ? 'text-xs' : 'text-sm'} text-purple-600 dark:text-purple-300 font-semibold`}>
                {initials}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-800 dark:to-blue-800 rounded-full">
          {showFallbackIcon ? (
            <User className={`${size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : 'w-12 h-12'} text-purple-600 dark:text-purple-300`} />
          ) : (
            <span className={`${size === 'xs' || size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-3xl'} font-bold text-purple-600 dark:text-purple-300`}>
              {initials}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
