import type { AppRole } from '@/lib/auth/permissions';

export type TeamBranch = {
  id: string;
  name: string;
  code: string;
};

export type TeamMember = {
  userId: string;
  membershipId: string;
  name: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  branches: TeamBranch[];
  createdAt: string;
  lastLoginAt: string | null;
};

export type CreateTeamMemberPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: AppRole;
  branchIds?: string[];
};

export type UpdateTeamMemberPayload = {
  role?: AppRole;
  branchIds?: string[];
  isActive?: boolean;
};
