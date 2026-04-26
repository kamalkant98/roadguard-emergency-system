CREATE TABLE `roles` (
    `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(20) NOT NULL UNIQUE,
    `slug` VARCHAR(20) NOT NULL UNIQUE,
    `description` TEXT DEFAULT NULL,
    `level` TINYINT NOT NULL DEFAULT 0, -- 1=User, 2=Mechanic, 3=Admin
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert 3 roles
INSERT INTO `roles` (`name`, `slug`, `description`, `level`) VALUES
('User', 'user', 'Regular app user who requests breakdown service', 1),
('Mechanic', 'mechanic', 'Service provider / tow truck driver', 2),
('Admin', 'admin', 'System administrator with full access', 3);