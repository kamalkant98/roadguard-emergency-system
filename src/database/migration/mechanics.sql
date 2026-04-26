CREATE TABLE `mechanics` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL DEFAULT (UUID()),
    `role_id` TINYINT UNSIGNED NOT NULL DEFAULT 2,
    
    -- Basic Info
    `phone_number` VARCHAR(15) NOT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `profile_picture` TEXT DEFAULT NULL,
    
    -- Authentication
    `otp_code` VARCHAR(6) DEFAULT NULL,
    `otp_expires_at` TIMESTAMP NULL DEFAULT NULL,
    `is_phone_verified` BOOLEAN DEFAULT FALSE,
    `password_hash` VARCHAR(255) DEFAULT NULL, -- For web dashboard login
    
    -- Professional Details
    `mechanic_license_number` VARCHAR(50) UNIQUE NOT NULL,
    `experience_years` INT DEFAULT 0,
    `specialization` VARCHAR(100) DEFAULT NULL, -- Engine, Electrical, Body, etc.
    `service_types` JSON DEFAULT NULL, -- ["towing", "flat_tire", "battery", "fuel"]
    
    -- Vehicle Info (Tow truck / Service van)
    `vehicle_number` VARCHAR(20) NOT NULL,
    `vehicle_model` VARCHAR(100) NOT NULL,
    `vehicle_type` ENUM('flatbed', 'crane', 'van', 'motorcycle') DEFAULT 'van',
    `vehicle_color` VARCHAR(30) DEFAULT NULL,
    
    -- Location & Availability
    `current_latitude` DECIMAL(10,8) DEFAULT NULL,
    `current_longitude` DECIMAL(11,8) DEFAULT NULL,
    `location_updated_at` TIMESTAMP NULL DEFAULT NULL,
    `is_available` BOOLEAN DEFAULT FALSE, -- On/Off duty
    `service_radius_km` INT DEFAULT 10, -- Max distance to accept jobs
    `base_location_latitude` DECIMAL(10,8) DEFAULT NULL, -- Home garage location
    `base_location_longitude` DECIMAL(11,8) DEFAULT NULL,
    
    -- KYC & Verification
    `is_kyc_verified` BOOLEAN DEFAULT FALSE,
    `kyc_verified_at` TIMESTAMP NULL DEFAULT NULL,
    `kyc_verified_by` BIGINT UNSIGNED DEFAULT NULL, -- Admin ID
    `aadhar_number` VARCHAR(20) DEFAULT NULL, -- Encrypted in production
    `pan_number` VARCHAR(10) DEFAULT NULL,
    `bank_account_number` VARCHAR(50) DEFAULT NULL,
    `ifsc_code` VARCHAR(15) DEFAULT NULL,
    `account_holder_name` VARCHAR(100) DEFAULT NULL,
    
    -- Document URLs
    `license_document_url` TEXT DEFAULT NULL,
    `aadhar_document_url` TEXT DEFAULT NULL,
    `vehicle_rc_url` TEXT DEFAULT NULL,
    `insurance_document_url` TEXT DEFAULT NULL,
    
    -- Performance Metrics
    `total_jobs_completed` INT DEFAULT 0,
    `total_jobs_cancelled` INT DEFAULT 0,
    `average_rating` DECIMAL(3,2) DEFAULT NULL, -- 1-5
    `total_ratings` INT DEFAULT 0,
    `average_response_time_minutes` INT DEFAULT NULL, -- Avg time to accept job
    `average_arrival_time_minutes` INT DEFAULT NULL, -- Avg time to reach customer
    `cancellation_rate` DECIMAL(5,2) DEFAULT NULL,
    
    -- Earnings
    `total_earnings` DECIMAL(12,2) DEFAULT 0.00,
    `pending_earnings` DECIMAL(12,2) DEFAULT 0.00,
    `last_payout_date` DATE DEFAULT NULL,
    
    -- Account Status
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_blocked` BOOLEAN DEFAULT FALSE,
    `blocked_reason` TEXT DEFAULT NULL,
    `is_online` BOOLEAN DEFAULT FALSE, -- Real-time online status
    
    -- Push Notifications
    `fcm_token` TEXT DEFAULT NULL,
    
    -- Preferences
    `auto_accept_enabled` BOOLEAN DEFAULT FALSE, -- Auto accept nearby jobs
    `language` VARCHAR(10) DEFAULT 'en',
    
    -- Timestamps
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    `last_job_completed_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` BIGINT UNSIGNED DEFAULT NULL, -- Admin who added this mechanic
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_phone` (`phone_number`),
    UNIQUE KEY `idx_uuid` (`uuid`),
    UNIQUE KEY `idx_email` (`email`),
    UNIQUE KEY `idx_license` (`mechanic_license_number`),
    UNIQUE KEY `idx_vehicle_number` (`vehicle_number`),
    KEY `idx_role` (`role_id`),
    KEY `idx_availability` (`is_available`, `is_online`, `is_kyc_verified`),
    KEY `idx_location` (`current_latitude`, `current_longitude`),
    KEY `idx_rating` (`average_rating`),
    KEY `idx_completed_jobs` (`total_jobs_completed`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;