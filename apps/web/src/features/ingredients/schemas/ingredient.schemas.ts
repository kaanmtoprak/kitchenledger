import { z } from 'zod';

const baseUnits = ['GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'PIECE'] as const;

const minimumStockLevelSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') {
        return true;
      }
      const num = Number.parseFloat(value);
      return !Number.isNaN(num) && num >= 0;
    },
    { message: 'Minimum stok seviyesi 0 veya daha büyük olmalı.' },
  );

export const ingredientFormSchema = z.object({
  name: z.string().min(1, 'Malzeme adı zorunludur.'),
  sku: z.string().min(1, 'Malzeme kodu zorunludur.'),
  baseUnit: z.enum(baseUnits, { message: 'Temel birim zorunludur.' }),
  minimumStockLevel: minimumStockLevelSchema,
  isActive: z.boolean().optional(),
});

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

export const BASE_UNIT_OPTIONS = baseUnits;
