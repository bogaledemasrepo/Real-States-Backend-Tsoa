import {
  Post,
  Put,
  Delete,
  Body,
  Path,
  SuccessResponse,
  Controller,
  Get,
  Query,
  Route,
  Tags,
  Security,
  Request,
} from "tsoa";
import { db } from "../db";
import { listings, reviews, users } from "../db/schema";
import { eq, desc, sql, count, and, gte, lte, ilike, or } from "drizzle-orm";
import type { ListingCreateRequest } from "../models/listingRequest";
import type { PaginatedResponse } from "../models";

export interface ListingSearchParams {
  /** Search in title or address */
  query?: string;
  category?: "House" | "Villa" | "Apartment" | "Condo" | "Studio" | "Townhouse";
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  /** Radius in meters for spatial search */
  radius?: number;
  lat?: number;
  lng?: number;
}

@Route("listings")
@Tags("Real Estate Listings")
export class ListingController extends Controller {
  /**
   * GET /listings/search
   * Search listings with multiple filters and pagination.
   */
  @Get("search")
  public async searchListings(
    @Query() query?: string,
    @Query() category?: string,
    @Query() minPrice?: number,
    @Query() maxPrice?: number,
    @Query() minBedrooms?: number,
    @Query() lat?: number,
    @Query() lng?: number,
    @Query() radius: number = 5000, // Default 5km
    @Query() page: number = 1,
    @Query() limit: number = 10,
  ): Promise<any> {
    const offset = (page - 1) * limit;
    const filters = [];

    // 1. Text Search (Case-insensitive)
    if (query) {
      filters.push(
        or(
          ilike(listings.title, `%${query}%`),
          ilike(listings.address, `%${query}%`),
        ),
      );
    }

    // 2. Category Filter
    if (category) {
      filters.push(eq(listings.category, category as any));
    }

    // 3. Price Range (Remember: numeric is handled as string in Drizzle)
    if (minPrice) filters.push(gte(listings.price, minPrice.toString()));
    if (maxPrice) filters.push(lte(listings.price, maxPrice.toString()));

    // 4. Room Counts
    if (minBedrooms) filters.push(gte(listings.numOfBedrooms, minBedrooms));

    // 5. Spatial Radius Filter (PostGIS)
    // ST_DWithin is faster than ST_Distance for filtering
    if (lat && lng) {
      filters.push(
        sql`ST_DWithin(${listings.location}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${radius})`,
      );
    }
    // 6. Execute Query with Metadata
    const [totalResult, data] = await Promise.all([
      db
        .select({ count: sql`count(distinct ${listings.id})` }) // distinct prevents double counting during joins
        .from(listings)
        .where(and(...filters)),
      db
        .select({
          id: listings.id,
          title: listings.title,
          price: listings.price,
          address: listings.address,
          // Fixed: ensures we grab the first image correctly
          image: sql<string>`${listings.images}[1]`,
          // Fixed: Reference reviews.rating explicitly
          rating: sql<number>`COALESCE(ROUND(AVG(CAST(${reviews.rating} AS NUMERIC)), 1), 0)::float`,

          numOfReviews: sql<number>`COUNT(${reviews.id})`,
         
        })
        .from(listings)
        .leftJoin(reviews, eq(reviews.listingId, listings.id)) // CRITICAL: You must join the reviews table
        .where(and(...filters))
        .limit(limit)
        .offset(offset)
        .orderBy(
          lat && lng
            ? sql`${listings.location} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`
            : sql`${listings.createdAt} DESC`,
        )
        .groupBy(listings.id), // Grouping by listing ID allows the AVG() to work
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /listings/paged
   * Fetch listings with limit and offset pagination.
   */
  @Get("paged")
  public async getPaged(
    @Query() page: number = 1,
    @Query() limit: number = 10,
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;

    // Run count and data fetch in parallel
    const [totalResult, data] = await Promise.all([
      db.select({ value: count() }).from(listings),
      db
        .select({
          id: listings.id,
          title: listings.title,
          price: listings.price,
          address: listings.address,
          image: sql<string>`CASE WHEN ${listings.images} IS NOT NULL THEN ${listings.images}[1] ELSE NULL END`,
          rating: sql<number>`COALESCE(ROUND(AVG(CAST(${reviews.rating} AS NUMERIC)), 1), 0)::float`,
          numOfReviews: sql<number>`COUNT(${reviews.id})`,
        })
        .from(listings)
        .leftJoin(reviews, eq(reviews.listingId, listings.id))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(listings.createdAt))
        .groupBy(listings.id),
    ]);

    const total = totalResult[0]?.value || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * GET /listings/featured
   * Returns top-tier or recently boosted listings.
   */
  @Get("featured")
  public async getFeatured(): Promise<any> {
    // Logic: for now, we'll fetch the 5 most expensive/recent ones
    return await db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        address: listings.address,
        image: sql<string>`CASE WHEN ${listings.images} IS NOT NULL THEN ${listings.images}[1] ELSE NULL END`,
        rating: sql<number>`COALESCE(ROUND(AVG(CAST(${reviews.rating} AS NUMERIC)), 1), 0)::float`,
        numOfReviews: sql<number>`COUNT(${reviews.id})`,
      })
      .from(listings)
      .leftJoin(reviews, eq(reviews.listingId, listings.id))
      .limit(5)
      .orderBy(desc(listings.price))
      .groupBy(listings.id);
  }

  /**
   * GET /listings/recommended
   * Uses spatial logic to find listings near a coordinate.
   */
  @Get("recommended")
  public async getRecommended(
    @Query() lat: number,
    @Query() lng: number,
  ): Promise<any> {
    return await db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        address: listings.address,
        image: sql<string>`CASE WHEN ${listings.images} IS NOT NULL THEN ${listings.images}[1] ELSE NULL END`,
        rating: sql<number>`COALESCE(ROUND(AVG(CAST(${reviews.rating} AS NUMERIC)), 1), 0)::float`,
        numOfReviews: sql<number>`COUNT(${reviews.id})`,
      })
      .from(listings)
      .leftJoin(reviews, eq(reviews.listingId, listings.id))
      .orderBy(
        sql`${listings.location} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
      )
      .limit(6)
      .groupBy(listings.id);
  }

  /**
   * GET /listings/my-listings
   * Returns listings created by the authenticated user.
   */
  @Security("jwt")
  @Get("my-listings")
  public async getMyListings(@Request() request: any): Promise<any> {
    // Check if it's 'id' or 'userId' based on your token structure
    const agentId = request.user.userId;

    if (!agentId) {
      this.setStatus(401);
      return { message: "User identity not found in token" };
    }

    return await db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        address: listings.address,
        image: sql<string>`CASE WHEN ${listings.images} IS NOT NULL THEN ${listings.images}[1] ELSE NULL END`,
        rating: sql<number>`COALESCE(ROUND(AVG(CAST(${reviews.rating} AS NUMERIC)), 1), 0)::float`,
        numOfReviews: sql<number>`COUNT(${reviews.id})`,
      })
      .from(listings)
      .leftJoin(reviews, eq(reviews.listingId, listings.id))
      .where(eq(listings.agentId, agentId))
      .groupBy(listings.id);
  }
  /**
   * GET /listings/nearby
   * Returns listings near a given coordinate.
   */

  @Security("jwt")
  @Get("nearby")
  public async getNearbyListings(
    @Query() lat: number,
    @Query() lng: number,
  ): Promise<any> {
    return await db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        address: listings.address,
        image: sql<string>`CASE WHEN ${listings.images} IS NOT NULL THEN ${listings.images}[1] ELSE NULL END`,
        rating: sql<number>`COALESCE(ROUND(AVG(CAST(${reviews.rating} AS NUMERIC)), 1), 0)::float`,
        numOfReviews: sql<number>`COUNT(${reviews.id})`,
      })
      .from(listings)
      .leftJoin(reviews, eq(reviews.listingId, listings.id))
      .orderBy(
        sql`${listings.location} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
      )
      .groupBy(listings.id)
      .limit(6);
  }

  /**
   * Listing Detail
   */
  @Security("jwt")
  @Get("{id}")
  public async getListingDetail(@Request() request: any,@Path() id: number): Promise<any> {
    const result = await db
      .select({
        id: listings.id,
        title: listings.title,
        category: listings.category,
        price: listings.price,
        address: listings.address,
        images: listings.images,
        facilities: listings.facilities,
        numOfBedrooms: listings.numOfBedrooms,
        numOfBathrooms: listings.numOfBathrooms,
        areaInSqFt: listings.areaInSqFt,
        rating: sql<number>`COALESCE(ROUND(AVG(CAST(${reviews.rating} AS NUMERIC)), 1), 0)::float`,
        numOfReviews: sql<number>`COUNT(${reviews.id})`,
        reviewedByMe: sql<boolean>`EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = ${listings.id} AND r.user_id = ${request.user.userId})`,
        createdAt: listings.createdAt,
        updatedAt: listings.updatedAt,
        agent: {
          id: users.id,
          name: users.name,
          phone: users.phone,
          email: users.email,
          avatar: users.avatar,
        },
      })
      .from(listings)
      .leftJoin(reviews, eq(reviews.listingId, listings.id)) // Join instead of subquery is faster
      .leftJoin(users, eq(users.id, listings.agentId))
      .where(eq(listings.id, id))
      .groupBy(listings.id, users.id); // Required when using aggregate functions like AVG

    return result[0]; // Select returns an array, so return the first item
  }

  /**
   * Create a new listing.
   * The authenticated user's ID is automatically set as the agentId.
   */
  @SuccessResponse("201", "Created")
  @Post()
  public async createListing(
    @Body() body: ListingCreateRequest,
    @Request() request: any, // The request object containing user info
  ): Promise<void> {
    // 1. Extract the Agent ID from the authenticated user (from JWT)
    const authenticatedAgentId = request.user.userId;

    // 2. Perform the Insert
    await db.insert(listings).values({
      title: body.title,
      category: body.category,
      price: body.price.toString(), // numeric(12,2) expects string in Drizzle
      address: body.address,
      numOfBedrooms: Number(body.numOfBedrooms), // integer expects number
      numOfBathrooms: Number(body.numOfBathrooms), // integer expects number
      areaInSqFt: body.areaInSqFt.toString(), // numeric(10,2) expects string
      images: body.images,
      facilities: body.facilities,
      agentId: authenticatedAgentId,
      location: { x: body.lng, y: body.lat },
    });
    this.setStatus(201);
  }

  /**
   * PUT /listings/{id}
   * Update an existing listing.
   */
  @Security("jwt")
  @Put("{id}")
  public async updateListing(
    @Request() request: any,
    @Path() id: number,
    @Body() body: any,
  ): Promise<void> {
    const userId = request.user.userId;

    const existing = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (existing.length === 0) {
      this.setStatus(404);
      return;
    }
    if (existing[0]?.agentId !== userId) {
      this.setStatus(403);
      return;
    }
    await db
      .update(listings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(listings.id, id));
  }

  /**
   * DELETE /listings/{id}
   */
  @Security("jwt")
  @Delete("{id}")
  public async deleteListing(
    @Request() request: any,
    @Path() id: number,
  ): Promise<void> {
    const userId = request.user.userId;
    const existing = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (existing.length === 0) {
      this.setStatus(404);
      return;
    }
    if (existing[0]?.agentId !== userId) {
      this.setStatus(403);
      return;
    }
    await db.delete(listings).where(eq(listings.id, id));
    this.setStatus(204);
  }
}
