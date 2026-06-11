import { z } from 'zod';
import { BASE_UNIT_OPTIONS } from '@/features/ingredients/schemas/ingredient.schemas';

const positiveNumberString = (label: string) =>
  z
    .string()
    .min(1, `${label} zorunludur.`)
    .refine((value) => {
      const num = Number.parseFloat(value);
      return !Number.isNaN(num) && num > 0;
    }, `${label} 0'dan büyük olmalı.`);

const nonNegativeNumberString = (label: string) =>
  z
    .string()
    .min(1, `${label} zorunludur.`)
    .refine((value) => {
      const num = Number.parseFloat(value);
      return !Number.isNaN(num) && num >= 0;
    }, `${label} negatif olamaz.`);

const purchaseItemSchema = z.object({
  ingredientId: z.string().min(1, 'Malzeme zorunludur.'),
  quantity: positiveNumberString('Miktar'),
  unit: z.enum(BASE_UNIT_OPTIONS, { message: 'Birim zorunludur.' }),
  totalPrice: nonNegativeNumberString('Toplam tutar'),
});

export const purchaseFormSchema = z
  .object({
    branchId: z.string().min(1, 'Şube zorunludur.'),
    supplierId: z.string().optional(),
    purchasedAt: z.string().optional(),
    invoiceNumber: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(purchaseItemSchema).min(1, 'En az bir kalem eklenmelidir.'),
  })
  .superRefine((data, ctx) => {
    const ingredientIds = data.items
      .map((item) => item.ingredientId)
      .filter((id) => id.trim() !== '');

    if (new Set(ingredientIds).size !== ingredientIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Aynı malzeme birden fazla kez eklenemez.',
        path: ['items'],
      });
    }
  });

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export const defaultPurchaseItem: PurchaseFormValues['items'][number] = {
  ingredientId: '',
  quantity: '',
  unit: 'GRAM',
  totalPrice: '',
};

export const defaultPurchaseFormValues: PurchaseFormValues = {
  branchId: '',
  supplierId: '',
  purchasedAt: '',
  invoiceNumber: '',
  notes: '',
  items: [defaultPurchaseItem],
};
