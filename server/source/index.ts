import express, { Express } from 'express';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { ErrorMiddleware } from './middleware/error.middleware';
import routes from './routes';

dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

/* =========================
   CORS CONFIG (Railway)
========================= */
const allowedOrigins = [
  process.env.FRONTEND_URL,   // Frontend en Railway
  'http://localhost:4200'     // Angular local
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS bloqueado para: ' + origin));
  },
  credentials: true
}));

/* =========================
   MIDDLEWARES
========================= */
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   HEALTH CHECK
========================= */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    portUsed: PORT
  });
});

/* =========================
   ROUTES
========================= */
app.use('/api', routes);

/* =========================
   ERROR HANDLER
========================= */
app.use(ErrorMiddleware.handleError);

/* =========================
   SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
