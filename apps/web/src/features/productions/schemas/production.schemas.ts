import { z } from 'zod';

const positiveNumberString = (label: string) =>
  z
    .string()
    .min(1, `${label} zorunludur.`)
    .refine((value) => {
      const num = Number.parseFloat(value);
      return !Number.isNaN(num) && num > 0;
    }, `${label} 0'dan büyük olmalı.`);

export const productionFormSchema = z.object({
  branchId: z.string().min(1, 'Şube zorunludur.'),
  productId: z.string().min(1, 'Ürün zorunludur.'),
  quantityProduced: positiveNumberString('Üretilen miktar'),
  producedAt: z.string().optional(),
  notes: z.string().optional(),
});

export type ProductionFormValues = z.infer<typeof productionFormSchema>;

export const defaultProductionFormValues: ProductionFormValues = {
  branchId: '',
  productId: '',
  quantityProduced: '1',
  producedAt: '',
  notes: '',
};
