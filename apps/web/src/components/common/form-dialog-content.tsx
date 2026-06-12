'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type FormDialogContentProps = ComponentPropsWithoutRef<typeof DialogContent>;

function isDateTimeInput(element: Element | null | undefined): boolean {
  return (
    element instanceof HTMLInputElement && ['date', 'datetime-local', 'time'].includes(element.type)
  );
}

export function FormDialogContent({
  className,
  children,
  onPointerDownOutside,
  onInteractOutside,
  ...props
}: FormDialogContentProps) {
  return (
    <DialogContent
      className={cn('max-h-[90vh] gap-0 overflow-hidden p-0', className)}
      onPointerDownOutside={(event) => {
        if (isDateTimeInput(document.activeElement)) {
          event.preventDefault();
        }
        onPointerDownOutside?.(event);
      }}
      onInteractOutside={(event) => {
        if (isDateTimeInput(document.activeElement)) {
          event.preventDefault();
        }
        onInteractOutside?.(event);
      }}
      {...props}
    >
      <div className="max-h-[90vh] overflow-y-auto p-6">{children}</div>
    </DialogContent>
  );
}
