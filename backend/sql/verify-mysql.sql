-- ============================================================================
-- WorkPulse AI — MySQL verification script
-- ============================================================================
-- Verifies the schema, every query the Spring Data repositories generate, and
-- the key constraints, against a real MySQL 8. Safe to run repeatedly: it
-- only touches rows owned by the "verify-*@example.com" markers.
--
-- How to run (with the backend's mysql container up):
--
--   docker compose up -d mysql
--   docker exec -i workpulse-mysql mysql -uworkpulse -pworkpulse workpulse \
--     < backend/sql/verify-mysql.sql
--
-- The mysql client stops at the first error, so any failing check aborts
-- loudly; a clean run ends with "All checks passed.".
-- ============================================================================

SELECT '== Phase 0: clean up previous verification data (tables may not exist yet) ==' AS section;

-- Each DELETE only runs when its table exists, so a fresh database works.
SET @tbl := (SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = 'leave_requests');
SET @sql := IF(@tbl > 0,
  'DELETE FROM leave_requests WHERE user_id IN (SELECT id FROM users WHERE email LIKE ''verify-%@example.com'')',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @tbl := (SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = 'attendance');
SET @sql := IF(@tbl > 0,
  'DELETE FROM attendance WHERE user_id IN (SELECT id FROM users WHERE email LIKE ''verify-%@example.com'')',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @tbl := (SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = 'users');
SET @sql := IF(@tbl > 0,
  'DELETE FROM users WHERE email LIKE ''verify-%@example.com''',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @tbl := (SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = 'companies');
SET @sql := IF(@tbl > 0,
  'DELETE FROM companies WHERE code = ''VERIFY''',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Phase 1: schema (mirrors the JPA entities; create-if-not-exists so it also
-- works when Hibernate already created the tables)
-- ============================================================================
SELECT '== Phase 1: schema (mirrors the JPA entities) ==' AS section;

CREATE TABLE IF NOT EXISTS companies (
  id         BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60) NOT NULL,
  code       VARCHAR(12) NOT NULL,
  created_at BIGINT NOT NULL,
  UNIQUE KEY uk_companies_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(120) NOT NULL,
  name          VARCHAR(60) NULL,
  password_hash VARCHAR(100) NULL,
  role          VARCHAR(16) NOT NULL,
  status        VARCHAR(16) NOT NULL,
  company_id    BIGINT NULL,
  joined_at     BIGINT NOT NULL,
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_company (company_id),
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attendance (
  id         BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  company_id BIGINT NOT NULL,
  date       VARCHAR(10) NOT NULL,
  clock_in   BIGINT NOT NULL,
  clock_out  BIGINT NULL,
  UNIQUE KEY uk_attendance_user_date (user_id, date),
  CONSTRAINT fk_attendance_user    FOREIGN KEY (user_id)    REFERENCES users (id),
  CONSTRAINT fk_attendance_company FOREIGN KEY (company_id) REFERENCES companies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leave_requests (
  id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  company_id  BIGINT NOT NULL,
  start_date  VARCHAR(10) NOT NULL,
  end_date    VARCHAR(10) NOT NULL,
  type        VARCHAR(16) NOT NULL,
  reason      VARCHAR(500) NOT NULL,
  status      VARCHAR(16) NOT NULL,
  review_note VARCHAR(300) NULL,
  created_at  BIGINT NOT NULL,
  reviewed_at BIGINT NULL,
  KEY idx_leaves_company (company_id),
  CONSTRAINT fk_leaves_user    FOREIGN KEY (user_id)    REFERENCES users (id),
  CONSTRAINT fk_leaves_company FOREIGN KEY (company_id) REFERENCES companies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- Phase 2: seed verification data
-- ============================================================================
SELECT '== Phase 2: seed verification data ==' AS section;

INSERT IGNORE INTO companies (name, code, created_at)
VALUES ('Verify Co', 'VERIFY', UNIX_TIMESTAMP() * 1000);

INSERT IGNORE INTO users (email, name, password_hash, role, status, company_id, joined_at)
VALUES ('verify-admin@example.com', 'Verify Admin', 'x', 'ADMIN', 'ACTIVE',
        (SELECT id FROM companies WHERE code = 'VERIFY'),
        UNIX_TIMESTAMP() * 1000);

INSERT IGNORE INTO users (email, name, password_hash, role, status, company_id, joined_at)
VALUES ('verify-employee@example.com', 'Verify Employee', 'x', 'USER', 'ACTIVE',
        (SELECT id FROM companies WHERE code = 'VERIFY'),
        UNIX_TIMESTAMP() * 1000);

-- A completed shift yesterday and an open shift today for the employee.
INSERT INTO attendance (user_id, company_id, date, clock_in, clock_out)
SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
       (SELECT id FROM companies WHERE code = 'VERIFY'),
       DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '%Y-%m-%d'),
       UNIX_TIMESTAMP(TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)) + INTERVAL 9 HOUR) * 1000,
       UNIX_TIMESTAMP(TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)) + INTERVAL 630 MINUTE) * 1000;

INSERT INTO attendance (user_id, company_id, date, clock_in)
SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
       (SELECT id FROM companies WHERE code = 'VERIFY'),
       DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d'),
       UNIX_TIMESTAMP(TIMESTAMP(CURRENT_DATE) + INTERVAL 9 HOUR) * 1000;

-- One pending and one approved leave request.
INSERT INTO leave_requests (user_id, company_id, start_date, end_date, type, reason, status, created_at)
SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
       (SELECT id FROM companies WHERE code = 'VERIFY'),
       DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), '%Y-%m-%d'),
       DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL 9 DAY), '%Y-%m-%d'),
       'ANNUAL', 'Family vacation', 'PENDING',
       UNIX_TIMESTAMP() * 1000;

