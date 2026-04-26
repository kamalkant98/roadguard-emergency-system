CREATE TABLE `admins` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL DEFAULT (UUID()),
    `role_id` TINYINT UNSIGNED NOT NULL DEFAULT 3,
    
    -- Basic Info
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone_number` VARCHAR(15) DEFAULT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `profile_picture` TEXT DEFAULT NULL,
    
    -- Authentication
    `password_hash` VARCHAR(255) NOT NULL, -- Strong password for web login
    `two_factor_secret` VARCHAR(255) DEFAULT NULL, -- For 2FA
    `is_2fa_enabled` BOOLEAN DEFAULT FALSE,
    
    -- Admin Level
    `admin_level` ENUM('super', 'manager', 'support', 'finance') DEFAULT 'support',
    
    -- Permissions (if fine-grained control needed)
    `permissions` JSON DEFAULT NULL, -- Custom permissions override
    
    -- Account Status
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_blocked` BOOLEAN DEFAULT FALSE,
    `blocked_reason` TEXT DEFAULT NULL,
    `last_login_ip` VARCHAR(45) DEFAULT NULL,
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    
    -- Audit
    `created_by` BIGINT UNSIGNED DEFAULT NULL, -- Super admin who created
    `last_password_change` TIMESTAMP NULL DEFAULT NULL,
    
    -- Timestamps
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_uuid` (`uuid`),
    UNIQUE KEY `idx_username` (`username`),
    KEY `idx_role` (`role_id`),
    KEY `idx_admin_level` (`admin_level`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;