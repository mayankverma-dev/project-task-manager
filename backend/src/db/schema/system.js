import { pgTable, uuid, varchar, timestamp, jsonb, integer, unique } from 'drizzle-orm/pg-core';
import { users } from './auth.js';

export const idempotencyKeys = pgTable('idempotency_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  requestHash: varchar('request_hash', { length: 512 }).notNull(),
  responseStatus: integer('response_status'),
  responseBody: jsonb('response_body'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => {
  return {
    userKeyEndpointUnique: unique().on(table.userId, table.key, table.endpoint),
  };
});
