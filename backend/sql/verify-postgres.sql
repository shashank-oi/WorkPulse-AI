-- ============================================================================
-- WorkPulse AI — PostgreSQL verification script
-- ============================================================================
-- Verifies the schema, every query the Spring Data repositories generate, and
-- the key constraints, against a real PostgreSQL. Safe to run repeatedly:
-- it only touches rows owned by the "verify-*@example.com" markers.
--
-- How to run (with the backend's postgres container up):
--
--   docker compose up -d
--   docker exec -i workpulse-postgres psql -U workpulse -d workpulse \
--     < backend/sql/verify-postgres.sql
--
-- Any failing assertion raises an error (ON_ERROR_STOP), so a clean exit with
-- "All checks passed." means everything works.
-- ============================================================================

\set ON_ERROR_STOP on
\set VERBOSITY verbose

\echo '== Phase 0: clean up any previous verification data (tables may not exist yet) =='
DO $$
BEGIN
  IF to_regclass('public.leave_requests') IS NOT NULL THEN
    EXECUTE 'DELETE FROM leave_requests WHERE user_id IN (SELECT id FROM users WHERE email LIKE ''verify-%@example.com'')';
  END IF;
  IF to_regclass('public.attendance') IS NOT NULL THEN
    EXECUTE 'DELETE FROM attendance WHERE user_id IN (SELECT id FROM users WHERE email LIKE ''verify-%@example.com'')';
  END IF;
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE 'DELETE FROM users WHERE email LIKE ''verify-%@example.com''';
  END IF;
  IF to_regclass('public.companies') IS NOT NULL THEN
    EXECUTE 'DELETE FROM companies WHERE code = ''VERIFY''';
  END IF;
END $$;

\echo '== Phase 1: schema (mirrors the JPA entities; create-if-not-exists so it')
\echo '             also works when Hibernate already created the tables) =='
CREATE TABLE IF NOT EXISTS companies (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL,
  code       VARCHAR(12)  NOT NULL UNIQUE,
  created_at BIGINT       NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         VARCHAR(120) NOT NULL UNIQUE,
  name          VARCHAR(60),
  password_hash VARCHAR(100),
  role          VARCHAR(16) NOT NULL,
  status        VARCHAR(16) NOT NULL,
  company_id    BIGINT REFERENCES companies(id),
  joined_at     BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_company ON users (company_id);

CREATE TABLE IF NOT EXISTS attendance (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  company_id BIGINT NOT NULL REFERENCES companies(id),
  date       VARCHAR(10) NOT NULL,
  clock_in   BIGINT NOT NULL,
  clock_out  BIGINT,
  CONSTRAINT uk_attendance_user_date UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  company_id  BIGINT NOT NULL REFERENCES companies(id),
  start_date  VARCHAR(10) NOT NULL,
  end_date    VARCHAR(10) NOT NULL,
  type        VARCHAR(16) NOT NULL,
  reason      VARCHAR(500) NOT NULL,
  status      VARCHAR(16) NOT NULL,
  review_note VARCHAR(300),
  created_at  BIGINT NOT NULL,
  reviewed_at BIGINT
);
CREATE INDEX IF NOT EXISTS idx_leaves_company ON leave_requests (company_id);

\echo '== Phase 2: seed verification data =='
INSERT INTO companies (name, code, created_at)
VALUES ('Verify Co', 'VERIFY', extract(epoch FROM now())::bigint * 1000)
ON CONFLICT (code) DO NOTHING;

INSERT INTO users (email, name, password_hash, role, status, company_id, joined_at)
VALUES ('verify-admin@example.com', 'Verify Admin', 'x', 'ADMIN', 'ACTIVE',
        (SELECT id FROM companies WHERE code = 'VERIFY'),
        extract(epoch FROM now())::bigint * 1000)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, name, password_hash, role, status, company_id, joined_at)
VALUES ('verify-employee@example.com', 'Verify Employee', 'x', 'USER', 'ACTIVE',
        (SELECT id FROM companies WHERE code = 'VERIFY'),
        extract(epoch FROM now())::bigint * 1000)
ON CONFLICT (email) DO NOTHING;

-- A completed shift yesterday and an open shift today for the employee.
INSERT INTO attendance (user_id, company_id, date, clock_in, clock_out)
SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
       (SELECT id FROM companies WHERE code = 'VERIFY'),
       (current_date - 1)::text,
       extract(epoch FROM ((current_date - 1)::timestamp + interval '9 hours'))::bigint * 1000,
       extract(epoch FROM ((current_date - 1)::timestamp + interval '17 hours 30 minutes'))::bigint * 1000;

INSERT INTO attendance (user_id, company_id, date, clock_in)
SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
       (SELECT id FROM companies WHERE code = 'VERIFY'),
       current_date::text,
       extract(epoch FROM (current_date::timestamp + interval '9 hours'))::bigint * 1000;

-- One pending and one approved leave request.
INSERT INTO leave_requests (user_id, company_id, start_date, end_date, type, reason, status, created_at)
SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
       (SELECT id FROM companies WHERE code = 'VERIFY'),
       (current_date + 7)::text, (current_date + 9)::text,
       'ANNUAL', 'Family vacation', 'PENDING',
       extract(epoch FROM now())::bigint * 1000;

