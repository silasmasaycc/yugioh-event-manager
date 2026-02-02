'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Trophy, Menu } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  activeRoute?: string
}

export function Header({ activeRoute }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: '/ranking', label: 'Ranking' },
    { href: '/stats', label: 'Gráficos' },
    { href: '/tournaments', label: 'Torneios' },
    { href: '/decks', label: 'Decks' },
    { href: '/players', label: 'Jogadores' },
    { href: '/login', label: 'Login Admin', variant: 'outline' as const },
  ]

  const closeSheet = () => setIsOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm dark:bg-gray-900/95 transition-all duration-200">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Título */}
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 shrink-0 transition-transform hover:scale-110" aria-hidden="true" />
            <Link href="/" className="min-w-0" aria-label="Página inicial">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold cursor-pointer hover:text-purple-600 transition-colors truncate">
                Yu-Gi-Oh! Event Manager
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-2 xl:gap-4" aria-label="Navegação principal">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={activeRoute === item.href ? 'default' : (item.variant || 'ghost')}
                  className="transition-all duration-200 hover:scale-105"
                  aria-current={activeRoute === item.href ? 'page' : undefined}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation - Hamburger Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Abrir menu de navegação"
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]" aria-describedby="mobile-nav-description">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <Trophy className="h-6 w-6 text-purple-600" aria-hidden="true" />
                  <span>Menu</span>
                </SheetTitle>
                <SheetDescription id="mobile-nav-description">
                  Navegue pelas páginas do Yu-Gi-Oh! Event Manager
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-3 mt-8" aria-label="Navegação mobile">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={closeSheet}>
                    <Button
                      variant={activeRoute === item.href ? 'default' : (item.variant || 'ghost')}
                      className="w-full justify-start text-base transition-all duration-200 hover:scale-105"
                      aria-current={activeRoute === item.href ? 'page' : undefined}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
