export type AuthUser = {
  userId: string;
  email: string;
};

export type SafeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type SafeOrganization = {
  id: string;
  name: string;
  slug: string;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export type RefreshTokenPayload = {
  sub: string;
  tokenType: 'refresh';
};
