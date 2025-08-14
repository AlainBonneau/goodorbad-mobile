import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

export async function createSession(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();

    if (!ownerKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: "OWNER_KEY_REQUIRED",
          message: "x-owner-key header is required.",
        },
      });
    }

    const seed = crypto.randomUUID();

    const session = await prisma.session.create({
      data: {
        ownerKey,
        seed,
      },
      select: {
        id: true,
        ownerKey: true,
        seed: true,
        startedAt: true,
      },
    });

    return res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error("Error creating session:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
