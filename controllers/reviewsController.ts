import { 
  Controller, Get, Post, Body, Path, Route, Tags, Security, Request, SuccessResponse 
} from "tsoa";
import { db } from "../db";
import { reviews } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

interface ReviewCreateRequest {
  listingId: number;
  /** @minimum 1 @maximum 5 */
  rating: number;
  comment?: string;
}

@Route("reviews")
@Tags("Reviews")
export class ReviewController extends Controller {

  /**
   * Submit a review for a listing. 
   * Prevents duplicate reviews from the same user on the same listing.
   */
  @Security("jwt")
  @SuccessResponse("201", "Created")
  @Post()
  public async createReview(
    @Request() request: any,
    @Body() body: ReviewCreateRequest
  ): Promise<any> {
    const userId = request.user.userId;

    // 1. Check for existing review (Anti-Spam)
    const existing = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.listingId, body.listingId),
        eq(reviews.userId, userId)
      ),
    });

    if (existing) {
      this.setStatus(409); // Conflict
      return { message: "You have already reviewed this listing" };
    }

    // 2. Insert Review
    const [newReview] = await db.insert(reviews).values({
      listingId: body.listingId,
      userId: userId,
      rating: body.rating.toString(), // numeric(2,1) expects string
      comment: body.comment,
    }).returning();

    this.setStatus(201);
    return newReview;
  }

  /**
   * Get all reviews for a specific listing with User avatars and names.
   */
  @Get("listing/{listingId}")
  public async getListingReviews(@Path() listingId: number): Promise<any> {
    return await db.query.reviews.findMany({
      where: eq(reviews.listingId, listingId),
      with: {
        user: {
          columns: {
            name: true,
            avatar: true
          }
        }
      },
      orderBy: [desc(reviews.createdAt)]
    });
  }

  /**
   * Get overall rating stats for a listing.
   */
  @Get("listing/{listingId}/stats")
  public async getListingStats(@Path() listingId: number): Promise<any> {
    const stats = await db
      .select({
        averageRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)`,
        totalReviews: sql<number>`count(${reviews.id})`,
      })
      .from(reviews)
      .where(eq(reviews.listingId, listingId));

    return stats[0] || { averageRating: 0, totalReviews: 0 };
  }
}