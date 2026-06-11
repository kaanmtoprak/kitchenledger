import { Info } from 'lucide-react';

export function DashboardWelcomeBanner() {
  return (
    <div className="flex gap-3 rounded-lg border bg-muted/40 px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="space-y-1 text-sm">
        <p>
          Hoş geldiniz. Bu panelde stok değeri, kritik malzemeler, üretim maliyetleri ve son
          hareketleri takip edebilirsiniz.
        </p>
        <p className="text-muted-foreground">
          Demo verilerle çalışıyorsunuz. Satın alma oluşturup stokların ve maliyetlerin nasıl
          değiştiğini test edebilirsiniz.
        </p>
      </div>
    </div>
  );
}
