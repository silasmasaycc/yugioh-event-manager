import { Card, CardContent } from '@/components/ui/card'

interface PlayerSkeletonProps {
  count?: number
}

export function PlayerSkeleton({ count = 5 }: PlayerSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {skeletons.map((i) => (
        <Card key={i} className="animate-pulse overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900" />
          <CardContent className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
