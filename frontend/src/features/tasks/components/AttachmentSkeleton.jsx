import React from 'react';
import { Skeleton } from '../../../components/ui/skeleton';

export const AttachmentSkeleton = ({ count = 2 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg dark:border-neutral-800">
          <Skeleton className="w-10 h-10 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="w-8 h-8 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
};
