import type { Response, Request, NextFunction } from "express";
import { ValidateError } from "tsoa";
import { HttpError } from "../services/HttpError";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  if (err instanceof ValidateError) {
    console.warn(`Captured Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof Error) {
    console.error("Unhandled Error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }

  next();
}