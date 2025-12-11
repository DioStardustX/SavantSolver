-- CreateTable
CREATE TABLE `PlataformaVideojuego` (
    `plataformaId` INTEGER NOT NULL,
    `videojuegoId` INTEGER NOT NULL,
    `anno_lanzamiento` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`plataformaId`, `videojuegoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Orden` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fechaOrden` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrdenVideojuego` (
    `ordenId` INTEGER NOT NULL,
    `videojuegoId` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`ordenId`, `videojuegoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_GeneroToVideojuego` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_GeneroToVideojuego_AB_unique`(`A`, `B`),
    INDEX `_GeneroToVideojuego_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PlataformaVideojuego` ADD CONSTRAINT `PlataformaVideojuego_plataformaId_fkey` FOREIGN KEY (`plataformaId`) REFERENCES `Plataforma`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlataformaVideojuego` ADD CONSTRAINT `PlataformaVideojuego_videojuegoId_fkey` FOREIGN KEY (`videojuegoId`) REFERENCES `Videojuego`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orden` ADD CONSTRAINT `Orden_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenVideojuego` ADD CONSTRAINT `OrdenVideojuego_ordenId_fkey` FOREIGN KEY (`ordenId`) REFERENCES `Orden`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenVideojuego` ADD CONSTRAINT `OrdenVideojuego_videojuegoId_fkey` FOREIGN KEY (`videojuegoId`) REFERENCES `Videojuego`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GeneroToVideojuego` ADD CONSTRAINT `_GeneroToVideojuego_A_fkey` FOREIGN KEY (`A`) REFERENCES `Genero`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GeneroToVideojuego` ADD CONSTRAINT `_GeneroToVideojuego_B_fkey` FOREIGN KEY (`B`) REFERENCES `Videojuego`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
