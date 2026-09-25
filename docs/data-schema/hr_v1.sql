-- UniLake AI V1.0 - Human Resources Dataset Schema V1
-- DDL PostgreSQL cho các bảng HR của DB nguồn, bám đúng docs/data-schema/unilake-db.dbml.
-- Bổ sung CHECK từ note trong DBML và luật trong hr_v1.schema.json.
-- Thứ tự chạy DDL: hr_v1.sql -> admissions_v1.sql -> academic_v1.sql.

CREATE TABLE IF NOT EXISTS department (
    department_id           SERIAL PRIMARY KEY,
    department_code         VARCHAR(20)  NOT NULL UNIQUE,
    department_name         VARCHAR(150) NOT NULL,
    parent_department_id    INT          REFERENCES department (department_id),
    CHECK (parent_department_id IS DISTINCT FROM department_id)
);

CREATE TABLE IF NOT EXISTS position (
    position_id         SERIAL PRIMARY KEY,
    position_code       VARCHAR(20)  NOT NULL UNIQUE,
    position_name       VARCHAR(100) NOT NULL,
    position_level      VARCHAR(30)  CHECK (position_level IN ('Leadership', 'Management', 'Staff'))
);

CREATE TABLE IF NOT EXISTS qualification (
    qualification_id    SERIAL PRIMARY KEY,
    qualification_name  VARCHAR(150) NOT NULL UNIQUE,
    qualification_type  VARCHAR(30)  NOT NULL CHECK (qualification_type IN ('Degree', 'Certificate'))
);

CREATE TABLE IF NOT EXISTS employee (
    employee_id         BIGSERIAL PRIMARY KEY,
    employee_code       VARCHAR(20)  NOT NULL UNIQUE,
    full_name           VARCHAR(150) NOT NULL,
    date_of_birth       DATE         NOT NULL,
    gender              VARCHAR(10)  NOT NULL CHECK (gender IN ('Male', 'Female')),
    email               VARCHAR(150) UNIQUE,
    phone               VARCHAR(20),
    hire_date           DATE         NOT NULL,
    employee_status     VARCHAR(20)  NOT NULL
        CHECK (employee_status IN ('Active', 'Resigned', 'Retired')),
    CHECK (hire_date >= date_of_birth + INTERVAL '18 years')
);

CREATE TABLE IF NOT EXISTS lecturer (
    lecturer_id         BIGINT       PRIMARY KEY REFERENCES employee (employee_id),
    academic_rank       VARCHAR(50)
        CHECK (academic_rank IN ('M.Sc.', 'Ph.D.', 'Assoc. Prof.', 'Prof.')),
    research_field      VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS employee_qualification (
    employee_id         BIGINT       NOT NULL REFERENCES employee (employee_id),
    qualification_id    INT          NOT NULL REFERENCES qualification (qualification_id),
    institution         VARCHAR(200),
    year_obtained       INT          CHECK (year_obtained BETWEEN 1960 AND 2100),
    PRIMARY KEY (employee_id, qualification_id)
);

CREATE TABLE IF NOT EXISTS assignment (
    assignment_id       BIGSERIAL PRIMARY KEY,
    employee_id         BIGINT       NOT NULL REFERENCES employee (employee_id),
    department_id       INT          NOT NULL REFERENCES department (department_id),
    position_id         INT          NOT NULL REFERENCES position (position_id),
    start_date          DATE         NOT NULL,
    end_date            DATE,
    is_primary          BOOLEAN      NOT NULL DEFAULT TRUE,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS ix_department_parent   ON department (parent_department_id);
CREATE INDEX IF NOT EXISTS ix_assignment_employee ON assignment (employee_id, start_date);
CREATE INDEX IF NOT EXISTS ix_assignment_dept_pos ON assignment (department_id, position_id);

-- Mỗi nhân sự chỉ có một vị trí chính đang hiệu lực.
CREATE UNIQUE INDEX IF NOT EXISTS ux_assignment_one_open_primary
    ON assignment (employee_id) WHERE is_primary AND end_date IS NULL;
