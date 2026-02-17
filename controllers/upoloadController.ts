// src/controllers/uploadController.ts
import { Controller, Post, Route, Tags, UploadedFile } from "tsoa";
import { UploadService } from "../services/uploadService";

@Route("upload")
@Tags("Media")
export class UploadController extends Controller {
  private uploadService = new UploadService();

  /**
   * Upload a single image for a listing.
   * Returns the URL to be added to the listings.images array.
   */
  @Post("image")
  public async uploadSingleImage(
    @UploadedFile() file: Blob
  ): Promise<{ url: string }> {
    const url = await this.uploadService.uploadImage(file);
    return { url };
  }
}