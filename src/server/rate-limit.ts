import type { NextRequest } from "next/server";
import { ApiRouteError } from "./responses";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(
  request: NextRequest,
  scope: string,
  options: { limit: number; windowMs: number }
) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "local";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  bucket.count += 1;

  if (bucket.count > options.limit) {
    throw new ApiRouteError(429, "RATE_LIMITED", "Too many requests. Please slow down.");
  }
}