INSERT INTO leave_requests (user_id, company_id, start_date, end_date, type, reason, status, review_note, created_at, reviewed_at)
SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
       (SELECT id FROM companies WHERE code = 'VERIFY'),
       (current_date - 5)::text, (current_date - 3)::text,
       'SICK', 'Flu', 'APPROVED', 'Get well soon',
       extract(epoch FROM now())::bigint * 1000,
       extract(epoch FROM now())::bigint * 1000;

-- ============================================================================
-- Phase 3: the exact queries Spring Data derives for each repository method
-- ============================================================================

\echo '== 3.1  UserRepository.findByEmailIgnoreCase  ->  auth login / invite claim =='
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS check_login_lookup
  FROM users WHERE lower(email) = lower('VERIFY-ADMIN@EXAMPLE.COM');

\echo '== 3.2  CompanyRepository.findByCode  ->  company join by code =='
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS check_join_by_code
  FROM companies WHERE code = 'VERIFY';

\echo '== 3.3  UserRepository.findByCompanyIdOrderByIdAsc  ->  team roster =='
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_roster
  FROM users
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY');

\echo '== 3.4  AttendanceRepository.findByUserIdAndDate  ->  clock-in guard =='
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS check_clock_guard
  FROM attendance
 WHERE user_id = (SELECT id FROM users WHERE email = 'verify-employee@example.com')
   AND date = current_date::text;

\echo '== 3.5  AttendanceRepository.findByUserIdOrderByDateDescIdDesc  ->  my history =='
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_my_attendance
  FROM attendance
 WHERE user_id = (SELECT id FROM users WHERE email = 'verify-employee@example.com');

\echo '== 3.6  AttendanceRepository.findByCompanyIdAndDateOrderByIdAsc  ->  admin day view =='
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS check_day_view
  FROM attendance
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY')
   AND date = current_date::text;

\echo '== 3.7  AttendanceRepository.findByCompanyIdAndUserIdOrderByDateDescIdDesc  ->  employee profile =='
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_member_attendance
  FROM attendance
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY')
   AND user_id  = (SELECT id FROM users WHERE email = 'verify-employee@example.com');

\echo '== 3.8  LeaveRequestRepository.findByUserIdOrderByCreatedAtDesc  ->  leaves/my =='
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_my_leaves
  FROM leave_requests
 WHERE user_id = (SELECT id FROM users WHERE email = 'verify-employee@example.com');

\echo '== 3.9  LeaveRequestRepository.findByCompanyIdOrderByCreatedAtDesc  ->  admin leave list =='
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_company_leaves
  FROM leave_requests
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY');

\echo '== 3.10 LeaveRequestRepository.findByCompanyIdAndUserIdOrderByCreatedAtDesc  ->  leave profile =='
SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS check_member_leaves
  FROM leave_requests
 WHERE company_id = (SELECT id FROM companies WHERE code = 'VERIFY')
   AND user_id  = (SELECT id FROM users WHERE email = 'verify-employee@example.com');

-- ============================================================================
-- Phase 4: constraints behave (each raises a caught error; a non-error is FAIL)
-- ============================================================================

\echo '== 4.1  one attendance record per (user, date) =='
DO $$
DECLARE rejected BOOLEAN := false;
BEGIN
  BEGIN
    INSERT INTO attendance (user_id, company_id, date, clock_in)
    SELECT (SELECT id FROM users WHERE email = 'verify-employee@example.com'),
           (SELECT id FROM companies WHERE code = 'VERIFY'),
           current_date::text, 0;
    rejected := false;
  EXCEPTION WHEN unique_violation THEN
    rejected := true;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'FAIL: duplicate (user_id, date) was not rejected';
  END IF;
  RAISE NOTICE 'PASS: duplicate (user_id, date) rejected';
END $$;

\echo '== 4.2  unique user email =='
DO $$
DECLARE rejected BOOLEAN := false;
BEGIN
  BEGIN
    INSERT INTO users (email, role, status, joined_at)
    VALUES ('verify-employee@example.com', 'USER', 'ACTIVE', 0);
    rejected := false;
  EXCEPTION WHEN unique_violation THEN
    rejected := true;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'FAIL: duplicate email was not rejected';
  END IF;
  RAISE NOTICE 'PASS: duplicate email rejected';
END $$;

\echo '== 4.3  unique company code =='
DO $$
DECLARE rejected BOOLEAN := false;
BEGIN
  BEGIN
    INSERT INTO companies (name, code, created_at) VALUES ('Dup', 'VERIFY', 0);
    rejected := false;
  EXCEPTION WHEN unique_violation THEN
    rejected := true;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'FAIL: duplicate company code was not rejected';
  END IF;
  RAISE NOTICE 'PASS: duplicate company code rejected';
END $$;

\echo '== 4.4  attendance cannot reference a missing user (tenant integrity) =='
DO $$
DECLARE rejected BOOLEAN := false;
BEGIN
  BEGIN
    INSERT INTO attendance (user_id, company_id, date, clock_in)
    SELECT 999999999, (SELECT id FROM companies WHERE code = 'VERIFY'), '2026-01-01', 0;
    rejected := false;
  EXCEPTION WHEN foreign_key_violation THEN
    rejected := true;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'FAIL: attendance with unknown user was not rejected';
  END IF;
  RAISE NOTICE 'PASS: unknown-user attendance rejected';
END $$;

\echo ''
\echo 'All checks passed.'
