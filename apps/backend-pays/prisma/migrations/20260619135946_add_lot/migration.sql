-- CreateTable
CREATE TABLE `lots` (
    `id` VARCHAR(191) NOT NULL,
    `country` ENUM('BR', 'EC', 'CO') NOT NULL,
    `farm` VARCHAR(191) NOT NULL,
    `warehouse` VARCHAR(191) NOT NULL,
    `storedAt` DATETIME(3) NOT NULL,
    `status` ENUM('CONFORME', 'EN_ALERTE', 'PERIME') NOT NULL DEFAULT 'CONFORME',
    `harvestDate` DATETIME(3) NULL,
    `qualityGrade` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lots_storedAt_idx`(`storedAt`),
    UNIQUE INDEX `lots_id_country_key`(`id`, `country`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
