export type AppRole = 'OWNER' | 'ADMIN' | 'BRANCH_MANAGER' | 'STAFF' | 'VIEWER';

export type Permissions = {
  role: AppRole | null;
  canManageBranches: boolean;
  canDeactivateRecords: boolean;
  canMutateReferenceData: boolean;
  canCreatePurchase: boolean;
  canCreateProduction: boolean;
  canManageProductsAndRecipes: boolean;
  canCreateOrder: boolean;
  canUpdateOrderStatus: boolean;
};

export function createPermissions(role: string | null | undefined): Permissions {
  const normalizedRole = (role ?? null) as AppRole | null;
  const isOwnerOrAdmin = normalizedRole === 'OWNER' || normalizedRole === 'ADMIN';
  const isViewer = normalizedRole === 'VIEWER';
  const canMutateReferenceData = Boolean(normalizedRole) && !isViewer;

  return {
    role: normalizedRole,
    canManageBranches: isOwnerOrAdmin,
    canDeactivateRecords: isOwnerOrAdmin,
    canMutateReferenceData,
    canCreatePurchase: canMutateReferenceData,
    canCreateProduction: canMutateReferenceData,
    canManageProductsAndRecipes: canMutateReferenceData,
    canCreateOrder: canMutateReferenceData,
    canUpdateOrderStatus: canMutateReferenceData,
  };
}
