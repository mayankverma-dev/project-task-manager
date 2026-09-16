import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema } from '../../../lib/zodSchemas/projects';
import { useCreateProject } from '../hooks/useProjects';
import { useIdempotencyKey } from '../../../hooks/useIdempotencyKey';
import { toast } from 'sonner';

export const CreateProjectModal = ({ workspaceId, isOpen, onClose }) => {
  const { idempotencyKey, resetKey } = useIdempotencyKey();
  const { mutate: createProject, isPending } = useCreateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      resetKey();
    }
  }, [isOpen, reset, resetKey]);

  if (!isOpen) return null;

  const onSubmit = (data) => {
    createProject(
      { workspaceId, data, idempotencyKey },
      {
        onSuccess: () => {
          toast.success('Project created successfully');
          onClose();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.error?.message || 'Failed to create project');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-neutral-900">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
          Create New Project
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Project Name
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              placeholder="e.g. Q4 Marketing Campaign"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              placeholder="Brief description of the project..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
