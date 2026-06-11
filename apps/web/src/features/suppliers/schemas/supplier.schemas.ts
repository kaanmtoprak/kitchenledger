import { z } from 'zod';

export const supplierFormSchema = z.object({
  name: z.string().min(1, 'Tedarikçi adı zorunludur.'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.trim() === '' || z.string().email().safeParse(value).success,
      {
        message: 'Geçerli bir e-posta adresi girin.',
      },
    ),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
