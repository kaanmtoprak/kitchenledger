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

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1, 'Malzeme zorunludur.'),
  quantity: positiveNumberString('Miktar'),
  unit: z.enum(BASE_UNIT_OPTIONS, { message: 'Birim zorunludur.' }),
});

const recipeItemsSchema = z
  .array(recipeItemSchema)
  .min(1, 'En az bir kalem eklenmelidir.')
  .superRefine((items, ctx) => {
    const ingredientIds = items.map((item) => item.ingredientId).filter((id) => id.trim() !== '');

    if (new Set(ingredientIds).size !== ingredientIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Aynı malzeme birden fazla kez eklenemez.',
      });
    }
  });

export const recipeFormSchema = z.object({
  productId: z.string().min(1, 'Ürün zorunludur.'),
  name: z.string().min(1, 'Reçete adı zorunludur.'),
  yieldQuantity: positiveNumberString('Verim miktarı'),
  yieldUnit: z.enum(BASE_UNIT_OPTIONS, { message: 'Verim birimi zorunludur.' }),
  items: recipeItemsSchema,
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export const defaultRecipeItem: RecipeFormValues['items'][number] = {
  ingredientId: '',
  quantity: '',
  unit: 'GRAM',
};

export const defaultRecipeFormValues: RecipeFormValues = {
  productId: '',
  name: '',
  yieldQuantity: '1',
  yieldUnit: 'PIECE',
  items: [defaultRecipeItem],
};
