export class HttpError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}