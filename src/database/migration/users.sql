CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL DEFAULT (UUID()),
    `role_id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    
    -- Basic Info
    `phone_number` VARCHAR(15) NOT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `profile_picture` TEXT DEFAULT NULL,
    
    -- Authentication
    `otp_code` VARCHAR(6) DEFAULT NULL,
    `otp_expires_at` TIMESTAMP NULL DEFAULT NULL,
    `is_phone_verified` BOOLEAN DEFAULT FALSE,
    `pin_hash` VARCHAR(255) DEFAULT NULL, -- Optional 4-6 digit PIN
    
    -- Push Notifications
    `fcm_token` TEXT DEFAULT NULL,
    
    -- Emergency Contact
    `emergency_contact_name` VARCHAR(100) DEFAULT NULL,
    `emergency_contact_phone` VARCHAR(15) DEFAULT NULL,
    `emergency_contact_relation` VARCHAR(50) DEFAULT NULL,
    
    -- Saved Locations
    `home_address` TEXT DEFAULT NULL,
    `home_latitude` DECIMAL(10,8) DEFAULT NULL,
    `home_longitude` DECIMAL(11,8) DEFAULT NULL,
    `work_address` TEXT DEFAULT NULL,
    `work_latitude` DECIMAL(10,8) DEFAULT NULL,
    `work_longitude` DECIMAL(11,8) DEFAULT NULL,
    
    -- Current Location (for breakdown requests)
    `current_latitude` DECIMAL(10,8) DEFAULT NULL,
    `current_longitude` DECIMAL(11,8) DEFAULT NULL,
    `location_updated_at` TIMESTAMP NULL DEFAULT NULL,
    
    -- Account Status
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_blocked` BOOLEAN DEFAULT FALSE,
    `blocked_reason` TEXT DEFAULT NULL,
    
    -- Preferences
    `language` VARCHAR(10) DEFAULT 'en',
    `notifications_enabled` BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    `last_seen_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_phone` (`phone_number`),
    UNIQUE KEY `idx_uuid` (`uuid`),
    UNIQUE KEY `idx_email` (`email`),
    KEY `idx_role` (`role_id`),
    KEY `idx_location` (`current_latitude`, `current_longitude`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;