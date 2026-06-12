'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function openNativePicker(input: HTMLInputElement) {
  if (typeof input.showPicker !== 'function') {
    return;
  }

  try {
    input.showPicker();
  } catch {
    // showPicker requires a direct user gesture in some browsers
  }
}

export const DateTimeLocalInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type = 'datetime-local', onClick, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type={type}
        className={cn(className)}
        onClick={(event) => {
          openNativePicker(event.currentTarget);
          onClick?.(event);
        }}
        {...props}
      />
    );
  },
);

DateTimeLocalInput.displayName = 'DateTimeLocalInput';
