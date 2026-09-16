import { pgTable, uuid, varchar, text, timestamp, pgEnum, real, index, customType } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';
import { users } from './auth.js';
import { sql } from 'drizzle-orm';

export const statusEnum = pgEnum('status', ['todo', 'in_progress', 'in_review', 'done']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent']);

const tsvector = customType({
  dataType() {
    return 'tsvector';
  }
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: statusEnum('status').notNull().default('todo'),
  priority: priorityEnum('priority').notNull().default('medium'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  dueDate: timestamp('due_date'),
  position: real('position').notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  searchVector: tsvector('search_vector'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    projectStatusIdx: index('tasks_project_status_idx').on(table.projectId, table.status),
    projectPositionIdx: index('tasks_project_position_idx').on(table.projectId, table.position),
    searchIdx: index('tasks_search_idx').using('gin', table.searchVector),
  };
});
