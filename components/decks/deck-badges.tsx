interface DeckBadgesProps {
  primaryUses?: number
  secondaryUses?: number
  veteranUses?: number
  beginnerUses?: number
}

/**
 * Componente para exibir badges de estatísticas do deck
 * Mostra uso como principal/suporte e em torneios de veteranos/novatos
 */
export function DeckBadges({ primaryUses, secondaryUses, veteranUses, beginnerUses }: DeckBadgesProps) {
  const hasAnyBadge = (primaryUses ?? 0) > 0 || (secondaryUses ?? 0) > 0 || (veteranUses ?? 0) > 0 || (beginnerUses ?? 0) > 0

  if (!hasAnyBadge) return null

  return (
    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center text-[10px] sm:text-xs">
      {primaryUses && primaryUses > 0 ? (
        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-semibold">
          Principal {primaryUses}
        </span>
      ) : null}
      {secondaryUses && secondaryUses > 0 ? (
        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded font-semibold">
          Suporte {secondaryUses}
        </span>
      ) : null}
      {veteranUses && veteranUses > 0 ? (
        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded font-semibold">
          Veteranos {veteranUses}
        </span>
      ) : null}
      {beginnerUses && beginnerUses > 0 ? (
        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded font-semibold">
          Novatos {beginnerUses}
        </span>
      ) : null}
      <span className="ml-auto text-purple-600 dark:text-purple-400 font-medium group-hover:underline">
        Ver detalhes →
      </span>
    </div>
  )
}
