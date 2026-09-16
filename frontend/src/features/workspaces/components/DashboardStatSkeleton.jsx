import { Skeleton } from "../../../components/ui/skeleton";

/**
 * DashboardStatSkeleton — matches the StatCard shape in WorkspaceDashboard:
 *   - Card container (h-32, border, shadow)
 *   - Header row: label bar + icon placeholder
 *   - Large number shimmer
 *
 * @param {{ count?: number }} props
 */
export const DashboardStatSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm h-32 flex flex-col justify-between"
        >
          {/* Header: label + icon */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          {/* Value */}
          <Skeleton className="h-9 w-16 mt-4" />
        </div>
      ))}
    </div>
  );
};
