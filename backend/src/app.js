import cookieParser from 'cookie-parser';
import express from 'express';
import authRoute from './modules/auth/auth.route.js';
import path from 'path';
import { fileURLToPath } from 'url';
import ejsLayouts from 'express-ejs-layouts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use((req, res, next) => {
  console.log(`API Endpoint: ${req.method} ${req.originalUrl}`);
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // src/ -> up one -> views/
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(ejsLayouts);
app.set('layout', 'layouts/main');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoute);

export default app;
