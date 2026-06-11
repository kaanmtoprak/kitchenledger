type CostExplanationProps = {
  variant: 'recipe' | 'production';
};

const messages = {
  recipe:
    'Bu maliyet, seçilen şubedeki mevcut stokların ortalama birim maliyetine göre hesaplanan tahmini maliyettir.',
  production:
    'Üretim kaydedildiğinde gerçek FIFO parti maliyetleri kullanılır ve maliyet kaydı saklanır.',
};

export function CostExplanation({ variant }: CostExplanationProps) {
  return (
    <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      {messages[variant]}
    </p>
  );
}
