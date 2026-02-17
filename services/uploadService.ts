import { randomUUID } from "crypto";

export class UploadService {
  private uploadDir = "./uploads";

  public async uploadImage(file: any): Promise<string> {
    // 1. Safety check
    if (!file) {
      throw new Error("No file provided to upload service");
    }

    // 2. Extract extension from mimetype (e.g., "image/jpeg" -> "jpeg")
    // Multer uses 'mimetype', standard Blobs use 'type'
    const mime = file.mimetype || file.type || "image/png";
    const fileExtension = mime.split("/")[1] || "png";

    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = `${this.uploadDir}/${fileName}`;

    // 3. Bun.write can handle the Buffer provided by Multer/Express
    // If you're using Multer 'memoryStorage', the data is in file.buffer
    const data = file.buffer || file;

    await Bun.write(filePath, data);

    return `/uploads/${fileName}`;
  }
}
