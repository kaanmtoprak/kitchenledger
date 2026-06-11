import { z } from 'zod';

const positiveNumberString = (label: string) =>
  z
    .string()
    .min(1, `${label} zorunludur.`)
    .refine((value) => {
      const num = Number.parseFloat(value);
      return !Number.isNaN(num) && num > 0;
    }, `${label} 0'dan büyük olmalıdır.`);

const optionalNonNegativeNumberString = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value?.trim()) {
        return true;
      }
      const num = Number.parseFloat(value);
      return !Number.isNaN(num) && num >= 0;
    },
    'Birim maliyet negatif olamaz.',
  );

export const stockAdjustmentTypes = ['WASTE', 'RETURN', 'MANUAL_ADJUSTMENT'] as const;
export const adjustmentDirections = ['INCREASE', 'DECREASE'] as const;

export const stockAdjustmentSchema = z
  .object({
    branchId: z.string().min(1, 'Şube seçilmelidir.'),
    ingredientId: z.string().min(1, 'Malzeme seçilmelidir.'),
    type: z.enum(stockAdjustmentTypes, { message: 'İşlem tipi seçilmelidir.' }),
    adjustmentDirection: z.enum(adjustmentDirections).optional(),
    quantity: positiveNumberString('Miktar'),
    unitCost: optionalNonNegativeNumberString,
    stockBatchId: z.string().optional(),
    reason: z.string().min(1, 'Açıklama zorunludur.'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'MANUAL_ADJUSTMENT' && !data.adjustmentDirection) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Manuel düzeltme için yön seçilmelidir.',
        path: ['adjustmentDirection'],
      });
    }

    const needsUnitCost =
      data.type === 'RETURN' ||
      (data.type === 'MANUAL_ADJUSTMENT' && data.adjustmentDirection === 'INCREASE');

    if (needsUnitCost && data.unitCost?.trim()) {
      const num = Number.parseFloat(data.unitCost);
      if (Number.isNaN(num) || num < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Birim maliyet negatif olamaz.',
          path: ['unitCost'],
        });
      }
    }
  });

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;

export const defaultStockAdjustmentValues: StockAdjustmentFormValues = {
  branchId: '',
  ingredientId: '',
  type: 'WASTE',
  adjustmentDirection: undefined,
  quantity: '',
  unitCost: '',
  stockBatchId: '__fifo__',
  reason: '',
};
