import { z } from 'zod';

class BaseDto {
  static schema: z.ZodTypeAny = z.object({});

  static async validate(data: unknown) {
    const result = await this.schema.safeParseAsync(data);
    if (!result.success) {
      const errors = result.error;
      return { errors, value: null };
    }
    return { errors: null, value: result.data };
  }
}

export default BaseDto;
