CREATE TABLE `mechanic_location_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `mechanic_id` BIGINT UNSIGNED NOT NULL,
    `latitude` DECIMAL(10,8) NOT NULL,
    `longitude` DECIMAL(11,8) NOT NULL,
    `speed_kmh` DECIMAL(5,2) DEFAULT NULL,
    `accuracy_meters` INT DEFAULT NULL,
    `recorded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_mechanic_time` (`mechanic_id`, `recorded_at`),
    FOREIGN KEY (`mechanic_id`) REFERENCES `mechanics`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;