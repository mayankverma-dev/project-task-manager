import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/project_task_manager';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