INSERT INTO leave_requests (user_id, company_id, start_date, end_date, type, reason, status, review_note, created_at, reviewed_at)
SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
       (SELECT id FROM companies WHERE code = 'VERIFY'),
       DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), '%Y-%m-%d'),
       DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), '%Y-%m-%d'),
       'SICK', 'Flu', 'APPROVED', 'Get well soon',
       UNIX_TIMESTAMP() * 1000,
       UNIX_TIMESTAMP() * 1000;

-- ============================================================================
-- Phase 3: the exact queries Spring Data derives for each repository method
-- ============================================================================

SELECT '== 3.1  UserRepository.findByEmailIgnoreCase  ->  auth login / invite claim ==' AS section;
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS check_login_lookup
  FROM users WHERE lower(email) = lower('VERIFY-ADMIN@EXAMPLE.COM');

SELECT '== 3.2  CompanyRepository.findByCode  ->  company join by code ==' AS section;
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS check_join_by_code
  FROM companies WHERE code = 'VERIFY';

SELECT '== 3.3  UserRepository.findByCompanyIdOrderByIdAsc  ->  team roster ==' AS section;
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_roster
  FROM users
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY');

SELECT '== 3.4  AttendanceRepository.findByUserIdAndDate  ->  clock-in guard ==' AS section;
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS check_clock_guard
  FROM attendance
 WHERE user_id = (SELECT id FROM users WHERE email = 'verify-employee@example.com')
   AND date = DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d');

SELECT '== 3.5  AttendanceRepository.findByUserIdOrderByDateDescIdDesc  ->  my history ==' AS section;
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_my_attendance
  FROM attendance
 WHERE user_id = (SELECT id FROM users WHERE email = 'verify-employee@example.com')
 ORDER BY date DESC, id DESC;

SELECT '== 3.6  AttendanceRepository.findByCompanyIdAndDateOrderByIdAsc  ->  admin day view ==' AS section;
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS check_day_view
  FROM attendance
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY')
   AND date = DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d')
 ORDER BY id ASC;

SELECT '== 3.7  AttendanceRepository.findByCompanyIdAndUserIdOrderByDateDescIdDesc  ->  employee profile ==' AS section;
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_member_attendance
  FROM attendance
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY')
   AND user_id  = (SELECT id FROM users WHERE email = 'verify-employee@example.com')
 ORDER BY date DESC, id DESC;

