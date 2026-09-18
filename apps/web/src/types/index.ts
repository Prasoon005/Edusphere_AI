export type Role = "SUPER_ADMIN" | "TEACHER" | "STUDENT";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  profile: Record<string, unknown> | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  [key: string]: unknown;
}
