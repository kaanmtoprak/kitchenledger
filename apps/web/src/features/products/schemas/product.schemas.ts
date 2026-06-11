import { z } from 'zod';

const defaultServingCountSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') {
        return true;
      }
      const num = Number.parseFloat(value);
      return !Number.isNaN(num) && num > 0;
    },
    { message: "Varsayılan porsiyon sayısı 0'dan büyük olmalı." },
  );

export const productFormSchema = z.object({
  name: z.string().min(1, 'Ürün adı zorunludur.'),
  sku: z.string().min(1, 'Ürün kodu zorunludur.'),
  description: z.string().optional(),
  defaultServingCount: defaultServingCountSchema,
  isActive: z.boolean().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
