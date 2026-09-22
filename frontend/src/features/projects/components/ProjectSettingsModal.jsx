import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { X, Trash2 } from 'lucide-react';

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional().nullable(),
});

export const ProjectSettingsModal = ({ project, workspaceId, isOpen, onClose }) => {
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
    },
  });

  useEffect(() => {
    if (isOpen && project) {
      reset({
        name: project.name,
        description: project.description || '',
      });
    }
  }, [isOpen, project, reset]);

  if (!isOpen || !project) return null;

  const onSubmit = (data) => {
    updateProject(
      { workspaceId, projectId: project.id, data },
      {
        onSuccess: () => {
          toast.success('Project updated successfully');
          onClose();
        },
        onError: () => {
          toast.error('Failed to update project');
        },
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project? All tasks will be lost.')) {
      deleteProject(
        { workspaceId, projectId: project.id },
        {
          onSuccess: () => {
            toast.success('Project deleted');
            onClose();
            navigate(`/workspaces/${workspaceId}`);
          },
          onError: () => {
            toast.error('Failed to delete project');
          },
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-2xl dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10 transform transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Project Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Project Name
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all resize-none dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-6 mt-6 border-t dark:border-neutral-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isUpdating}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isUpdating}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
