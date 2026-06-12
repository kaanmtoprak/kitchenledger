export type AppRole = 'OWNER' | 'ADMIN' | 'BRANCH_MANAGER' | 'STAFF' | 'VIEWER';

export type Permissions = {
  role: AppRole | null;
  canViewAuditLogs: boolean;
  canManageTeam: boolean;
  canManageBranches: boolean;
  canDeactivateRecords: boolean;
  canMutateReferenceData: boolean;
  canCreatePurchase: boolean;
  canCreateProduction: boolean;
  canManageProductsAndRecipes: boolean;
  canCreateOrder: boolean;
  canEditOrder: boolean;
  canUpdateOrderStatus: boolean;
  canCreateStockAdjustment: boolean;
};

export function createPermissions(role: string | null | undefined): Permissions {
  const normalizedRole = (role ?? null) as AppRole | null;
  const isOwner = normalizedRole === 'OWNER';
  const isOwnerOrAdmin = isOwner || normalizedRole === 'ADMIN';
  const isViewer = normalizedRole === 'VIEWER';
  const canMutateReferenceData = Boolean(normalizedRole) && !isViewer;

  return {
    role: normalizedRole,
    canViewAuditLogs: isOwner,
    canManageTeam: isOwnerOrAdmin,
    canManageBranches: isOwnerOrAdmin,
    canDeactivateRecords: isOwnerOrAdmin,
    canMutateReferenceData,
    canCreatePurchase: canMutateReferenceData,
    canCreateProduction: canMutateReferenceData,
    canManageProductsAndRecipes: canMutateReferenceData,
    canCreateOrder: canMutateReferenceData,
    canEditOrder: canMutateReferenceData,
    canUpdateOrderStatus: canMutateReferenceData,
    canCreateStockAdjustment: canMutateReferenceData,
  };
}
