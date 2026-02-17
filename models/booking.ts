export interface BookingCreateRequest {
  listingId: number;
  scheduledAt: Date;
  notes?: string;
}

export interface BookingStatusUpdate {
  /** @enum ["confirmed", "declined", "completed", "cancelled"] */
  status: "confirmed" | "declined" | "completed" | "cancelled";
}