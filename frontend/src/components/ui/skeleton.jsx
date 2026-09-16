/**
 * Skeleton — base shimmer primitive matching the shadcn/ui Skeleton pattern.
 * All domain skeleton components build on top of this.
 */
export const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800 ${className}`}
      {...props}
    />
  );
};
