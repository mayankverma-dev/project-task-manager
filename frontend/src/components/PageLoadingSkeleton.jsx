import { Skeleton } from "./ui/skeleton";

/**
 * PageLoadingSkeleton — route-level Suspense fallback.
 * Mimics the two-pane authenticated layout so there is no jarring flash
 * on route transitions:
 *   - Left: sidebar shimmer (workspace selector + nav items + project list)
 *   - Right: main content shimmer (header bar + content blocks)
 */
export const PageLoadingSkeleton = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar skeleton */}
      <aside className="flex flex-col w-64 p-4 bg-gray-800 shrink-0 gap-4">
        {/* Workspace selector */}
        <Skeleton className="h-10 w-full rounded-lg bg-gray-700" />

        {/* Nav items */}
        <div className="flex flex-col gap-2 mt-4">
          <Skeleton className="h-8 w-full rounded-md bg-gray-700" />
          <Skeleton className="h-8 w-full rounded-md bg-gray-700" />
        </div>

        {/* Section label */}
        <Skeleton className="h-3 w-20 mt-4 bg-gray-700" />

        {/* Project list items */}
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="w-4 h-4 rounded bg-gray-700 shrink-0" />
              <Skeleton className="h-3.5 flex-1 rounded bg-gray-700" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 overflow-auto p-8 flex flex-col gap-6">
        {/* Page title */}
        <Skeleton className="h-8 w-48" />

        {/* Stat cards row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
              <Skeleton className="h-9 w-16" />
            </div>
          ))}
        </div>

        {/* Content block */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </main>
    </div>
  );
};
