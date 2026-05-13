import { z } from 'zod';
import BaseDto from '../../dto/base.dto.js';

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email(),
    password: z
      .string()
      .min(8)
      .refine(
        (val) => {
          return /[A-Z]/.test(val) && /[a-z]/.test(val) && /\d/.test(val);
        },
        {
          message: 'Password must include uppercase, lowercase, and a number',
        },
      ),
    role: z.enum(['customer', 'seller']).default('customer'),
  })
  .strict();

export class RegisterDto extends BaseDto {
  static schema = registerSchema;
}

export type RegisterInput = z.infer<typeof registerSchema>;
