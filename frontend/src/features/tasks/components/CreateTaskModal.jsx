import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema } from '../../../lib/zodSchemas/tasks';
import { useCreateTask } from '../hooks/useTasks';
import { useIdempotencyKey } from '../../../hooks/useIdempotencyKey';
import { useWorkspaceMembers } from '../../workspaces/hooks/useWorkspaces';
import { toast } from 'sonner';
import { X, Calendar, User } from 'lucide-react';

export const CreateTaskModal = ({ projectId, workspaceId, isOpen, onClose }) => {
  const { idempotencyKey, resetKey } = useIdempotencyKey();
  const { mutate: createTask, isPending } = useCreateTask();
  const { data: membersResponse } = useWorkspaceMembers(workspaceId);
  const members = membersResponse?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: '', description: '', priority: 'medium', assigneeId: '', dueDate: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      resetKey();
    }
  }, [isOpen, reset, resetKey]);

  if (!isOpen) return null;

  const onSubmit = (data) => {
    // Clean up empty string values for optional fields
    const payload = { ...data };
    if (!payload.assigneeId) delete payload.assigneeId;
    if (!payload.dueDate) delete payload.dueDate;

    createTask(
      { projectId, data: payload, idempotencyKey },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg p-6 bg-white rounded-2xl shadow-2xl dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10 transform transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Create New Task
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
              Task Title
            </label>
            <input
              {...register('title')}
              type="text"
              autoFocus
              className="w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="What needs to be done?"
            />
            {errors.title && <p className="mt-1.5 text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all resize-none dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Assignee
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <User className="h-4 w-4" />
                </div>
                <select
                  {...register('assigneeId')}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                >
                  <option value="">Unassigned</option>
                  {members.map(member => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Due Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-neutral-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-medium rounded-xl text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
