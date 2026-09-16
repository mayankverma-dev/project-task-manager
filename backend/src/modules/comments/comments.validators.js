import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    body: z.string().min(1).max(5000),
  }),
  params: z.object({
    taskId: z.string().uuid()
  })
});

export const getCommentsSchema = z.object({
  params: z.object({
    taskId: z.string().uuid()
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  })
});

export const deleteCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid()
  })
});
