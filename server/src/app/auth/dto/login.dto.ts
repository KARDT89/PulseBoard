import { z } from 'zod';
import BaseDto from '../../dto/base.dto.js';

const loginSchema = z
  .object({
    email: z.email(),
    password: z.string(),
  })
  .strict();

export class LoginDto extends BaseDto {
  static schema = loginSchema;
}

export type LoginInput = z.infer<typeof loginSchema>;
