import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts", 
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIGITALEQUB_API_DATABASE_LOCAL_URL || "postgresql://mrbg:1234@localhost:5432/real-state",
  },
 tablesFilter: ["real_state_listings", "users", "reviews", "bookings"],
});