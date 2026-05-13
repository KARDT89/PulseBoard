import { z } from 'zod';

export const SubmitResponseDto = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      optionId: z.string().uuid(),
    })
  ).min(1),
});

export type SubmitResponseInput = z.infer<typeof SubmitResponseDto>;