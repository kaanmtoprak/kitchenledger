import { Role } from '@kitchenledger/db';

export type TenantContext = {
  organizationId: string;
  membershipId: string;
  role: Role;
  userId: string;
};
