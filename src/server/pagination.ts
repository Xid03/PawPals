import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional()
});

export function getPagination(searchParams: URLSearchParams) {
  const parsed = paginationSchema.parse(Object.fromEntries(searchParams));
  return {
    ...parsed,
    skip: (parsed.page - 1) * parsed.limit,
    take: parsed.limit
  };
}
