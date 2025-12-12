import { PrismaClient } from '../generated/prisma';

// Instancia global de Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Manejo de desconexi�n al cerrar la aplicaci�n
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