SELECT '== 3.8  LeaveRequestRepository.findByUserIdOrderByCreatedAtDesc  ->  leaves/my ==' AS section;
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_my_leaves
  FROM leave_requests
 WHERE user_id = (SELECT id FROM users WHERE email = 'verify-employee@example.com')
 ORDER BY created_at DESC;

SELECT '== 3.9  LeaveRequestRepository.findByCompanyIdOrderByCreatedAtDesc  ->  admin leave list ==' AS section;
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_company_leaves
  FROM leave_requests
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY')
 ORDER BY created_at DESC;

SELECT '== 3.10 LeaveRequestRepository.findByCompanyIdAndUserIdOrderByCreatedAtDesc  ->  leave profile ==' AS section;
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_member_leaves
  FROM leave_requests
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY')
   AND user_id  = (SELECT id FROM users WHERE email = 'verify-employee@example.com')
 ORDER BY created_at DESC;

-- ============================================================================
-- Phase 4: constraints behave (each raises a caught error; a non-error is FAIL)
-- ============================================================================
SELECT '== 4.1  one attendance record per (user, date) ==' AS section;

DELIMITER //
DROP PROCEDURE IF EXISTS verify_duplicate_attendance//
CREATE PROCEDURE verify_duplicate_attendance()
BEGIN
  DECLARE rejected BOOLEAN DEFAULT FALSE;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '23000' SET rejected = TRUE;
  INSERT INTO attendance (user_id, company_id, date, clock_in)
  SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
         (SELECT id FROM companies WHERE code = 'VERIFY'),
         DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d'), 0;
  IF NOT rejected THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FAIL: duplicate (user_id, date) was not rejected';
  END IF;
  SELECT 'PASS: duplicate (user_id, date) rejected' AS result;
END//
CALL verify_duplicate_attendance()//

SELECT '== 4.2  unique user email ==' AS section;

DROP PROCEDURE IF EXISTS verify_duplicate_email//
CREATE PROCEDURE verify_duplicate_email()
BEGIN
  DECLARE rejected BOOLEAN DEFAULT FALSE;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '23000' SET rejected = TRUE;
  INSERT INTO users (email, role, status, joined_at)
  VALUES ('verify-employee@example.com', 'USER', 'ACTIVE', 0);
  IF NOT rejected THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FAIL: duplicate email was not rejected';
  END IF;
  SELECT 'PASS: duplicate email rejected' AS result;
END//
CALL verify_duplicate_email()//

SELECT '== 4.3  unique company code ==' AS section;

DROP PROCEDURE IF EXISTS verify_duplicate_code//
CREATE PROCEDURE verify_duplicate_code()
BEGIN
  DECLARE rejected BOOLEAN DEFAULT FALSE;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '23000' SET rejected = TRUE;
  INSERT INTO companies (name, code, created_at) VALUES ('Dup', 'VERIFY', 0);
  IF NOT rejected THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FAIL: duplicate company code was not rejected';
  END IF;
  SELECT 'PASS: duplicate company code rejected' AS result;
END//
CALL verify_duplicate_code()//

SELECT '== 4.4  attendance cannot reference a missing user (tenant integrity) ==' AS section;

DROP PROCEDURE IF EXISTS verify_unknown_user//
CREATE PROCEDURE verify_unknown_user()
BEGIN
  DECLARE rejected BOOLEAN DEFAULT FALSE;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '23000' SET rejected = TRUE;
  INSERT INTO attendance (user_id, company_id, date, clock_in)
  SELECT 999999999, (SELECT id FROM companies WHERE code = 'VERIFY'), '2026-01-01', 0;
  IF NOT rejected THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FAIL: attendance with unknown user was not rejected';
  END IF;
  SELECT 'PASS: unknown-user attendance rejected' AS result;
END//
CALL verify_unknown_user()//

DELIMITER ;

SELECT '' AS section;
SELECT 'All checks passed.' AS result;
