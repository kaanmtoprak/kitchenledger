import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Şifre zorunludur.'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'Ad zorunludur.'),
  lastName: z.string().min(1, 'Soyad zorunludur.'),
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı.'),
  organizationName: z.string().min(2, 'İşletme adı en az 2 karakter olmalı.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
