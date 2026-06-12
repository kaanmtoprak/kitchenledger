import { Sparkles } from 'lucide-react';

export function DashboardWelcomeBanner() {
  return (
    <div className="flex gap-4 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-5 py-4 shadow-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200/60">
        <Sparkles className="h-[18px] w-[18px]" aria-hidden />
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-semibold leading-snug text-foreground">
          Hoş geldiniz. Bu panelde stok değeri, kritik malzemeler, üretim maliyeti ve son hareketleri
          takip edebilirsiniz.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Demo verilerle çalışıyorsunuz. Satın alma oluşturup stokların ve maliyetlerin nasıl
          değiştiğini test edebilirsiniz.
        </p>
      </div>
    </div>
  );
}
