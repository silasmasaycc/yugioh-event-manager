import { Card, CardContent } from '@/components/ui/card'

interface TournamentSkeletonProps {
  count?: number
}

export function TournamentSkeleton({ count = 5 }: TournamentSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {skeletons.map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="pt-4 border-t space-y-2">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
