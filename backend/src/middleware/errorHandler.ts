import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    console.error("[lunyon-api]", req.method, req.path, err.statusCode, err.code ?? "APP_ERROR");
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
  }

  if (err instanceof ZodError) {
    console.error("[lunyon-api]", req.method, req.path, 400, "INVALID_REQUEST");
    return res.status(400).json({ error: "Invalid request" });
  }

  console.error("[lunyon-api]", req.method, req.path, 500, "INTERNAL");
  return res.status(500).json({ error: "Internal server error" });
}
