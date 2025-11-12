import { Card, CardContent } from '@/components/ui/card'

interface RankingSkeletonProps {
  count?: number
}

export function RankingSkeleton({ count = 5 }: RankingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  return (
    <div className="space-y-4">
      {skeletons.map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
