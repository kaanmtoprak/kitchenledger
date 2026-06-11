import type { PaginatedResponse } from '@/features/branches/types/branch.types';

export type Supplier = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListSuppliersParams = {
  page?: number;
  limit?: number;
  q?: string;
  includeInactive?: boolean;
};

export type CreateSupplierPayload = {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type UpdateSupplierPayload = {
  name?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type SuppliersListResponse = PaginatedResponse<Supplier>;
