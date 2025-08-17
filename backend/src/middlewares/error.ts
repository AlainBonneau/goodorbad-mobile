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
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = err as any;

  if (error?.code === "P2002") {
    return res.status(409).json({
      success: false,
      error: { code: "CONFLICT", message: "Unique constraint violation" },
    });
  }

  const status = typeof error?.status === "number" ? error.status : 500;
  const code = error?.code ?? "INTERNAL_SERVER_ERROR";
  const message = error?.message ?? "An unexpected error occurred";

  return res.status(status).json({ success: false, error: { code, message } });
}
