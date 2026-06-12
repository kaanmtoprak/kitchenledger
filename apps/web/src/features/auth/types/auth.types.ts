export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
};

export type Membership = {
  membershipId: string;
  organizationId: string;
  role: string;
  organization: Organization;
  accessibleBranchIds: string[] | null;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type RegisterResponse = {
  accessToken: string;
  user: User;
  organization: Organization;
};

export type MeResponse = {
  user: User;
  memberships: Membership[];
};

export type RefreshResponse = {
  accessToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
};
