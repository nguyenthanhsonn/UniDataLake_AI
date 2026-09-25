# Academic/Training Dataset Schema V1

| Mục | Giá trị |
|---|---|
| Domain | Academic/Training (Đào tạo) |
| Phiên bản | 1.0.0 |
| Nguồn chuẩn | [unilake-db.dbml](unilake-db.dbml): thiết kế DB nguồn của team |
| Phạm vi | Theo proposal: Student, Program, Major, Course, Class, Semester, Grade |
| Dùng cho | Data Ingestion (W3), lớp Bronze → Silver → Gold, NLQ |
| Liên quan | [Admissions Dataset V1](admissions-dataset-v1.md): dùng chung `program`, `major`, `admission_year`; `student` được tạo từ `enrollment` |

Các file đi kèm:

| File | Vai trò |
|---|---|
| [academic_v1.schema.json](academic_v1.schema.json) | Schema máy đọc: kiểu, null, unique, enum, pattern, FK, thang điểm, cột dẫn xuất ở Silver, luật DQ |
| [academic_v1.sql](academic_v1.sql) | DDL PostgreSQL cho 5 bảng Academic (chạy sau `admissions_v1.sql`) |
| `data/samples/training/*.csv` | Dữ liệu mẫu: student, semester, course, class, enrollment_grade |
| `data/samples/hr/*.csv` | Giảng viên và phân công công tác, thuộc [HR Dataset V1](hr-dataset-v1.md) |
| [data/synthetic/generate_academic.py](../../data/synthetic/generate_academic.py) | Sinh lại dữ liệu mẫu, chạy sau `generate_hr.py` và `generate_admissions.py` |
| [backend/tests/test_dataset_schemas.py](../../backend/tests/test_dataset_schemas.py) | Kiểm tra chung cho mọi dataset: khớp DBML (tên, kiểu, null), CSV khớp schema, PK/unique, FK, DDL |
| [backend/tests/test_academic_dataset.py](../../backend/tests/test_academic_dataset.py) | Kiểm tra luật nghiệp vụ ACA-DQ-04..11 |

## 1. Entity và phân loại

| Bảng | Vai trò | Thuộc dataset |
|---|---|---|
| `student` | Sinh viên | Academic |
| `semester` | Học kỳ (HK1, HK2, học kỳ hè) | Academic |
| `course` | Học phần | Academic |
| `class` | Lớp học phần: học phần mở trong một học kỳ, một giảng viên phụ trách | Academic |
| `enrollment_grade` | Đăng ký lớp và kết quả học tập (Grade trong proposal) | Academic |
| `program`, `major` | Chương trình, ngành | Admissions (dùng chung) |
| `admission_year` | Khóa tuyển sinh của sinh viên | Admissions (dùng chung) |
| `applicant` | Thí sinh mà sinh viên được tạo từ đó | Admissions |
| `lecturer`, `employee` | Giảng viên | HR |

## 2. Quy ước đặt tên

