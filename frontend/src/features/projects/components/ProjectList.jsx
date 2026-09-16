import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { CreateProjectModal } from './CreateProjectModal';
import { Link } from 'react-router-dom';
import { FolderPlus, Folder } from 'lucide-react';
import { ProjectListSkeleton } from './ProjectListSkeleton.jsx';

export const ProjectList = ({ workspaceId }) => {
  const { data, isLoading, error } = useProjects(workspaceId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return <ProjectListSkeleton count={3} />;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Failed to load projects</div>;
  }

  const projects = data?.data || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b dark:border-neutral-800">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Projects</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center p-2 text-sm text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            No projects yet. Create one to get started!
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              to={`/workspaces/${workspaceId}/projects/${project.id}`}
              className="flex items-center p-3 transition-colors border rounded-lg hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
            >
              <Folder className="w-5 h-5 mr-3 text-neutral-400" />
              <div>
                <div className="font-medium text-neutral-900 dark:text-white">{project.name}</div>
                {project.description && (
                  <div className="text-xs text-neutral-500 truncate mt-0.5">{project.description}</div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      <CreateProjectModal
        workspaceId={workspaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
