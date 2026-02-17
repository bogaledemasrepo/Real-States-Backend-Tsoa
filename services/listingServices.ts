// src/services/listingService.ts
import { db } from "../db";
import { listings } from "../db/schema";
import { sql } from "drizzle-orm";

export class ListingService {
  public async findNearby(lat: number, lng: number, radiusMeters: number) {
    return await db.select()
      .from(listings)
      .where(
        // PostGIS: Is the distance between the point and the house < radius?
        sql`ST_DWithin(${listings.location}, ST_MakePoint(${lng}, ${lat})::geography, ${radiusMeters})`
      );
  }
}