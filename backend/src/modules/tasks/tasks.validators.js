import { z } from 'zod';

export const createTaskSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID'),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assigneeId: z.string().uuid('Invalid assignee ID').optional(),
    dueDate: z.coerce.date().optional(),
    position: z.number().optional(), // Used to position at start or end initially
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
    projectId: z.string().uuid('Invalid project ID'),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assigneeId: z.string().uuid().optional(),
    dueDate: z.coerce.date().optional(),
    position: z.number().optional(), // Optimistic UI drag-and-drop
  }),
});

export const getTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
    projectId: z.string().uuid('Invalid project ID'),
  }),
});

export const listTasksSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID'),
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    search: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignee: z.string().uuid().optional(),
    sortBy: z.enum(['createdAt', 'position', 'dueDate']).optional().default('position'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const deleteTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
    projectId: z.string().uuid('Invalid project ID'),
  }),
});
