import { Skeleton } from "../../../components/ui/skeleton";

/**
 * CommentSkeleton — matches the comment row shape in TaskDetailsModal:
 *   - Avatar circle on the left
 *   - Name + timestamp bar on the right
 *   - Body block below
 *
 * @param {{ count?: number }} props
 */
export const CommentSkeleton = ({ count = 2 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {/* Avatar circle */}
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />

          {/* Comment bubble */}
          <div className="flex-1 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg space-y-2">
            {/* Name + timestamp row */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            {/* Body lines */}
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
};
