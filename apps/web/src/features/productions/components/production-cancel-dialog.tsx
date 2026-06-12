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

type ProductionCancelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productLabel?: string | null;
  isLoading?: boolean;
  onConfirm: (reason: string) => Promise<void>;
};

export function ProductionCancelDialog({
  open,
  onOpenChange,
  productLabel,
  isLoading = false,
  onConfirm,
}: ProductionCancelDialogProps) {
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
      setError(getApiErrorMessage(err, 'Üretim iptal edilemedi.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Üretim iptal edilsin mi?</DialogTitle>
          <DialogDescription>
            Bu işlem üretimde tüketilen stok miktarlarını ilgili FIFO partilerine geri ekler ve
            iptal hareketlerini işlem geçmişine kaydeder.
            {productLabel ? ` (${productLabel})` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="production-cancel-reason">İptal nedeni</Label>
          <Textarea
            id="production-cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Yanlış üretim kaydı, mükerrer kayıt, üretim iptali vb."
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
            {isLoading ? 'İptal ediliyor...' : 'Üretimi İptal Et'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
