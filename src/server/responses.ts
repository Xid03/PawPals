import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function paginated<T>(
  data: T[],
  pagination: { page: number; limit: number; total?: number; nextCursor?: string | null }
) {
  return NextResponse.json({ ok: true, data, pagination });
}

export function fail(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
}

export function validationError(error: ZodError) {
  return fail(422, "VALIDATION_ERROR", "Invalid request input", error.flatten());
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return validationError(error);
  }

  if (error instanceof ApiRouteError) {
    return fail(error.status, error.code, error.message, error.details);
  }

  console.error(error);
  return fail(500, "INTERNAL_ERROR", "Something went wrong");
}

export class ApiRouteError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}
