import { z } from "zod";

// Header: x-owner-key
export const ownerKeyHeaderSchema = z.object({
  "x-owner-key": z
    .string()
    .min(1, "x-owner-key is required")
    .transform((s) => s.trim()),
});

// Param : /sessions/:id
export const sessionIdParamsSchema = z.object({
  id: z.string().uuid("Invalid session id"),
});

// Query: /sessions/history/list?page=&limit=&official=
export const sessionsHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  official: z.coerce.boolean().optional(),
});
