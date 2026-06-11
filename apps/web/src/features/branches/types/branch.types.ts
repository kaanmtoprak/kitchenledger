export type Branch = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginatedMeta;
};

export type ListBranchesParams = {
  page?: number;
  limit?: number;
  q?: string;
  includeInactive?: boolean;
};

export type CreateBranchPayload = {
  name: string;
  code: string;
};

export type UpdateBranchPayload = {
  name?: string;
  code?: string;
  isActive?: boolean;
};
