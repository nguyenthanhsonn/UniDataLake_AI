-- UniLake AI V1.0 - Academic/Training Dataset Schema V1
-- DDL PostgreSQL cho các bảng Academic của DB nguồn, bám đúng docs/data-schema/unilake-db.dbml.
-- Bổ sung CHECK từ note trong DBML và luật trong academic_v1.schema.json.
-- Chạy sau hr_v1.sql (lecturer) và admissions_v1.sql (program, major, admission_year, applicant).

CREATE TABLE IF NOT EXISTS student (
    student_id          BIGSERIAL PRIMARY KEY,
    student_code        VARCHAR(20)  NOT NULL UNIQUE,
    applicant_id        BIGINT       UNIQUE REFERENCES applicant (applicant_id),
    full_name           VARCHAR(150) NOT NULL,
    date_of_birth       DATE         NOT NULL,
    gender              VARCHAR(10)  NOT NULL CHECK (gender IN ('Male', 'Female')),
    program_id          INT          NOT NULL REFERENCES program (program_id),
    admission_year_id   INT          NOT NULL REFERENCES admission_year (admission_year_id),
    student_status      VARCHAR(20)  NOT NULL
        CHECK (student_status IN ('Active', 'Graduated', 'Suspended', 'Dropped'))
);

CREATE TABLE IF NOT EXISTS semester (
    semester_id         SERIAL PRIMARY KEY,
    semester_code       VARCHAR(20)  NOT NULL UNIQUE CHECK (semester_code ~ '^[0-9]{4}-[1-3]$'),
    academic_year       VARCHAR(9)   NOT NULL CHECK (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
    start_date          DATE         NOT NULL,
    end_date            DATE         NOT NULL,
    CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS course (
    course_id           SERIAL PRIMARY KEY,
    course_code         VARCHAR(20)  NOT NULL UNIQUE,
    course_name         VARCHAR(200) NOT NULL,
    credit_hours        INT          NOT NULL CHECK (credit_hours BETWEEN 1 AND 10),
    major_id            INT          REFERENCES major (major_id)
);

CREATE TABLE IF NOT EXISTS class (
    class_id            BIGSERIAL PRIMARY KEY,
    class_code          VARCHAR(30)  NOT NULL UNIQUE,
    course_id           INT          NOT NULL REFERENCES course (course_id),
    semester_id         INT          NOT NULL REFERENCES semester (semester_id),
    lecturer_id         BIGINT       NOT NULL REFERENCES lecturer (lecturer_id),
    max_capacity        INT          NOT NULL CHECK (max_capacity BETWEEN 1 AND 200),
    room                VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS enrollment_grade (
    student_id          BIGINT       NOT NULL REFERENCES student (student_id),
    class_id            BIGINT       NOT NULL REFERENCES class (class_id),
    midterm_score       DECIMAL(4,2) CHECK (midterm_score BETWEEN 0 AND 10),
    final_score         DECIMAL(4,2) CHECK (final_score BETWEEN 0 AND 10),
    grade_value         DECIMAL(4,2) CHECK (grade_value BETWEEN 0 AND 10),
    letter_grade        VARCHAR(2)
        CHECK (letter_grade IN ('A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F')),
    registration_date   DATE         NOT NULL,
    PRIMARY KEY (student_id, class_id),
    CHECK ((grade_value IS NULL) = (letter_grade IS NULL))
);

CREATE INDEX IF NOT EXISTS ix_student_program_year ON student (program_id, admission_year_id);
CREATE INDEX IF NOT EXISTS ix_class_semester       ON class (semester_id);
CREATE INDEX IF NOT EXISTS ix_class_course         ON class (course_id);
CREATE INDEX IF NOT EXISTS ix_grade_class          ON enrollment_grade (class_id);
