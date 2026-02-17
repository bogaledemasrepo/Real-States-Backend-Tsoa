import * as express from "express";
import * as jwt from "jsonwebtoken";
import { HttpError } from "./HttpError";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_code";

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
    // console.log("Authenticating request for path:", request.path);
    // console.log("Security strategy:", securityName);
    // console.log("Provided scopes:", scopes);
    // console.log("Authorization header:", request.headers["authorization"]);
  if (securityName === "jwt") {
    const token = request.headers["authorization"]?.split(" ")[1]; // Bearer <token>

    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new HttpError(401, "No token provided"));
      }

      jwt.verify(token!, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
          reject(new HttpError(401, "Invalid or expired token"));
        } else {
          // You can check scopes here if you have Admin vs User roles
          resolve(decoded);
        }
      });
    });
  }
  
  return Promise.reject(new HttpError(500, "Unknown security strategy"));
}