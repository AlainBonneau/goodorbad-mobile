import { NextFunction, Request, Response } from "express";

// Middleware pour gérer les erreurs 404
export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

// Middleware pour gérer les erreurs asynchrones
export const asyncHandler = <
  T extends (req: Request, res: Response, next: NextFunction) => Promise<any>,
>(
  fn: T
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Middleware pour gérer les erreurs
export function errorHandler(err: any, _req: any, res: any, _next: any) {
  if (err?.code === "P2002") {
    return res.status(409).json({
      success: false,
      error: { code: "CONFLICT", message: "Unique constraint violated." },
    });
  }
  const status = typeof err?.status === "number" ? err.status : 500;
  const code = err?.code ?? "INTERNAL_ERROR";
  const message = err?.message ?? "Unexpected server error.";

  const payload: any = { success: false, error: { code, message } };
  if (err?.details) payload.error.details = err.details;

  return res.status(status).json(payload);
}
