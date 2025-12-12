"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
// Instancia global de Prisma Client
const prisma = new prisma_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
// Manejo de desconexi�n al cerrar la aplicaci�n
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
exports.default = prisma;
