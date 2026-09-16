import { Skeleton } from "../../../components/ui/skeleton";

/**
 * MemberRowSkeleton — matches the <tr> shape in WorkspaceMembers:
 *   - User column: name + email shimmer
 *   - Role column: pill shimmer
 *   - Joined column: date shimmer
 *
 * @param {{ count?: number }} props
 */
export const MemberRowSkeleton = ({ count = 3 }) => {
  return (
    <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: count }).map((_, i) => (
            <tr key={i}>
              {/* User column */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </td>
              {/* Role column */}
              <td className="px-6 py-4 whitespace-nowrap">
                <Skeleton className="h-5 w-16 rounded-full" />
              </td>
              {/* Joined column */}
              <td className="px-6 py-4 whitespace-nowrap">
                <Skeleton className="h-4 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
