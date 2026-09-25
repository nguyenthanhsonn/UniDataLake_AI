-- UniLake AI V1.0 - Admissions Dataset Schema V1
-- DDL PostgreSQL cho các bảng Admissions của DB nguồn, bám đúng docs/data-schema/unilake-db.dbml.
-- Bổ sung CHECK từ note trong DBML và luật trong admissions_v1.schema.json.
-- Chạy sau hr_v1.sql (department). FK tới student (Academic) tạo ở cuối file, chạy sau academic_v1.sql.

CREATE TABLE IF NOT EXISTS admission_year (
    admission_year_id   SERIAL PRIMARY KEY,
    year_label          VARCHAR(9)   NOT NULL UNIQUE CHECK (year_label ~ '^[0-9]{4}-[0-9]{4}$'),
    start_date          DATE         NOT NULL,
    end_date            DATE         NOT NULL,
    CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS major (
    major_id            SERIAL PRIMARY KEY,
    major_code          VARCHAR(20)  NOT NULL UNIQUE,
    major_name          VARCHAR(150) NOT NULL,
    department_id       INT          REFERENCES department (department_id)
);

CREATE TABLE IF NOT EXISTS program (
    program_id              SERIAL PRIMARY KEY,
    program_code            VARCHAR(20)   NOT NULL UNIQUE,
    program_name            VARCHAR(200)  NOT NULL,
    major_id                INT           NOT NULL REFERENCES major (major_id),
    degree_level            VARCHAR(30)   NOT NULL CHECK (degree_level IN ('Bachelor', 'Engineer', 'Master')),
    duration_years          DECIMAL(3,1)  NOT NULL CHECK (duration_years BETWEEN 1 AND 6),
    tuition_fee_per_credit  DECIMAL(12,2) CHECK (tuition_fee_per_credit >= 0)
);

CREATE TABLE IF NOT EXISTS admission_method (
    admission_method_id SERIAL PRIMARY KEY,
    method_code         VARCHAR(20)  NOT NULL UNIQUE,
    method_name         VARCHAR(150) NOT NULL,
    description         TEXT
);

CREATE TABLE IF NOT EXISTS applicant (
    applicant_id        BIGSERIAL PRIMARY KEY,
    national_id         VARCHAR(20)  NOT NULL UNIQUE,
    full_name           VARCHAR(150) NOT NULL,
    date_of_birth       DATE         NOT NULL,
    gender              VARCHAR(10)  NOT NULL CHECK (gender IN ('Male', 'Female')),
    phone               VARCHAR(20),
    email               VARCHAR(150),
    high_school_name    VARCHAR(200),
    province            VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS admission (
    admission_id        BIGSERIAL PRIMARY KEY,
    applicant_id        BIGINT       NOT NULL REFERENCES applicant (applicant_id),
    program_id          INT          NOT NULL REFERENCES program (program_id),
    admission_method_id INT          NOT NULL REFERENCES admission_method (admission_method_id),
    admission_year_id   INT          NOT NULL REFERENCES admission_year (admission_year_id),
    application_date    DATE         NOT NULL,
    admission_score     DECIMAL(5,2) CHECK (admission_score BETWEEN 0 AND 30),
    admission_status    VARCHAR(20)  NOT NULL
        CHECK (admission_status IN ('Applied', 'Accepted', 'Rejected', 'Waitlisted')),
    UNIQUE (applicant_id, program_id, admission_year_id, admission_method_id)
);

CREATE TABLE IF NOT EXISTS enrollment (
    enrollment_id       BIGSERIAL PRIMARY KEY,
    admission_id        BIGINT       NOT NULL UNIQUE REFERENCES admission (admission_id),
    student_id          BIGINT       UNIQUE,
    enrollment_date     DATE         NOT NULL,
    enrollment_status   VARCHAR(20)  NOT NULL
        CHECK (enrollment_status IN ('Enrolled', 'Deferred', 'Cancelled'))
);

CREATE INDEX IF NOT EXISTS ix_admission_year_program ON admission (admission_year_id, program_id);
CREATE INDEX IF NOT EXISTS ix_admission_method       ON admission (admission_method_id);
CREATE INDEX IF NOT EXISTS ix_program_major          ON program (major_id);

-- Chạy sau academic_v1.sql (bảng student):
-- ALTER TABLE enrollment ADD CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES student (student_id);
