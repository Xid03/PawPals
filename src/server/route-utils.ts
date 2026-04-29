import type { NextRequest } from "next/server";
import type { ZodSchema } from "zod";

export async function parseJson<T>(request: NextRequest, schema: ZodSchema<T>) {
  const body = await request.json().catch(() => ({}));
  return schema.parse(body);
}

export function queryObject(request: NextRequest) {
  return Object.fromEntries(request.nextUrl.searchParams);
}
