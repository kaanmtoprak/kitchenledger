'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { branchesApi } from '@/features/branches/api/branches.api';
import type { Branch } from '@/features/branches/types/branch.types';
import { useAuth } from '@/lib/auth/use-auth';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';
import { recipesApi } from '../api/recipes.api';
import type { RecipeListItem } from '../types/recipe.types';
import { CostBreakdown } from './cost-breakdown';

type RecipeCostDialogProps = {
  recipe: RecipeListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecipeCostDialog({ recipe, open, onOpenChange }: RecipeCostDialogProps) {
  const { selectedOrganizationId } = useAuth();
  const [branchId, setBranchId] = useState('');

  const branchesQuery = useQuery({
    queryKey: ['branches', selectedOrganizationId, 'recipe-cost'],
    queryFn: () => branchesApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(open && selectedOrganizationId),
  });

  const branches = branchesQuery.data?.data ?? [];

  const costQuery = useQuery({
    queryKey: ['recipes', 'cost', selectedOrganizationId, recipe?.id, branchId],
    queryFn: () => recipesApi.getCost(recipe!.id, { branchId }),
    enabled: Boolean(open && recipe && branchId && selectedOrganizationId),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setBranchId('');
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Reçete Maliyeti{recipe ? `: ${recipe.name}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Şube</p>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Şube seçin" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch: Branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!branchId ? (
            <p className="text-sm text-muted-foreground">
              Reçete maliyetini hesaplamak için bir şube seçin.
            </p>
          ) : null}

          {branchId && costQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : null}

          {branchId && costQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getApiErrorMessage(costQuery.error, 'Reçete maliyeti yüklenemedi.')}
              </AlertDescription>
            </Alert>
          ) : null}

          {costQuery.data ? (
            <CostBreakdown cost={costQuery.data} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
