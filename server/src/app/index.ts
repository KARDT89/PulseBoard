import express from 'express';
import type Express from 'express';
import authRoutes from './auth/routes.js';
import cookieParser from 'cookie-parser';

export function createExpressApplication(): Express.Application {
  const app = express();

  //middlewarres
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    console.log(`API Endpoint: ${req.method} ${req.originalUrl}`);
    next();
  });

  //routes
  app.use('/api/auth', authRoutes);

  return app;
}
