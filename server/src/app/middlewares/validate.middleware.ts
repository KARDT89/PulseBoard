import ApiError from '../utils/api-errors.js';
import type { NextFunction, Request, Response } from 'express';

const validate = (DtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { errors, value } = await DtoClass.validate(req.body);

    if (errors) {
      throw ApiError.badRequest(errors);
    }
    req.body = value;
    next();
  };
};

export default validate;
