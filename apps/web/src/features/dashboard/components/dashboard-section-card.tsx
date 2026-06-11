'use client';

import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type DashboardSectionCardProps = {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSectionCard({
  title,
  description,
  isLoading,
  isError,
  errorMessage = 'Bu bölüm yüklenemedi.',
  isEmpty,
  emptyMessage = 'Veri bulunmuyor.',
  children,
  className,
  contentClassName,
}: DashboardSectionCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={contentClassName}>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : isEmpty ? (
          <div className="rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
