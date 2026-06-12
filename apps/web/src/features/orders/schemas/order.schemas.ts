import { z } from 'zod';

const positiveNumberString = (label: string) =>
  z
    .string()
    .min(1, `${label} zorunludur.`)
    .refine((value) => {
      const num = Number.parseFloat(value);
      return !Number.isNaN(num) && num > 0;
    }, `${label} 0'dan büyük olmalıdır.`);

const nonNegativeNumberString = (label: string) =>
  z
    .string()
    .min(1, `${label} zorunludur.`)
    .refine((value) => {
      const num = Number.parseFloat(value);
      return !Number.isNaN(num) && num >= 0;
    }, `${label} negatif olamaz.`);

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Ürün zorunludur.'),
  quantity: positiveNumberString('Miktar'),
  unitPrice: nonNegativeNumberString('Birim fiyat'),
});

export const orderFormSchema = z
  .object({
    branchId: z.string().min(1, 'Şube zorunludur.'),
    customerName: z.string().min(1, 'Müşteri adı zorunludur.'),
    customerPhone: z.string().optional(),
    customerEmail: z
      .string()
      .optional()
      .refine(
        (value) => !value?.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
        'Geçerli bir e-posta adresi girin.',
      ),
    orderedAt: z.string().optional(),
    dueAt: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1, 'En az bir ürün eklenmelidir.'),
  })
  .superRefine((data, ctx) => {
    const productIds = data.items.map((item) => item.productId).filter((id) => id.trim() !== '');

    if (new Set(productIds).size !== productIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Aynı ürün birden fazla kez eklenemez.',
        path: ['items'],
      });
    }
  });

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const defaultOrderItem: OrderFormValues['items'][number] = {
  productId: '',
  quantity: '',
  unitPrice: '',
};

export const defaultOrderFormValues: OrderFormValues = {
  branchId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  orderedAt: '',
  dueAt: '',
  notes: '',
  items: [defaultOrderItem],
};
