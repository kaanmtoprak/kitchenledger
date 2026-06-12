import { z } from 'zod';

const roleSchema = z.enum(['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'STAFF', 'VIEWER']);

export const teamCreateSchema = z.object({
  firstName: z.string().trim().min(1, 'Ad zorunludur'),
  lastName: z.string().trim().min(1, 'Soyad zorunludur'),
  email: z.string().trim().email('Geçerli bir e-posta girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  role: roleSchema,
  branchIds: z.array(z.string()),
});

export type TeamCreateFormValues = z.infer<typeof teamCreateSchema>;

export const teamEditSchema = z.object({
  role: roleSchema,
  branchIds: z.array(z.string()),
  isActive: z.boolean(),
});

export type TeamEditFormValues = z.infer<typeof teamEditSchema>;
