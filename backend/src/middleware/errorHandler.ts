import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error("[Error]", err);
  const status = err.status || err.statusCode || 500;
  const message = config.isProduction ? "Internal Server Error" : err.message || "Unknown error";
  res.status(status).json({ error: message });
}
