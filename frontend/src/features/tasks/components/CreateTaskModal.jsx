import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema } from '../../../lib/zodSchemas/tasks';
import { useCreateTask } from '../hooks/useTasks';
import { useIdempotencyKey } from '../../../hooks/useIdempotencyKey';
import { toast } from 'sonner';

export const CreateTaskModal = ({ projectId, isOpen, onClose }) => {
  const { idempotencyKey, resetKey } = useIdempotencyKey();
  const { mutate: createTask, isPending } = useCreateTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: '', description: '', priority: 'medium' },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      resetKey();
    }
  }, [isOpen, reset, resetKey]);

  if (!isOpen) return null;

  const onSubmit = (data) => {
    createTask(
      { projectId, data, idempotencyKey },
      {
        onSuccess: () => {
          toast.success('Task created successfully');
          onClose();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.error?.message || 'Failed to create task');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-neutral-900">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
          Create New Task
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Task Title
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              placeholder="e.g. Design landing page"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              placeholder="Task details..."
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Priority
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
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
              {isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
