import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { tasks } from './tasks.js';
import { users } from './auth.js';

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  url: varchar('url', { length: 512 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
