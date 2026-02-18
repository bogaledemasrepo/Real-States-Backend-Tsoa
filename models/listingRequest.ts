/**
 * Interface for creating a new listing. 
 * tsoa will use this to validate the POST body.
 */
export type ListingCategory = "House" | "Villa" | "Apartment" | "Condo" | "Studio" | "Townhouse";

export interface ListingCreateRequest {
  title: string;
  /** @minLength 10 */
  address: string;
  category:ListingCategory;
  /** @isDouble */
  price: string;
  /** @isInt */
  numOfBedrooms: string;
  /** @isInt */
  numOfBathrooms: string;
  /** @isDouble */
  areaInSqFt: string;
  images: string[];
  facilities: string[];
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
}