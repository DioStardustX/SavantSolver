import express, { Express } from 'express';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { ErrorMiddleware } from './middleware/error.middleware';
import routes from './routes';

dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

// Middlewares comunes
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    portUsed: PORT,
  });
});

// 🔹 Montar TODAS las rutas de /source/routes bajo el prefijo /api
app.use('/api', routes);

// Middleware de errores (siempre al final)
app.use(ErrorMiddleware.handleError);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
