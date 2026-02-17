CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "real_state_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"address" text NOT NULL,
	"num_of_bedrooms" integer NOT NULL,
	"num_of_bathrooms" integer NOT NULL,
	"area_in_sq_ft" numeric(10, 2) NOT NULL,
	"images" text[] NOT NULL,
	"facilities" text[] NOT NULL,
	"location" geometry(point) NOT NULL,
	"agent_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" numeric(2, 1) NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"avatar" text,
	"email" varchar(255) NOT NULL,
	"password" varchar NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_listing_id_real_state_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."real_state_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_state_listings" ADD CONSTRAINT "real_state_listings_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_real_state_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."real_state_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spatial_idx" ON "real_state_listings" USING gist ("location");