import express, { Express } from 'express'
import morgan from 'morgan'
import * as dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import { ErrorMiddleware } from './middleware/error.middleware'

const rootDir = __dirname;

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;

const app: Express = express();

// Middleware CORS
app.use(cors());

// Log
app.use(morgan('dev'));

// JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- RUTA DE PRUEBA ----
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'dev',
    time: new Date().toISOString(),
    portUsed: PORT
  });
});

// ---- Registro de rutas ----
// (Aquí luego montas tus rutas reales)


// ---- Gestión de errores ----
app.use(ErrorMiddleware.handleError);

// ---- Listener ----
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