Giống Admissions (xem [admissions-dataset-v1.md mục 1](admissions-dataset-v1.md#1-quy-ước)), thêm:

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| `semester_code` | `<năm bắt đầu năm học>-<1/2/3>`: 1 = HK1, 2 = HK2, 3 = học kỳ hè | `2025-2` = HK2 năm học 2025-2026 |
| `academic_year` | `YYYY-YYYY`, trùng định dạng `admission_year.year_label` | `2025-2026` |
| `course_code` | 2-4 chữ in hoa (nhóm môn) + 3 số (chữ số đầu = năm học gợi ý) | `CS201`, `GEN101` |
| `class_code` | `<course_code>-<semester_code>-<nhóm 2 số>` | `CS201-2025-1-01` |
| `student_code` | năm nhập học (4) + `program_id` (2) + số thứ tự (4) | `2025010007` |
| Điểm | Thang 10, `decimal(4,2)`; điểm chữ `A`, `B+`, `B`, `C+`, `C`, `D+`, `D`, `F` | `7.30`, `B` |

## 3. Sơ đồ schema

```mermaid
erDiagram
    MAJOR ||--o{ PROGRAM : "có"
    MAJOR |o--o{ COURSE : "quản lý"
    PROGRAM ||--o{ STUDENT : "theo học"
    ADMISSION_YEAR ||--o{ STUDENT : "khóa"
    APPLICANT |o--o| STUDENT : "trở thành"
    COURSE ||--o{ CLASS : "mở thành"
    SEMESTER ||--o{ CLASS : "tổ chức trong"
    LECTURER ||--o{ CLASS : "giảng dạy"
    EMPLOYEE ||--|| LECTURER : "là"
    STUDENT ||--o{ ENROLLMENT_GRADE : "đăng ký"
    CLASS ||--o{ ENROLLMENT_GRADE : "có"

    STUDENT {
        bigint student_id PK
        varchar student_code UK
        bigint applicant_id FK "UK, null được"
        varchar full_name
        date date_of_birth
        varchar gender
        int program_id FK
        int admission_year_id FK "khóa"
        varchar student_status "Active, Graduated, Suspended, Dropped"
    }
    SEMESTER {
        int semester_id PK
        varchar semester_code UK "2025-1"
        varchar academic_year "2025-2026"
        date start_date
        date end_date
    }
    COURSE {
        int course_id PK
        varchar course_code UK
        varchar course_name
        int credit_hours
        int major_id FK "null = học phần chung"
    }
    CLASS {
        bigint class_id PK
        varchar class_code UK
        int course_id FK
        int semester_id FK
        bigint lecturer_id FK
        int max_capacity
        varchar room
    }
    ENROLLMENT_GRADE {
        bigint student_id PK, FK
        bigint class_id PK, FK
        decimal midterm_score
        decimal final_score
        decimal grade_value
        varchar letter_grade
        date registration_date
    }
    PROGRAM {
        int program_id PK
        varchar program_code UK
        int major_id FK
    }
    MAJOR {
        int major_id PK
        varchar major_code UK
    }
    ADMISSION_YEAR {
        int admission_year_id PK
        varchar year_label UK
    }
    APPLICANT {
        bigint applicant_id PK
    }
    LECTURER {
        bigint lecturer_id PK, FK
        varchar academic_rank
    }
    EMPLOYEE {
        bigint employee_id PK
        varchar employee_code UK
    }
```

Chuỗi quan hệ chính theo proposal: **Student → Program → Major**; **Course → Class → Semester**; **Student ↔ Class qua Grade** (`enrollment_grade`).

| Quan hệ | Bản số | Ghi chú |
|---|---|---|
| program → student | 1 - N | Sinh viên thuộc đúng một chương trình; ngành lấy qua `program.major_id` |
| admission_year → student | 1 - N | Khóa của sinh viên (khóa 2025 = `2025-2026`) |
| applicant → student | 0..1 - 0..1 | Trống với sinh viên nhập từ hệ thống cũ |
| major → course | 0..1 - N | `major_id` null = học phần chung toàn trường |
| course → class, semester → class | 1 - N | Một học phần có thể mở nhiều nhóm trong một học kỳ |
| lecturer → class | 1 - N | Bắt buộc có giảng viên |
| student ↔ class | N - N qua `enrollment_grade` | PK ghép `(student_id, class_id)` |

## 4. Đặc tả bảng

Cột **Null**: `N` = bắt buộc, `Y` = được để trống. Kiểu dữ liệu theo DBML.

### 4.1 `student` – Sinh viên

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| student_id | bigint | N | PK | |
| student_code | varchar(20) | N | UK | 10 chữ số |
| applicant_id | bigint | Y | FK → applicant, UK | |
| full_name | varchar(150) | N | | **PII** |
| date_of_birth | date | N | | **PII** |
| gender | varchar(10) | N | | `Male`, `Female` |
| program_id | int | N | FK → program | |
| admission_year_id | int | N | FK → admission_year | Khóa |
| student_status | varchar(20) | N | | `Active`, `Graduated`, `Suspended`, `Dropped` |

### 4.2 `semester` – Học kỳ

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| semester_id | int | N | PK | |
| semester_code | varchar(20) | N | UK | `^[0-9]{4}-[1-3]$` |
| academic_year | varchar(9) | N | | Khớp 4 số đầu của `semester_code` |
| start_date | date | N | | |
| end_date | date | N | | `> start_date`, các học kỳ không chồng lấn |

### 4.3 `course` – Học phần

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| course_id | int | N | PK | |
| course_code | varchar(20) | N | UK | `^[A-Z]{2,4}[0-9]{3}$` |
| course_name | varchar(200) | N | | |
| credit_hours | int | N | | Số tín chỉ, 1 - 10 |
| major_id | int | Y | FK → major | Null = học phần chung |

### 4.4 `class` – Lớp học phần

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| class_id | bigint | N | PK | |
| class_code | varchar(30) | N | UK | `<course_code>-<semester_code>-<nhóm>` |
| course_id | int | N | FK → course | |
| semester_id | int | N | FK → semester | |
| lecturer_id | bigint | N | FK → lecturer | |
| max_capacity | int | N | | 1 - 200; số đăng ký không vượt |
| room | varchar(50) | Y | | Null = chưa xếp phòng/trực tuyến |

### 4.5 `enrollment_grade` – Đăng ký lớp và kết quả

| Cột | Kiểu | Null | Khóa | Ràng buộc / mô tả |
|---|---|---|---|---|
| student_id | bigint | N | PK, FK → student | |
| class_id | bigint | N | PK, FK → class | |
| midterm_score | decimal(4,2) | Y | | 0 - 10 |
| final_score | decimal(4,2) | Y | | 0 - 10 |
| grade_value | decimal(4,2) | Y | | `round(0.3 × midterm + 0.7 × final, 1)` |
| letter_grade | varchar(2) | Y | | Theo bảng quy đổi mục 5 |
| registration_date | date | N | | `<= semester.end_date` |

Bốn cột điểm để trống khi học kỳ chưa kết thúc (sinh viên đang học).

## 5. Quy đổi điểm

Lưu trong `grading` của schema JSON, để ingestion và Gold dùng chung một nguồn.

| Điểm tổng kết (thang 10) | Điểm chữ | Điểm hệ 4 | Kết quả |
|---|---|---|---|
| 8.5 - 10 | A | 4.0 | Đạt |
| 8.0 - 8.4 | B+ | 3.5 | Đạt |
| 7.0 - 7.9 | B | 3.0 | Đạt |
| 6.5 - 6.9 | C+ | 2.5 | Đạt |
| 5.5 - 6.4 | C | 2.0 | Đạt |
| 5.0 - 5.4 | D+ | 1.5 | Đạt |
| 4.0 - 4.9 | D | 1.0 | Đạt |
| < 4.0 | F | 0.0 | Không đạt, phải học lại |

## 6. Field phục vụ truy vấn học tập

DB nguồn không lưu GPA hay số tín chỉ tích lũy; lớp Silver dẫn xuất các cột sau (khai báo trong `silver_derived_columns`):

| Bảng Silver | Cột dẫn xuất | Cách tính |
|---|---|---|
| enrollment_grade | `grade_point` | Điểm hệ 4 theo mục 5 |
| enrollment_grade | `is_passed` | `letter_grade <> 'F'`; null khi chưa có điểm |
| enrollment_grade | `credits_earned` | `credit_hours` nếu đạt, ngược lại 0 |
| enrollment_grade | `attempt_no`, `is_latest_attempt` | Lần học thứ mấy của cùng học phần; GPA tích lũy chỉ tính lần cuối |
| semester | `semester_type` | `HK1`, `HK2`, `Summer` |
| student | `cohort_year`, `major_id` | Từ `admission_year`, `program` |

Câu hỏi NLQ/Dashboard mẫu và field dùng:

| Câu hỏi | Field |
|---|---|
| GPA học kỳ của sinh viên / của khóa / của ngành | `grade_point`, `credit_hours`, `semester_code`, `cohort_year`, `major_id` |
| GPA tích lũy, số tín chỉ tích lũy | `grade_point`, `credits_earned`, `is_latest_attempt` |
| Tỷ lệ đạt / trượt theo học phần, học kỳ, giảng viên | `is_passed`, `course_code`, `semester_code`, `lecturer_id` |
| Phân bố điểm chữ của một học phần | `letter_grade`, `course_id` |
| Số sinh viên theo trạng thái, khóa, chương trình | `student_status`, `cohort_year`, `program_id` |
| Tỷ lệ học lại | `attempt_no > 1` |
| Tỷ lệ lấp đầy lớp | số đăng ký / `max_capacity` |
| Điểm đầu vào so với GPA năm nhất | `student.applicant_id` → `admission.admission_score` |

Gợi ý data mart Gold: `student_semester_gpa` (sinh viên × học kỳ), `course_semester_result` (học phần × học kỳ: số đăng ký, tỷ lệ đạt, điểm trung bình), `cohort_progress` (khóa × chương trình × trạng thái).

## 7. Luật chất lượng dữ liệu (DQ)

Luật ACA-DQ-01..03 được kiểm tra chung trong `test_dataset_schemas.py`, luật ACA-DQ-04..11 trong `test_academic_dataset.py`.

| ID | Bảng | Luật | Mức |
|---|---|---|---|
| ACA-DQ-01 | tất cả | PK (kể cả PK ghép) và cột unique không null, không trùng | error |
| ACA-DQ-02 | tất cả | FK trỏ tới bản ghi có thật | error |
| ACA-DQ-03 | tất cả | Đúng kiểu, độ dài, enum, pattern, min/max | error |
| ACA-DQ-04 | semester | `end_date > start_date`; không chồng lấn; `academic_year` khớp mã | error |
| ACA-DQ-05 | class | Số đăng ký `<= max_capacity` | error |
| ACA-DQ-06 | enrollment_grade | `grade_value` đúng công thức; `letter_grade` đúng bảng quy đổi | error |
| ACA-DQ-07 | enrollment_grade | Học kỳ đã xong thì đủ điểm; đang học thì chưa có điểm | warning |
| ACA-DQ-08 | enrollment_grade | `registration_date <= semester.end_date` | error |
| ACA-DQ-09 | enrollment_grade | Không học trước năm nhập học | error |
| ACA-DQ-10 | enrollment_grade | Không đăng ký cùng học phần hai lần trong một học kỳ | error |
| ACA-DQ-11 | student | `Active` thì có đăng ký ở học kỳ hiện tại; `Dropped`/`Suspended` thì không | warning |

## 8. Hướng dẫn ingestion (W3)

**Thứ tự nạp:** các bảng Admissions dùng chung (`department` → `major` → `program` → `admission_year` → `applicant`), HR (`employee` → `lecturer`), rồi `student` → `semester` → `course` → `class` → `enrollment_grade`.

**Bronze:** `bronze/academic/<table>/ingest_date=YYYY-MM-DD/<batch_id>.csv`.

**Bronze → Silver:**

1. Kiểm tra header theo `academic_v1.schema.json`.
2. Ép kiểu, kiểm tra null/enum/pattern/range và PK ghép (DQ-01..03).
3. Kiểm tra FK và luật nghiệp vụ (DQ-02, DQ-04..11).
4. Tính cột dẫn xuất (mục 6); bỏ hoặc che PII của `student` như Admissions (mục 5 tài liệu Admissions).
5. Upsert theo PK nguồn. `enrollment_grade` thay đổi trong học kỳ (điểm giữa kỳ, cuối kỳ) nên nạp lại theo học kỳ đang mở.
6. Gửi kết quả DQ và lineage cho `governance`.

## 9. Dữ liệu mẫu

Ngày chốt dữ liệu: **25/09/2026**, đang ở tuần thứ 3 của HK1 năm học 2026-2027. Sinh lại:

```bash
python data/synthetic/generate_hr.py
python data/synthetic/generate_admissions.py
python data/synthetic/generate_academic.py
```

| File | Dòng | Nội dung |
|---|---|---|
| training/student.csv | 63 | 3 khóa 2024 - 2026 từ Admissions; 60 Active, 2 Dropped, 1 Suspended |
| training/semester.csv | 7 | 2024-1 → 2026-1 (gồm 2 học kỳ hè) |
| training/course.csv | 62 | 11 học phần chung + học phần của 8 ngành (`MS601` thạc sĩ chưa mở lớp) |
| training/class.csv | 111 | 9 lớp học lại ở học kỳ hè; 1 lớp chưa có phòng; 25 giảng viên phụ trách |
| training/enrollment_grade.csv | 705 | 479 lượt đã có điểm (14 điểm F), 226 lượt đang học ở 2026-1 |

Logic sinh dữ liệu:

- Chương trình khung 5 học kỳ đầu cho 7 ngành đại học: học phần chung (lý luận chính trị, tiếng Anh, toán) và học phần ngành. Khóa 2024 đang ở học kỳ 5, khóa 2025 ở học kỳ 3, khóa 2026 ở học kỳ 1.
- Điểm phụ thuộc năng lực sinh viên (tương quan với điểm xét tuyển) và độ khó học phần (`CS102`, `CE201` khó hơn). Trung bình tổng kết khoảng 6.8.
- Học kỳ đầu đăng ký đúng ngày nhập học; các học kỳ sau đăng ký trước ngày bắt đầu 1 - 3 tuần.
- Điểm F được học lại ở học kỳ hè cùng năm học (khoảng 75% số trường hợp).
- Sinh viên `Dropped` dừng sau học kỳ 1 hoặc 2; `Suspended` không đăng ký học kỳ hiện tại.
- Học phần chung mở lớp 60 chỗ, học phần ngành 45, lớp hè 30; vượt sức chứa thì tách nhóm.

## 10. Các điểm trong DBML cần team xem

1. **Chưa có chương trình khung.** Không có bảng nối `program` - `course` (học phần nào thuộc chương trình nào, học kỳ nào, bắt buộc hay tự chọn) và điều kiện tiên quyết. Nên thêm `curriculum_course(program_id, course_id, recommended_semester, is_required)` nếu muốn phân tích tiến độ học.
2. **`semester.academic_year` là chuỗi, không phải FK.** Nối với khóa qua chuỗi `YYYY-YYYY` = `admission_year.year_label`, dễ lệch định dạng.
3. **`enrollment_grade` trùng nghĩa với `enrollment` (Admissions).** Cân nhắc đổi tên thành `class_registration` hoặc `grade`.
4. **Không lưu số lần học.** Học lại tạo dòng mới với `class_id` khác; lần học được suy ra theo thời gian (`attempt_no` ở Silver).
5. **Không có trọng số điểm.** Tỷ lệ 30/70 đang là quy ước chung; nếu từng học phần có trọng số khác thì cần cột `midterm_weight` ở `course` hoặc `class`.
6. **`class` không gắn chương trình.** Không phân biệt được lớp CLC với lớp đại trà nếu cùng học phần; mẫu dữ liệu hiện chưa tách.
7. **`student` lặp PII của `applicant`** (họ tên, ngày sinh, giới tính), đã ghi ở tài liệu Admissions.
8. **`lecturer` không có khoa.** Khoa của giảng viên lấy qua `assignment` (HR). Mẫu dữ liệu xếp lớp cho giảng viên thuộc khoa phụ trách nhóm môn và còn công tác suốt học kỳ (HR-DQ-12).
