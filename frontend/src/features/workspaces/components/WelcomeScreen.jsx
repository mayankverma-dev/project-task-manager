import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { useCreateWorkspace } from '../hooks/useWorkspaces.js';
import { setActiveWorkspace } from '../workspaceSlice.js';

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const WelcomeScreen = () => {
  const dispatch = useDispatch();
  const createWorkspaceMutation = useCreateWorkspace();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createWorkspaceSchema),
  });

  const onSubmit = async (data) => {
    try {
      const workspace = await createWorkspaceMutation.mutateAsync(data);
      dispatch(setActiveWorkspace(workspace));
      toast.success('Workspace created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create workspace');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 items-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to Project Task Manager
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You don't belong to any workspaces yet. Let's create one to get started!
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Workspace Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  autoComplete="organization"
                  {...register('name')}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={createWorkspaceMutation.isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {createWorkspaceMutation.isPending ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
