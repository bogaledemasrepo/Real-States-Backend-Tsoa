import { 
  Controller, Get, Post, Put, Body, Path, Route, Tags, Security, Request, SuccessResponse 
} from "tsoa";
import { db } from "../db";
import { bookings, listings } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import type { BookingCreateRequest, BookingStatusUpdate } from "../models/booking";

@Route("bookings")
@Tags("Bookings")
export class BookingsController extends Controller {

  /**
   * Create a booking request.
   * Automatically assigns the agent from the listing.
   */
  @Security("jwt")
  @SuccessResponse("201", "Created")
  @Post()
  public async createBooking(
    @Request() request: any,
    @Body() body: BookingCreateRequest
  ): Promise<any> {
    const userId = request.user.userId;

    // 1. Fetch listing to get the agentId
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, body.listingId),
    });

    if (!listing) {
      this.setStatus(404);
      return { message: "Listing not found" };
    }
    // 2. Prevent user from booking their own listing
    if (listing.agentId === userId) {
      this.setStatus(400);
      return { message: "You cannot book a viewing for your own listing" };
    }

    // 3. Create booking
    const [newBooking] = await db.insert(bookings).values({
      listingId: body.listingId,
      userId: userId,
      agentId: listing.agentId,
      scheduledAt: body.scheduledAt,
      notes: body.notes,
    }).returning();

    this.setStatus(201);
    return newBooking;
  }

  /**
   * Get all bookings for the authenticated user (as a Buyer).
   */
  @Security("jwt")
  @Get("my-requests")
  public async getMyRequests(@Request() request: any): Promise<any> {
    return await db.query.bookings.findMany({
      where: eq(bookings.userId, request.user.userId),
      with: { listing: true },
      orderBy: [desc(bookings.scheduledAt)]
    });
  }

  /**
   * Get all bookings assigned to the authenticated user (as an Agent).
   */
  @Security("jwt")
  @Get("agent-schedule")
  public async getAgentSchedule(@Request() request: any): Promise<any> {
    return await db.query.bookings.findMany({
      where: eq(bookings.agentId, request.user.userId),
      with: { 
        listing: true,
        user: { columns: { name: true, phone: true } } 
      },
      orderBy: [desc(bookings.scheduledAt)]
    });
  }

  /**
   * Update booking status (Confirm/Decline/Cancel).
   */
  @Security("jwt")
  @Put("{id}/status")
  public async updateStatus(
    @Path() id: number,
    @Request() request: any,
    @Body() body: BookingStatusUpdate
  ): Promise<any> {
    const userId = request.user.id;

    // Verify ownership: Only the agent can confirm/decline, 
    // and only the buyer/agent can cancel.
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
    });

    if (!booking) {
      this.setStatus(404);
      return { message: "Booking not found" };
    }

    const isAgent = booking.agentId === userId;
    const isBuyer = booking.userId === userId;

    if (!isAgent && !isBuyer) {
      this.setStatus(403);
      return { message: "Unauthorized" };
    }

    await db.update(bookings)
      .set({ status: body.status })
      .where(eq(bookings.id, id));

    return { message: `Booking ${body.status}` };
  }
}