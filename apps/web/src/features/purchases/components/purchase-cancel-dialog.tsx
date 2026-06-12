'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/utils/api-error-message';

type PurchaseCancelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceLabel?: string | null;
  isLoading?: boolean;
  onConfirm: (reason: string) => Promise<void>;
};

export function PurchaseCancelDialog({
  open,
  onOpenChange,
  invoiceLabel,
  isLoading = false,
  onConfirm,
}: PurchaseCancelDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason('');
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('İptal nedeni zorunludur.');
      return;
    }

    setError(null);
    try {
      await onConfirm(trimmed);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Satın alma iptal edilemedi.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Satın alma iptal edilsin mi?</DialogTitle>
          <DialogDescription>
            Bu işlem yalnızca bağlı stok partilerinden tüketim yapılmadıysa uygulanabilir. İptal
            edilen satın alma stoktan düşülür ve işlem geçmişine kaydedilir.
            {invoiceLabel ? ` (${invoiceLabel})` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="purchase-cancel-reason">İptal nedeni</Label>
          <Textarea
            id="purchase-cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Yanlış kayıt, mükerrer fatura, iptal edilen tedarik vb."
            rows={3}
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Vazgeç
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'İptal ediliyor...' : 'Satın Almayı İptal Et'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
