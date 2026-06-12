import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-slate-200/80 bg-slate-100 text-slate-700',
        destructive: 'border-red-200/80 bg-red-50 text-red-800',
        outline: 'border-slate-200/80 bg-card text-foreground',
        success: 'border-emerald-200/80 bg-emerald-50 text-emerald-800',
        warning: 'border-amber-200/80 bg-amber-50 text-amber-900',
        info: 'border-sky-200/80 bg-sky-50 text-sky-800',
        muted: 'border-slate-200/80 bg-slate-100 text-slate-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
