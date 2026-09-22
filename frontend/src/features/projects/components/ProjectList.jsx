import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { CreateProjectModal } from './CreateProjectModal';
import { Link, useNavigate } from 'react-router-dom';
import { FolderPlus, Folder, Settings } from 'lucide-react';
import { ProjectListSkeleton } from './ProjectListSkeleton.jsx';
import { ProjectSettingsModal } from './ProjectSettingsModal';

export const ProjectList = ({ workspaceId }) => {
  const { data, isLoading, error } = useProjects(workspaceId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settingsProject, setSettingsProject] = useState(null);
  const navigate = useNavigate();

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
            <div
              key={project.id}
              className="group flex items-center justify-between p-3 transition-colors border rounded-lg hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
            >
              <div 
                className="flex items-center flex-1 cursor-pointer min-w-0"
                onClick={() => navigate(`/workspaces/${workspaceId}/projects/${project.id}`)}
              >
                <Folder className="w-5 h-5 mr-3 text-neutral-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-neutral-900 dark:text-white truncate">{project.name}</div>
                  {project.description && (
                    <div className="text-xs text-neutral-500 truncate mt-0.5">{project.description}</div>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsProject(project);
                }}
                className="p-1.5 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 dark:hover:text-neutral-200 dark:hover:bg-neutral-700 rounded transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <CreateProjectModal
        workspaceId={workspaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <ProjectSettingsModal
        project={settingsProject}
        workspaceId={workspaceId}
        isOpen={!!settingsProject}
        onClose={() => setSettingsProject(null)}
      />
    </div>
  );
};
