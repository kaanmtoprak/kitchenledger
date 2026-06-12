'use client';

import { CheckCircle2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SuccessAlertProps = {
  message: string;
  onDismiss: () => void;
  className?: string;
};

export function SuccessAlert({ message, onDismiss, className }: SuccessAlertProps) {
  return (
    <Alert
      className={cn(
        'items-center border-emerald-200 bg-emerald-50 text-emerald-900 [&>svg]:mt-0 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
        className,
      )}
    >
      <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
      <AlertDescription>{message}</AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
        onClick={onDismiss}
        aria-label="Bildirimi kapat"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
