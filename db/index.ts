import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const queryClient = postgres(process.env.DIGITALEQUB_API_DATABASE_LOCAL_URL!);
export const db = drizzle(queryClient, { schema });         