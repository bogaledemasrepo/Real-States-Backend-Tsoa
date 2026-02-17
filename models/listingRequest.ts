/**
 * Interface for creating a new listing. 
 * tsoa will use this to validate the POST body.
 */
export interface ListingCreateRequest {
  title: string;
  /** @minLength 10 */
  address: string;
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