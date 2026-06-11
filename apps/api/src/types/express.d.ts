import { AuthUser } from '../auth/types/auth-user.type';
import { TenantContext } from '../common/types/tenant-context.type';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenant?: TenantContext;
    }
  }
}

export {};
