'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/empty-state';
import { emptyListTitle, READ_ONLY_EMPTY_HINT } from '@/lib/utils/empty-state-messages';
import { formatDateTime } from '@/lib/utils/display';
import type { Branch } from '../types/branch.types';

type BranchesTableProps = {
  branches: Branch[];
  isLoading?: boolean;
  canManage?: boolean;
  onEdit: (branch: Branch) => void;
  onDeactivate: (branch: Branch) => void;
  onCreate?: () => void;
};

export function BranchesTable({
  branches,
  isLoading,
  canManage = true,
  onEdit,
  onDeactivate,
  onCreate,
}: BranchesTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <EmptyState
        title={emptyListTitle(canManage, 'Henüz şube yok')}
        description={
          canManage
            ? 'Şube tanımlayarak stok ve operasyonları lokasyon bazında yönetmeye başlayın.'
            : READ_ONLY_EMPTY_HINT
        }
        action={
          onCreate && canManage ? (
            <Button type="button" onClick={onCreate}>
              Şube Oluştur
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ad</TableHead>
          <TableHead>Kod</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Oluşturulma</TableHead>
          {canManage ? <TableHead className="w-[70px] text-right">İşlemler</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {branches.map((branch) => (
          <TableRow key={branch.id}>
            <TableCell className="font-medium">{branch.name}</TableCell>
            <TableCell>{branch.code}</TableCell>
            <TableCell>
              <Badge variant={branch.isActive ? 'success' : 'muted'}>
                {branch.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </TableCell>
            <TableCell>{formatDateTime(branch.createdAt)}</TableCell>
            {canManage ? (
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Menüyü aç</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(branch)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    {branch.isActive ? (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeactivate(branch)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Pasife Al
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
