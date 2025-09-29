import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import csurf from 'csurf';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(morgan('dev'));

const jsonBodyLimit = '1mb';
app.use(express.json({ limit: jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));

const allowedOrigins = config.env === 'production' ? [] : ['http://localhost:5173'];
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
};

app.use('/api', cors(corsOptions));
app.use('/admin/api', cors(corsOptions));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: config.env === 'production' ? 'strict' : 'lax'
    }
  })
);

const csrfProtection = csurf();
app.use('/admin/api', csrfProtection);

app.use('/api', publicRoutes);
app.use('/admin/api', adminRoutes);

if (config.env === 'production') {
  const distPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin/api')) {
      return next();
    }
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 Server ready on port ${config.port}`);
});
