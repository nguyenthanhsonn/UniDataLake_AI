-- =============================================================================
-- UniLake AI - App Users & User-Roles Seed Data
-- Default Password for all seeded users: "Password@123"
-- Password Hash algorithm: PBKDF2-HMAC-SHA256 (compatible with app.core.security)
-- =============================================================================

-- 1. Insert App Users
INSERT INTO app.app_user (username, password_hash, employee_id, is_active, created_at) VALUES
('admin',       'pbkdf2_sha256$54j20uXDDrH8EjRhaS54Cw$cNs1S4SC2nylW_QW3oZ0SZZovVdy2YhSULe_y3IJdvI', NULL, TRUE, NOW()),  -- role ADMIN
('dataadmin',   'pbkdf2_sha256$54j20uXDDrH8EjRhaS54Cw$cNs1S4SC2nylW_QW3oZ0SZZovVdy2YhSULe_y3IJdvI', NULL, TRUE, NOW()),  -- role DATA_ADMIN
('analyst',     'pbkdf2_sha256$54j20uXDDrH8EjRhaS54Cw$cNs1S4SC2nylW_QW3oZ0SZZovVdy2YhSULe_y3IJdvI', NULL, TRUE, NOW()),  -- role ANALYST
('manager',     'pbkdf2_sha256$54j20uXDDrH8EjRhaS54Cw$cNs1S4SC2nylW_QW3oZ0SZZovVdy2YhSULe_y3IJdvI', NULL, TRUE, NOW()),  -- role MANAGER
('viewer',      'pbkdf2_sha256$54j20uXDDrH8EjRhaS54Cw$cNs1S4SC2nylW_QW3oZ0SZZovVdy2YhSULe_y3IJdvI', NULL, TRUE, NOW())   -- role VIEWER
ON CONFLICT (username)
DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active;

-- 2. Map Users to Roles (user_role table)

-- admin -> ADMIN & SUPER_ADMIN
INSERT INTO app.user_role (app_user_id, role_id)
SELECT u.app_user_id, r.role_id
FROM app.app_user u, app.role r
WHERE u.username = 'admin' AND r.role_code IN ('ADMIN', 'SUPER_ADMIN')
ON CONFLICT (app_user_id, role_id) DO NOTHING;

-- dataadmin -> DATA_ADMIN & DATA_ENGINEER
INSERT INTO app.user_role (app_user_id, role_id)
SELECT u.app_user_id, r.role_id
FROM app.app_user u, app.role r
WHERE u.username = 'dataadmin' AND r.role_code IN ('DATA_ADMIN', 'DATA_ENGINEER', 'DATA_GOVERNANCE')
ON CONFLICT (app_user_id, role_id) DO NOTHING;

-- analyst -> ANALYST & DATA_ANALYST
INSERT INTO app.user_role (app_user_id, role_id)
SELECT u.app_user_id, r.role_id
FROM app.app_user u, app.role r
WHERE u.username = 'analyst' AND r.role_code IN ('ANALYST', 'DATA_ANALYST')
ON CONFLICT (app_user_id, role_id) DO NOTHING;

-- manager -> MANAGER & ACADEMIC_ADMIN
INSERT INTO app.user_role (app_user_id, role_id)
SELECT u.app_user_id, r.role_id
FROM app.app_user u, app.role r
WHERE u.username = 'manager' AND r.role_code IN ('MANAGER', 'ACADEMIC_ADMIN')
ON CONFLICT (app_user_id, role_id) DO NOTHING;

-- viewer -> VIEWER & USER
INSERT INTO app.user_role (app_user_id, role_id)
SELECT u.app_user_id, r.role_id
FROM app.app_user u, app.role r
WHERE u.username = 'viewer' AND r.role_code IN ('VIEWER', 'USER')
ON CONFLICT (app_user_id, role_id) DO NOTHING;
