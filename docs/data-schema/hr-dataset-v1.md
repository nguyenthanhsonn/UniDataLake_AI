# Human Resources Dataset Schema V1

| Mục | Giá trị |
|---|---|
| Domain | Human Resources (Nhân sự) |
| Phiên bản | 1.0.0 |
| Nguồn chuẩn | [unilake-db.dbml](unilake-db.dbml): thiết kế DB nguồn của team |
| Phạm vi | Theo proposal: Employee, Lecturer, Department, Position, Qualification, Assignment |
| Dùng cho | Data Ingestion (W3), lớp Bronze → Silver → Gold, NLQ |
| Liên quan | `department` được [Admissions](admissions-dataset-v1.md) (`major`) tham chiếu; `lecturer` được [Academic](academic-dataset-v1.md) (`class`) tham chiếu |

Các file đi kèm:

| File | Vai trò |
|---|---|
| [hr_v1.schema.json](hr_v1.schema.json) | Schema máy đọc: kiểu, null, unique, enum, pattern, FK, quy tắc chức vụ, cột dẫn xuất ở Silver, luật DQ |
| [hr_v1.sql](hr_v1.sql) | DDL PostgreSQL cho 7 bảng HR, chạy **đầu tiên** (trước Admissions, Academic) |
| `data/samples/hr/*.csv` | Dữ liệu mẫu 7 bảng |
| [data/synthetic/generate_hr.py](../../data/synthetic/generate_hr.py) | Sinh lại dữ liệu mẫu HR (chạy trước hai script còn lại) |
| [backend/tests/test_dataset_schemas.py](../../backend/tests/test_dataset_schemas.py) | Kiểm tra chung: khớp DBML, CSV, PK/unique, FK, DDL |
| [backend/tests/test_hr_dataset.py](../../backend/tests/test_hr_dataset.py) | Kiểm tra luật nghiệp vụ HR-DQ-04..12 |

## 1. Entity

| Bảng | Vai trò | Loại |
|---|---|---|
| `department` | Đơn vị tổ chức dạng cây: trường → phòng/ban/khoa → bộ môn | Danh mục |
| `position` | Chức danh, chức vụ | Danh mục |
| `qualification` | Văn bằng, chứng chỉ | Danh mục |
| `employee` | Nhân sự (giảng viên và cán bộ hành chính) | Chính |
| `lecturer` | Thông tin riêng của giảng viên | Kiểu con của `employee` |
| `employee_qualification` | Nhân sự có văn bằng/chứng chỉ nào | Bảng nối N-N |
| `assignment` | Quá trình công tác: ai giữ chức vụ gì ở đơn vị nào, từ khi nào đến khi nào | Lịch sử |

## 2. Cách biểu diễn Employee/Lecturer

DBML dùng mô hình **bảng cho kiểu con, chia sẻ khóa chính** (table-per-subtype):

- `employee` giữ thuộc tính chung của mọi nhân sự: mã, họ tên, ngày sinh, liên hệ, ngày tuyển, trạng thái.
- `lecturer` chỉ giữ thuộc tính riêng của giảng viên: `academic_rank`, `research_field`. `lecturer_id` vừa là PK vừa là FK tới `employee.employee_id` (quan hệ 1 - 0..1).
- Cán bộ hành chính chỉ có dòng ở `employee`. Giảng viên có dòng ở cả hai bảng, cùng ID.
- `employee` không có cột đơn vị hay chức vụ. Đơn vị và chức vụ hiện tại lấy từ `assignment` đang hiệu lực có `is_primary = true`. Nhờ vậy giữ được lịch sử thăng chức, chuyển đơn vị và kiêm nhiệm.

Lý do không gộp thành một bảng có cột `is_lecturer`: các bảng Academic (`class.lecturer_id`) trỏ thẳng tới `lecturer`, nên FK tự đảm bảo chỉ giảng viên mới được xếp lớp.

Quy tắc giữ hai bảng khớp nhau (HR-DQ-09):

| Chức vụ | Ai được giữ |
|---|---|
| `GV`, `GVC`, `TG`, `TK`, `PTK`, `TBM` | Chỉ giảng viên (có dòng ở `lecturer`) |
| `CV`, `NV`, `TP` | Chỉ cán bộ hành chính |
| `HT`, `PHT` | Cả hai (mẫu: hiệu trưởng, phó hiệu trưởng đều là giảng viên) |

