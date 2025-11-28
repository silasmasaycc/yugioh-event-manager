interface FilterBadgeProps {
  isFiltered: boolean
  filteredCount?: number
  totalCount?: number
}

export function FilterBadge({ isFiltered, filteredCount, totalCount }: FilterBadgeProps) {
  if (!isFiltered) return null
  
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
      <span>🔍</span>
      {filteredCount !== undefined && totalCount !== undefined ? (
        <span>{filteredCount} de {totalCount} {totalCount === 1 ? 'torneio' : 'torneios'}</span>
      ) : (
        <span>Filtrado</span>
      )}
    </div>
  )
}
