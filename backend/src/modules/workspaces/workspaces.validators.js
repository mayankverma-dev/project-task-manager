import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    slug: z.string().min(2, 'Slug must be at least 2 characters').max(255).optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['admin', 'member', 'viewer']).default('member'),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'member', 'viewer']),
  }),
});
