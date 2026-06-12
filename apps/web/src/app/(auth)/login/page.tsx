import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <Card className="shadow-card-hover">
      <CardHeader className="space-y-2 pb-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            KitchenLedger
          </p>
          <CardTitle className="text-2xl font-bold tracking-tight">Giriş Yap</CardTitle>
        </div>
        <CardDescription className="text-[13px] leading-relaxed">
          Hesabınıza giriş yapın.
        </CardDescription>
        <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-[13px] leading-relaxed text-muted-foreground">
          Demo: <span className="font-medium text-foreground">owner@kitchenledger.app</span> /{' '}
          <span className="font-medium text-foreground">Password123!</span>
        </div>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="font-medium text-primary hover:underline">
            KitchenLedger
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
