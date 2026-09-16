import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { KanbanBoard } from '../../tasks/components/KanbanBoard';
import { useTasks } from '../../tasks/hooks/useTasks';
import { CreateTaskModal } from '../../tasks/components/CreateTaskModal';
import { useTaskFilters } from '../../tasks/hooks/useTaskFilters';
import { TaskFilters } from '../../tasks/components/TaskFilters';
import { Plus } from 'lucide-react';
import { KanbanBoardSkeleton } from '../../tasks/components/KanbanBoardSkeleton.jsx';

export const ProjectView = () => {
  const { workspaceId, projectId } = useParams();
  const { data: projectResponse, isLoading: isLoadingProject } = useProject(workspaceId, projectId);
  
  const { apiFilters } = useTaskFilters();
  const { data: tasksResponse, isLoading: isLoadingTasks, hasNextPage, fetchNextPage, isFetchingNextPage } = useTasks(projectId, apiFilters);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  if (isLoadingProject || isLoadingTasks) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
        {/* Header shimmer */}
        <div className="flex items-center justify-between p-6 border-b dark:border-neutral-800">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
            <div className="h-4 w-72 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
          </div>
          <div className="h-9 w-28 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md" />
        </div>
        <KanbanBoardSkeleton />
      </div>
    );
  }

  const project = projectResponse?.data;
  const tasks = tasksResponse?.pages?.flatMap(page => page.data) || [];

  if (!project) {
    return <div className="p-8 text-red-500">Project not found</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
      <div className="flex items-center justify-between p-6 border-b dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{project.description}</p>
          )}
        </div>
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </button>
      </div>

      <TaskFilters />

      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={projectId} tasks={tasks} />
      </div>

      {hasNextPage && (
        <div className="flex justify-center p-4 border-t dark:border-neutral-800">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 text-sm font-medium border rounded-md border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More Tasks'}
          </button>
        </div>
      )}

      <CreateTaskModal
        projectId={projectId}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
};
