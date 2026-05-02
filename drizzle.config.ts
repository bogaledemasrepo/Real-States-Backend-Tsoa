import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts", 
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
 tablesFilter: ["real_state_listings", "users", "reviews", "bookings"],
});