## 3. Quy ước đặt tên

Giống Admissions ([mục 1](admissions-dataset-v1.md#1-quy-ước)), thêm:

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| `department_code` | Tiền tố theo loại đơn vị: `UNI` trường, `BGH` ban giám hiệu, `P…` phòng, `K…` khoa, `BM…` bộ môn | `KCNTT`, `BMKHMT`, `PDT` |
| `position_code` | 2-5 chữ in hoa, viết tắt tiếng Việt | `TK` (Trưởng khoa), `GVC` |
| `position_level` | `Leadership`, `Management`, `Staff` | |
| `employee_code` | `NV` + 4 số | `NV0013` |
| `academic_rank` | Học vị/học hàm cao nhất: `M.Sc.`, `Ph.D.`, `Assoc. Prof.`, `Prof.` (theo note DBML) | |
| `qualification_type` | `Degree`, `Certificate` | |
| Khoảng thời gian | `start_date` bắt buộc; `end_date` null = đang giữ | |

## 4. Sơ đồ schema

```mermaid
erDiagram
    DEPARTMENT |o--o{ DEPARTMENT : "đơn vị cha"
    EMPLOYEE ||--o| LECTURER : "là"
    EMPLOYEE ||--o{ EMPLOYEE_QUALIFICATION : "có"
    QUALIFICATION ||--o{ EMPLOYEE_QUALIFICATION : "được cấp"
    EMPLOYEE ||--o{ ASSIGNMENT : "công tác"
    DEPARTMENT ||--o{ ASSIGNMENT : "tại"
    POSITION ||--o{ ASSIGNMENT : "giữ"
    DEPARTMENT |o--o{ MAJOR : "quản lý (Admissions)"
    LECTURER ||--o{ CLASS : "giảng dạy (Academic)"

    DEPARTMENT {
        int department_id PK
        varchar department_code UK "UNI, BGH, P, K, BM"
        varchar department_name
        int parent_department_id FK "null = gốc"
    }
    POSITION {
        int position_id PK
        varchar position_code UK
        varchar position_name
        varchar position_level "Leadership, Management, Staff"
    }
    QUALIFICATION {
        int qualification_id PK
        varchar qualification_name UK
        varchar qualification_type "Degree, Certificate"
    }
    EMPLOYEE {
        bigint employee_id PK
        varchar employee_code UK
        varchar full_name
        date date_of_birth
        varchar gender
        varchar email UK
        varchar phone
        date hire_date
        varchar employee_status "Active, Resigned, Retired"
    }
    LECTURER {
        bigint lecturer_id PK, FK "= employee_id"
        varchar academic_rank
        varchar research_field
    }
    EMPLOYEE_QUALIFICATION {
        bigint employee_id PK, FK
        int qualification_id PK, FK
        varchar institution
        int year_obtained
    }
    ASSIGNMENT {
        bigint assignment_id PK
        bigint employee_id FK
        int department_id FK
        int position_id FK
        date start_date
        date end_date "null = đang giữ"
        boolean is_primary "false = kiêm nhiệm"
    }
    MAJOR {
        int major_id PK
        int department_id FK
    }
    CLASS {
        bigint class_id PK
        bigint lecturer_id FK
    }
```

| Quan hệ | Bản số | Ghi chú |
|---|---|---|
| department → department | 0..1 - N | Cây đơn vị; đúng một gốc |
| employee → lecturer | 1 - 0..1 | Chia sẻ khóa chính |
| employee ↔ qualification | N - N qua `employee_qualification` | PK ghép `(employee_id, qualification_id)` |
| employee → assignment | 1 - N | Lịch sử công tác, có kiêm nhiệm |
| department → assignment, position → assignment | 1 - N | |
| department → major (Admissions) | 0..1 - N | Khoa quản lý ngành |
| lecturer → class (Academic) | 1 - N | Giảng viên phụ trách lớp học phần |

## 5. Đặc tả bảng

Cột **Null**: `N` = bắt buộc, `Y` = được để trống. Kiểu dữ liệu theo DBML.

### 5.1 `department` – Đơn vị

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| department_id | int | N | PK | |
| department_code | varchar(20) | N | UK | Tiền tố theo loại đơn vị (mục 3) |
| department_name | varchar(150) | N | | |
| parent_department_id | int | Y | FK → department | Null = đơn vị gốc; không trỏ vào chính nó, không có chu trình |

### 5.2 `position` – Chức vụ

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| position_id | int | N | PK | |
| position_code | varchar(20) | N | UK | |
| position_name | varchar(100) | N | | |
| position_level | varchar(30) | Y | | `Leadership`, `Management`, `Staff` |

### 5.3 `qualification` – Văn bằng, chứng chỉ

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| qualification_id | int | N | PK | |
| qualification_name | varchar(150) | N | UK | |
| qualification_type | varchar(30) | N | | `Degree`, `Certificate` |

### 5.4 `employee` – Nhân sự

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| employee_id | bigint | N | PK | |
| employee_code | varchar(20) | N | UK | `NV` + 4 số |
| full_name | varchar(150) | N | | **PII** |
| date_of_birth | date | N | | **PII**. Tuổi khi tuyển 20 - 60 |
| gender | varchar(10) | N | | `Male`, `Female` |
| email | varchar(150) | Y | UK | **PII** |
| phone | varchar(20) | Y | | **PII**. `0` + 9 số |
| hire_date | date | N | | = `start_date` sớm nhất trong `assignment` |
| employee_status | varchar(20) | N | | `Active`, `Resigned`, `Retired` |

### 5.5 `lecturer` – Giảng viên

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| lecturer_id | bigint | N | PK, FK → employee | = `employee_id` |
| academic_rank | varchar(50) | Y | | `M.Sc.`, `Ph.D.`, `Assoc. Prof.`, `Prof.`; khớp văn bằng (HR-DQ-11) |
| research_field | varchar(200) | Y | | |

### 5.6 `employee_qualification` – Văn bằng của nhân sự

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| employee_id | bigint | N | PK, FK → employee | |
| qualification_id | int | N | PK, FK → qualification | |
| institution | varchar(200) | Y | | Nơi cấp |
| year_obtained | int | Y | | Sau 18 tuổi; Cử nhân/Kỹ sư < Thạc sĩ < Tiến sĩ |

### 5.7 `assignment` – Quá trình công tác

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| assignment_id | bigint | N | PK | |
| employee_id | bigint | N | FK → employee | |
| department_id | int | N | FK → department | |
| position_id | int | N | FK → position | Phải đúng loại đơn vị (mục 6) |
| start_date | date | N | | `>= hire_date` |
| end_date | date | Y | | Null = đang giữ; `>= start_date` |
| is_primary | boolean | N | | Mặc định `true`; `false` = kiêm nhiệm |

## 6. Quy tắc chức vụ và phân công

Khai báo trong `position_rules` của schema JSON.

| Chức vụ | Loại đơn vị được phép | Một người/đơn vị tại một thời điểm |
|---|---|---|
| HT Hiệu trưởng, PHT Phó Hiệu trưởng | BGH | HT: có |
| TK Trưởng khoa, PTK Phó Trưởng khoa | Khoa | TK: có |
| TBM Trưởng bộ môn | Bộ môn | có |
| TP Trưởng phòng | Phòng | có |
| GV, GVC, TG | Khoa, Bộ môn | |
| CV Chuyên viên, NV Nhân viên | Phòng | |

- Mỗi nhân sự `Active` có đúng **một** vị trí chính đang hiệu lực. DDL có unique index một phần `ux_assignment_one_open_primary`.
- Các vị trí chính của một người không chồng thời gian. Thăng chức: đóng vị trí cũ ngày 30/06, mở vị trí mới ngày 01/07.
- Kiêm nhiệm (`is_primary = false`) được chồng thời gian với vị trí chính. Ví dụ hiệu trưởng vẫn là GVC ở bộ môn.
- `Resigned`/`Retired`: mọi assignment đã đóng, `end_date` = ngày nghỉ.

## 7. Field phục vụ truy vấn nhân sự

Lớp Silver dẫn xuất (khai báo trong `silver_derived_columns`):

| Cột | Cách tính |
|---|---|
| `employee.is_lecturer` | Có dòng trong `lecturer` |
| `employee.primary_department_id`, `current_position_id` | Từ assignment chính đang hiệu lực |
| `employee.faculty_id` | Đơn vị cấp 2 (khoa/phòng) chứa đơn vị chính; gộp bộ môn về khoa |
| `employee.seniority_years` | Thâm niên từ `hire_date` |
| `employee.highest_degree` | Tiến sĩ > Thạc sĩ > Kỹ sư/Cử nhân |
| `employee.birth_year` | Thay `date_of_birth` (PII) |
| `assignment.is_current` | `end_date` null hoặc sau ngày chốt |

Câu hỏi NLQ/Dashboard mẫu:

| Câu hỏi | Field |
|---|---|
| Số giảng viên theo khoa, học vị | `faculty_id`, `is_lecturer`, `academic_rank`, `highest_degree` |
| Tỷ lệ giảng viên có bằng tiến sĩ theo khoa | `highest_degree`, `faculty_id` |
| Cơ cấu nhân sự theo giới, độ tuổi, thâm niên | `gender`, `birth_year`, `seniority_years` |
| Số người nghỉ việc/nghỉ hưu theo năm | `employee_status`, `assignment.end_date` |
| Ai đang giữ chức vụ quản lý ở đơn vị X | `assignment.is_current`, `position_level`, `department_id` |
| Tỷ lệ sinh viên trên giảng viên theo khoa (liên domain) | `faculty_id` + `major.department_id` + `student` |
| Số lớp, số sinh viên mỗi giảng viên dạy theo học kỳ (liên domain) | `class.lecturer_id`, `enrollment_grade` |

Gợi ý data mart Gold: `faculty_staffing` (khoa × học vị × trạng thái), `lecturer_workload` (giảng viên × học kỳ: số lớp, số sinh viên, tỷ lệ đạt), `headcount_monthly` (đơn vị × tháng: số nhân sự đang làm việc).

## 8. Luật chất lượng dữ liệu (DQ)

| ID | Bảng | Luật | Mức |
|---|---|---|---|
| HR-DQ-01 | tất cả | PK (kể cả PK ghép) và cột unique không null, không trùng | error |
| HR-DQ-02 | tất cả | FK trỏ tới bản ghi có thật | error |
| HR-DQ-03 | tất cả | Đúng kiểu, độ dài, enum, pattern, min/max | error |
| HR-DQ-04 | department | Một gốc, không chu trình; bộ môn thuộc khoa | error |
| HR-DQ-05 | employee | Tuổi khi tuyển 20 - 60; `hire_date` = assignment sớm nhất | error |
| HR-DQ-06 | assignment | `start_date >= hire_date`; `end_date >= start_date`; vị trí chính không chồng lấn | error |
| HR-DQ-07 | assignment | `Active` có đúng một vị trí chính đang hiệu lực; `Resigned`/`Retired` không còn assignment mở | error |
| HR-DQ-08 | assignment | HT, TK, TP, TBM: một người/đơn vị/thời điểm; chức vụ đúng loại đơn vị | error |
| HR-DQ-09 | assignment | Chức vụ giảng dạy chỉ cho giảng viên; CV, NV, TP chỉ cho cán bộ hành chính | error |
| HR-DQ-10 | employee_qualification | Năm cấp sau 18 tuổi, không sau ngày chốt; thứ tự bằng cấp hợp lý | error |
| HR-DQ-11 | lecturer | `Ph.D.`/`Assoc. Prof.`/`Prof.` có bằng Tiến sĩ; `M.Sc.` có Thạc sĩ, không có Tiến sĩ | warning |
| HR-DQ-12 | class (Academic) | Giảng viên dạy lớp có assignment hiệu lực suốt học kỳ, thuộc khoa quản lý ngành của học phần | error |

## 9. Hướng dẫn ingestion (W3)

**Thứ tự nạp:** `department` → `position` → `qualification` → `employee` → `lecturer` → `employee_qualification` → `assignment`. HR nạp **trước** Admissions và Academic.

**Bronze:** `bronze/hr/<table>/ingest_date=YYYY-MM-DD/<batch_id>.csv`.

**Bronze → Silver:**

1. Kiểm tra header theo `hr_v1.schema.json`.
2. Ép kiểu, kiểm tra null/enum/pattern/range, PK ghép (DQ-01..03).
3. `department` tự tham chiếu: nạp cả bảng rồi kiểm tra FK và cây (DQ-02, DQ-04).
4. Kiểm tra luật nghiệp vụ DQ-05..11. DQ-12 chạy sau khi nạp Academic.
5. Tính cột dẫn xuất (mục 7). Che PII: bỏ `full_name`, `email`, `phone` ở Gold; `date_of_birth` → `birth_year`.
6. Upsert theo PK nguồn. `assignment` là lịch sử, không xóa dòng cũ; chỉ cập nhật `end_date`.
7. Gửi kết quả DQ và lineage cho `governance`.

## 10. Dữ liệu mẫu

Ngày chốt: **25/09/2026**. Sinh lại toàn bộ dữ liệu mẫu (đúng thứ tự):

```bash
python data/synthetic/generate_hr.py
python data/synthetic/generate_admissions.py
python data/synthetic/generate_academic.py
```

| File | Dòng | Nội dung |
|---|---|---|
| hr/department.csv | 14 | Trường; Ban Giám hiệu; 4 phòng; 6 khoa; 2 bộ môn thuộc Khoa CNTT |
| hr/position.csv | 11 | HT, PHT, TK, PTK, TP, TBM, GVC, GV, TG (chưa dùng, `position_level` trống), CV, NV |
| hr/qualification.csv | 9 | 4 văn bằng, 5 chứng chỉ |
| hr/employee.csv | 36 | 26 giảng viên, 10 cán bộ hành chính; 33 Active, 2 Resigned, 1 Retired |
| hr/lecturer.csv | 26 | 13 M.Sc., 10 Ph.D., 3 Assoc. Prof. |
| hr/employee_qualification.csv | 116 | Bằng đại học, thạc sĩ, tiến sĩ, nghiệp vụ sư phạm, IELTS, LLCT, Kế toán trưởng, AWS |
| hr/assignment.csv | 67 | Lịch sử từ 1990; 35 dòng đang hiệu lực; 2 kiêm nhiệm |

Các tình huống có trong mẫu:

- **Thăng chức:** GV → GVC → Trưởng khoa (ví dụ `NV0013`); PHT → HT (`NV0001`).
- **Kiêm nhiệm:** hiệu trưởng và phó hiệu trưởng vẫn là GVC ở bộ môn/khoa (`is_primary = false`), nên vẫn được xếp lớp.
- **Chuyển giao chức vụ:** Trưởng khoa Xây dựng đổi người ngày 01/01/2023; người cũ về GVC rồi nghỉ hưu 31/01/2025.
- **Nghỉ việc, nghỉ hưu:** giảng viên `NV0018` nghỉ việc 30/06/2025, `NV0028` nghỉ hưu 31/01/2025 (chỉ dạy tới HK1 2024-2025), chuyên viên `NV0011` nghỉ 31/12/2024. Không ai được xếp lớp sau ngày nghỉ.
- **Liên domain:** 25 giảng viên được xếp 111 lớp của Academic, đúng khoa và đúng thời gian công tác (HR-DQ-12).
- Một nhân sự chưa có email, 6 người chưa có số điện thoại.

## 11. Các điểm trong DBML cần team xem

1. **PK của `employee_qualification` là `(employee_id, qualification_id)`,** nên một người không có được hai bằng cùng loại (ví dụ hai bằng thạc sĩ). Nếu cần thì thêm cột ngành học (`major_field`) vào PK hoặc dùng PK riêng.
2. **`qualification` chưa phân cấp văn bằng.** Thứ tự Cử nhân < Thạc sĩ < Tiến sĩ đang suy ra từ tên. Nên thêm cột `degree_level` (số) để tính `highest_degree` chắc chắn hơn.
3. **`lecturer.academic_rank` gộp học vị và học hàm** (`Ph.D.` là học vị, `Assoc. Prof.` là học hàm) và có thể lệch với `employee_qualification`. HR-DQ-11 kiểm tra việc này.
4. **`department` không có cột loại đơn vị.** Loại (phòng/khoa/bộ môn) đang suy từ tiền tố mã. Nên thêm `department_type`.
5. **`employee.hire_date` trùng thông tin với `assignment`** (start_date sớm nhất). HR-DQ-05 kiểm tra việc này.
6. **Chưa có ngày nghỉ việc ở `employee`.** Ngày nghỉ phải lấy từ `end_date` lớn nhất của `assignment`.
7. **Thiếu ràng buộc thời gian ở mức DB** cho phân công chồng lấn và "một Trưởng khoa mỗi khoa". DDL chỉ chặn được trường hợp hai vị trí chính cùng mở. Các luật còn lại kiểm ở bước DQ.
8. **Liên kết với governance:** `dataset.owner_department_id` (governance) cũng trỏ vào `department`, nên cây đơn vị cần ổn định trước khi làm Catalog.
