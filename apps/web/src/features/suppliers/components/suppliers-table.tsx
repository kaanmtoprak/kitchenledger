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
import type { Supplier } from '../types/supplier.types';

type SuppliersTableProps = {
  suppliers: Supplier[];
  isLoading?: boolean;
  canEdit?: boolean;
  canDeactivate?: boolean;
  onEdit: (supplier: Supplier) => void;
  onDeactivate: (supplier: Supplier) => void;
  onCreate?: () => void;
};

function displayValue(value: string | null | undefined) {
  return value && value.trim() !== '' ? value : '—';
}

export function SuppliersTable({
  suppliers,
  isLoading,
  canEdit = true,
  canDeactivate = true,
  onEdit,
  onDeactivate,
  onCreate,
}: SuppliersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <EmptyState
        title={emptyListTitle(canEdit, 'Henüz tedarikçi yok')}
        description={
          canEdit
            ? 'Tedarikçi bilgilerini ekleyerek satın alma kaynaklarınızı düzenleyin.'
            : READ_ONLY_EMPTY_HINT
        }
        action={
          onCreate && canEdit ? (
            <Button type="button" onClick={onCreate}>
              Tedarikçi Oluştur
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
          <TableHead>İletişim</TableHead>
          <TableHead>Telefon</TableHead>
          <TableHead>E-posta</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Oluşturulma</TableHead>
          {canEdit || canDeactivate ? (
            <TableHead className="w-[70px] text-right">İşlemler</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier) => (
          <TableRow key={supplier.id}>
            <TableCell className="font-medium">{supplier.name}</TableCell>
            <TableCell>{displayValue(supplier.contactName)}</TableCell>
            <TableCell>{displayValue(supplier.phone)}</TableCell>
            <TableCell>{displayValue(supplier.email)}</TableCell>
            <TableCell>
              <Badge variant={supplier.isActive ? 'secondary' : 'outline'}>
                {supplier.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </TableCell>
            <TableCell>{formatDateTime(supplier.createdAt)}</TableCell>
            {canEdit || canDeactivate ? (
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Menüyü aç</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit ? (
                      <DropdownMenuItem onClick={() => onEdit(supplier)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                    ) : null}
                    {canDeactivate && supplier.isActive ? (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeactivate(supplier)}
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
