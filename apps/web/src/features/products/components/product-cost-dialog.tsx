'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BranchFormSelect } from '@/components/common/branch-form-select';
import { CostBreakdown } from '@/features/recipes/components/cost-breakdown';
import { useAuth } from '@/lib/auth/use-auth';
import { useAccessibleBranches } from '@/lib/hooks/use-accessible-branches';
import { ApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { productsApi } from '../api/products.api';
import type { Product } from '../types/product.types';

type ProductCostDialogProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductCostDialog({ product, open, onOpenChange }: ProductCostDialogProps) {
  const { selectedOrganizationId } = useAuth();
  const [branchId, setBranchId] = useState('');

  const { branches, branchesQuery } = useAccessibleBranches({ queryKeySuffix: 'product-cost' });

  const costQuery = useQuery({
    queryKey: ['products', 'cost', selectedOrganizationId, product?.id, branchId],
    queryFn: () => productsApi.getCost(product!.id, { branchId }),
    enabled: Boolean(open && product && branchId && selectedOrganizationId),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setBranchId('');
    }
    onOpenChange(nextOpen);
  };

  const isNoRecipeError =
    costQuery.isError && costQuery.error instanceof ApiError && costQuery.error.status === 404;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ürün Maliyeti{product ? `: ${product.name}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Şube</p>
            <BranchFormSelect
              value={branchId}
              branches={branches}
              isLoading={branchesQuery.isLoading}
              onChange={setBranchId}
            />
          </div>

          {!branchId ? (
            <p className="text-sm text-muted-foreground">
              Ürün maliyetini hesaplamak için bir şube seçin.
            </p>
          ) : null}

          {branchId && costQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : null}

          {branchId && costQuery.isError && !isNoRecipeError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(costQuery.error, 'Ürün maliyeti yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          {branchId && isNoRecipeError ? (
            <Alert>
              <AlertDescription>Bu ürünün henüz bir reçetesi yok.</AlertDescription>
            </Alert>
          ) : null}

          {costQuery.data ? <CostBreakdown cost={costQuery.data} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
