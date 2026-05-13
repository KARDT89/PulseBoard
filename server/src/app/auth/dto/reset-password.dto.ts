import { z } from 'zod';
import BaseDto from '../../dto/base.dto.js';

const resetPasswordSchema = z
  .object({
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
  })
  .strict();

export class ResetPasswordDto extends BaseDto {
  static schema = resetPasswordSchema;
}

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
