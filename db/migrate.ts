import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";

console.log("⏳ Running migrations...");

await migrate(db, { migrationsFolder: "./drizzle" });

console.log("✅ Migrations completed!");
process.exit(0);