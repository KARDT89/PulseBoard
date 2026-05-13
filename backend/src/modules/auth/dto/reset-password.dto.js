import Joi from 'joi';
import BaseDto from '../../../common/dto/base.dto.js';

class ResetPasswordDto extends BaseDto {
  static schema = Joi.object({
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base':
          'Password must contain uppercase, lowercase, and a number',
        'any.required': 'Password is required',
      }),
  });
}

export default ResetPasswordDto;
