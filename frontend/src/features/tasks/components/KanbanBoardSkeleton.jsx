import { Skeleton } from "../../../components/ui/skeleton";
import { TaskCardSkeleton } from "./TaskCardSkeleton";

const COLUMNS = [
  { id: "todo", title: "To Do", count: 3 },
  { id: "in_progress", title: "In Progress", count: 2 },
  { id: "in_review", title: "In Review", count: 2 },
  { id: "done", title: "Done", count: 1 },
];

/**
 * KanbanBoardSkeleton — full-width skeleton matching the KanbanBoard layout:
 *   - 4 columns each with a column header shimmer
 *   - 1–3 stacked TaskCardSkeleton items per column
 * Used in ProjectView while isLoadingProject || isLoadingTasks.
 */
export const KanbanBoardSkeleton = () => {
  return (
    <div className="flex h-full gap-4 p-4 overflow-x-auto">
      {COLUMNS.map((column) => (
        <div key={column.id} className="flex flex-col flex-shrink-0 w-80">
          {/* Column header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>

          {/* Column body */}
          <div className="flex-1 p-2 rounded-xl bg-neutral-100/50 dark:bg-neutral-900/50 space-y-0">
            {Array.from({ length: column.count }).map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
