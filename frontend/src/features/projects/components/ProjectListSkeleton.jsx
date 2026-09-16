import { Skeleton } from "../../../components/ui/skeleton";

/**
 * ProjectListSkeleton — matches the project link rows in ProjectList (sidebar):
 *   - Folder icon placeholder
 *   - Project name bar
 *   - Optional description line
 *
 * @param {{ count?: number }} props
 */
export const ProjectListSkeleton = ({ count = 3 }) => {
  return (
    <div className="flex flex-col gap-2 px-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center p-3 border rounded-lg dark:border-neutral-800"
        >
          {/* Folder icon */}
          <Skeleton className="w-5 h-5 mr-3 rounded shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};
