-- CreateTable
CREATE TABLE `measurements` (
    `id` VARCHAR(191) NOT NULL,
    `country` ENUM('BR', 'EC', 'CO') NOT NULL,
    `warehouse` VARCHAR(191) NOT NULL,
    `temperatureCelsius` DOUBLE NOT NULL,
    `humidityPercent` DOUBLE NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `measurements_warehouse_recordedAt_idx`(`warehouse`, `recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
