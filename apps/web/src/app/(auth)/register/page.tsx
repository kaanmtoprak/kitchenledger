import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <Card className="shadow-card-hover">
      <CardHeader className="space-y-2 pb-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">KitchenLedger</p>
          <CardTitle className="text-2xl font-bold tracking-tight">Hesap Oluştur</CardTitle>
        </div>
        <CardDescription className="text-[13px] leading-relaxed">
          İşletmenizi oluşturun ve stok/maliyet takibine başlayın
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
