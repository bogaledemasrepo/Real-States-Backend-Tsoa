import {
  pgTable,
  text,
  uuid,
  varchar,
  serial,
  numeric,
  timestamp,
  geometry,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  avatar: text("avatar"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", {}).notNull(),
});

export const listings = pgTable(
  "real_state_listings",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    address: text("address").notNull(),
    numOfBedrooms: integer("num_of_bedrooms").notNull(),
    numOfBathrooms: integer("num_of_bathrooms").notNull(),
    areaInSqFt: numeric("area_in_sq_ft", { precision: 10, scale: 2 }).notNull(),
    images: text("images").array().notNull(),
    facilities: text("facilities").array().notNull(),
    location: geometry("location", {
      type: "point",
      mode: "xy",
      srid: 4326,
    }).notNull(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    // GiST index is critical for spatial query performance
    index("spatial_idx").using("gist", table.location),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("listing_idx").on(table.listingId)],
);

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => users.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, declined, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const bookingsRelations = relations(bookings, ({ one }) => ({
  listing: one(listings, {
    fields: [bookings.listingId],
    references: [listings.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
    relationName: "buyer",
  }),
  agent: one(users, {
    fields: [bookings.agentId],
    references: [users.id],
    relationName: "agent",
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  reviews: many(reviews),
}));
