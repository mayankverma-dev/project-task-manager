import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});
