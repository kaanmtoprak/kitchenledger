import { z } from 'zod';

export const branchFormSchema = z.object({
  name: z.string().min(1, 'Şube adı zorunludur.'),
  code: z.string().min(1, 'Şube kodu zorunludur.'),
  isActive: z.boolean().optional(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;
