import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').max(255),
    description: z.string().optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
    workspaceId: z.string().uuid('Invalid workspace ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
  }),
});

export const getProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
    workspaceId: z.string().uuid('Invalid workspace ID'),
  }),
});

export const listProjectsSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid('Invalid workspace ID'),
  }),
});

export const deleteProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
    workspaceId: z.string().uuid('Invalid workspace ID'),
  }),
});
