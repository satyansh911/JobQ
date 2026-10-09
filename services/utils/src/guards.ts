import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Only the other services may call this route.
 *
 * The upload endpoint stores whatever it is given and serves it back publicly,
 * and it accepts a `public_id` to delete the file being replaced. Left open,
 * anyone could host files on this server or delete other users' résumés and
 * logos by guessing their ids. Callers prove they are a sibling service with a
 * shared secret in `x-internal-token`.
 *
 * Fails closed: if INTERNAL_TOKEN is not configured, every request is refused
 * rather than the check being skipped.
 */
export function requireInternal(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.INTERNAL_TOKEN;
  if (!expected) {
    console.error("[guard] INTERNAL_TOKEN is not set; refusing internal-only request.");
    res.status(503).json({ message: "Service is not configured." });
    return;
  }

  const given = req.header("x-internal-token") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so check that first.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}

/**
 * A signed-in user must be making the request.
 *
 * Both AI routes spend Gemini quota on every call. This only verifies the
 * token's signature — utils has no database, and a valid signature is enough
 * to stop anonymous callers from draining the quota.
 */
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Please sign in to use this." });
    return;
  }

  try {
    const payload = jwt.verify(
      header.slice("Bearer ".length),
      process.env.JWT_SEC as string
    ) as JwtPayload;
    if (!payload?.id) throw new Error("token has no user id");
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
