import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { KanbanBoard } from '../../tasks/components/KanbanBoard';
import { useTasks } from '../../tasks/hooks/useTasks';
import { CreateTaskModal } from '../../tasks/components/CreateTaskModal';
import { Plus } from 'lucide-react';

export const ProjectView = () => {
  const { workspaceId, projectId } = useParams();
  const { data: projectResponse, isLoading: isLoadingProject } = useProject(workspaceId, projectId);
  const { data: tasksResponse, isLoading: isLoadingTasks } = useTasks(projectId);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  if (isLoadingProject || isLoadingTasks) {
    return <div className="p-8 text-neutral-500">Loading project data...</div>;
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

      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={projectId} tasks={tasks} />
      </div>

      <CreateTaskModal
        projectId={projectId}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
};
