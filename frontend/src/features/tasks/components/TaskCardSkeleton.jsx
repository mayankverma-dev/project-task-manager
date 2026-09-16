import { Skeleton } from "../../../components/ui/skeleton";

/**
 * TaskCardSkeleton — matches the exact shape of TaskCard:
 *   - Card container with border and shadow
 *   - Title bar (full width, shorter on second line)
 *   - Optional description lines
 *   - Footer: priority badge placeholder + icon placeholders
 */
export const TaskCardSkeleton = () => {
  return (
    <div className="relative flex flex-col gap-3 p-3 mb-2 bg-white border rounded-lg shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
      {/* Title lines */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>

      {/* Description lines */}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>

      {/* Footer row: priority badge + icons */}
      <div className="flex items-center justify-between mt-1">
        <Skeleton className="h-4 w-14 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-8 rounded" />
          <Skeleton className="h-3.5 w-8 rounded" />
        </div>
      </div>
    </div>
  );
};
