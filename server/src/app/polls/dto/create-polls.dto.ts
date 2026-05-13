import { z } from 'zod';

export const CreatePollDto = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  expiresAt: z.string().datetime(), // ISO string from frontend
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        isMandatory: z.boolean().default(true),
        options: z.array(z.string().min(1)).min(2), // at least 2 options
      }),
    )
    .min(1)
});

export type CreatePollInput = z.infer<typeof CreatePollDto>;