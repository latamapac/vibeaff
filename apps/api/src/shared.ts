import express from "express";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const asyncHandler =
  (handler: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<unknown>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export function paramId(req: express.Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export function paginationParams(req: express.Request): { take: number; skip: number; cursor?: { id: string } } {
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
  const cursor = req.query.cursor as string | undefined;
  if (cursor) {
    return { take: limit, skip: 1, cursor: { id: cursor } };
  }
  const page = Math.max(Number(req.query.page ?? 1), 1);
  return { take: limit, skip: (page - 1) * limit };
}
