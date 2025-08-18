import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";

type Schemas = {
  headers?: ZodType<any>;
  params?: ZodType<any>;
  query?: ZodType<any>;
  body?: ZodType<any>;
};

// Middleware de validation des schémas
export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const out: any = {};
      if (schemas.headers) {
        const parsed = schemas.headers.parse(req.headers);
        out.headers = parsed;
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        out.params = parsed;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        out.query = parsed;
      }
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        out.body = parsed;
      }
      (res.locals as any).validated = out;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next({
          status: 400,
          code: "VALIDATION_ERROR",
          message: "Invalid request.",
          details: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }
      next(err);
    }
  };
}
