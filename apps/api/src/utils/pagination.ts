import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function toSkipTake(query: Pick<PaginationQuery, "page" | "limit">) {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  };
}

export function toOrderBy(
  query: Pick<PaginationQuery, "sortBy" | "sortOrder">,
  allowedFields: string[],
  fallback: Record<string, "asc" | "desc">
) {
  if (query.sortBy && allowedFields.includes(query.sortBy)) {
    return { [query.sortBy]: query.sortOrder };
  }
  return fallback;
}
