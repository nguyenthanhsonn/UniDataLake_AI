# Chạy validation đầu vào Bronze

## 1. Những gì đã được nối vào runtime

Nhánh validation được bật **cho từng job có `validation_policy` trong POST /api/v1/ingestion/jobs**.
Job không gửi trường này và job cũ vẫn chạy luồng legacy. Vì vậy đây là rollout có kiểm soát,
chưa đáp ứng điều kiện mọi nguồn production bắt buộc đi qua policy.

```text
POST job + policy
  → kiểm tra quyền, catalog, binding, parser; pin policy/location vào job
  → worker: VALIDATING
  → copy file và validate chính bản copy / đọc snapshot PostgreSQL
  → commit validation_report vào job
      FAIL/ERROR → FAILED, không upload
      PASS/WARNING → WRITING → upload và xác minh MinIO → SUCCESS
```

Policy sai trước enqueue: job REJECTED với mã `VALIDATION_POLICY_INVALID`.
Lỗi dữ liệu khi đọc: job FAILED với mã `BRONZE_INPUT_VALIDATION_BLOCKED`; xem report để biết mã cụ thể.
Nếu report không lưu được, không upload. Nếu upload lỗi, report PASS vẫn được giữ nhưng job FAILED.
Nếu DB không lưu được lỗi, lease recovery hiện có sẽ xử lý job; không cam kết report luôn tồn tại khi DB mất kết nối.

Report đang lưu trong cột JSONB `app.ingestion_job.validation_report`, chưa tách bảng run/issue như thiết kế dài hạn.
GET job và GET danh sách job trả thêm `validation_report`; legacy trả null.
`validation_input` lưu policy, fingerprint, vị trí và revision nguồn; không chứa mật khẩu.
Version policy hiện do người gọi khai báo, chưa có registry phê duyệt/cấm tái sử dụng version với nội dung khác.
Fingerprint phân biệt nội dung thực tế được job sử dụng.

## 2. Cập nhật môi trường

Tại thư mục gốc dự án, bật Docker Desktop và PostgreSQL/MinIO trước. Dừng backend/worker cũ khi triển khai migration.
Không xóa volume. Với DB đã có schema, chạy:

```powershell
Get-Content -Raw -Encoding utf8 .\infra\postgres\migrations\20261022_bronze_validation.sql |
  docker compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose build backend ingestion-worker
docker compose up -d backend ingestion-worker
```

Migration chỉ thêm hai cột JSONB nullable, chạy lại được. Schema khởi tạo mới cũng đã có hai cột này.
Nhánh PostgreSQL validation cần `psycopg[binary]`; dependency đã bổ sung vào requirements của image.
Không cần thay đổi cổng MinIO hoặc chính sách phân quyền writer/verifier.

## 3. Tạo job CSV có policy

Mở `docs/examples/bronze-validation-job.json`. **ID 1/2 chỉ là ví dụ**, phải thay bằng catalog thật:

- `data_source_id`, `dataset_id` ở request và policy phải khớp nhau.
- `source_system_id` trong policy phải là source system của datasource và dataset.
- `source_table` là tên file có thật ở location datasource mà worker truy cập được.
- `columns` là tên cột **nguồn**, không phải tên cột Silver.
- Các số limits trong mẫu dành cho thử nhỏ, không phải mức benchmark đã nghiệm thu.

Ví dụ nội dung `input.csv` phù hợp với mẫu:

```csv
id,name
001,Nguyễn Văn A
002,Trần Thị B
```

Đăng nhập/Authorize Swagger, dán JSON mẫu đã chỉnh vào POST `/api/v1/ingestion/jobs`.
Ghi lại `ingestion_job_id`, dùng GET job theo ID để theo dõi.

Parser trong policy là cấu hình sử dụng cho nhánh validation này, thay cho parser config hiện tại của catalog.
Location được pin tại enqueue. Sửa delimiter/location trong catalog sau đó không đổi parser/location của job cũ.
Catalog vẫn phải active và dataset vẫn phải là Bronze đúng nguồn khi worker thực thi.

Đối chiếu:

1. Job SUCCESS và `validation_report.result=PASS`.
2. `scan_complete=true`, `records_scanned=2`, đủ required checks.
3. `output.uri/version_id/sha256` dùng để kiểm tra object Bronze như luồng cũ; CSV/Excel giữ nguyên bytes.
4. Đổi header thành `id,id`: job FAILED, issue `HEADER_DUPLICATE`, không có upload mới.
5. Chỉ giữ header: FAIL `EMPTY_SOURCE`; bật `allow_empty_records=true` mới được WARNING và tiếp nhận.
6. Thêm cột: mặc định FAIL; `allow_extra_columns=true` trả WARNING, giữ nguyên dữ liệu.
7. Thử file lỗi nghiệp vụ nhưng cấu trúc parse được: Bronze vẫn tiếp nhận, Cleaning/Silver xử lý sau.

CSV dùng parser strict một lượt để không tự đổi header trùng/đệm cột thiếu. Dòng trắng bị chặn vì sai số cột.
`skip_rows` tính theo bản ghi CSV logic; trường có newline trong quote vẫn là một bản ghi.
CSV không header phải khai báo `positional_columns` khớp chính xác thứ tự `columns`.
Giới hạn field của thư viện csv hiện hành vẫn áp dụng (thường 128 KiB); không tăng global limit giữa các thread.
Không chuyển đổi token null, ngày tháng hoặc ID khi kiểm tra; raw bytes không đổi.

## 4. Excel

Thay source/dataset/file bằng catalog Excel thật; thay `parser` thành:

```json
{"kind":"EXCEL","sheet_name":"Sheet1","header_row":1,"skip_rows":0,"formula_policy":"reject"}
```

`header_row` tính sau `skip_rows`, như reader hiện có. Chỉ xác nhận sheet được cấu hình.
Header trim, trùng/rỗng ở giữa bị chặn. Header trống cuối được bỏ trong cấu trúc đọc nhưng không sửa file.
Công thức/ô lỗi bị chặn với tọa độ hàng/cột; dữ liệu ở cột không tên bị chặn.
Dòng trắng được đếm trong `blank_rows_skipped`; không tính là bản ghi dữ liệu.
Chưa hỗ trợ `.xls`; `.xlsx/.xlsm` không thực thi macro. Đây không phải bộ quét malware.

## 5. PostgreSQL

Datasource PostgreSQL phải có các thông số kết nối hiện hành cùng `connection_config_version`, ví dụ `v1`.
`updated_at` của datasource phải có giá trị. Policy parser:

```json
{"kind":"POSTGRESQL","schema_name":"public","table_name":"students","connection_config_version":"v1"}
```

`source_table` phải là `students` hoặc `public.students`. Khai báo `allowed_source_types` theo tên
`pg_catalog.pg_type.typname` cho từng cột, ví dụ `int4`, `text`, `numeric`; không dùng alias `integer`.
Mọi lần sửa cấu hình kết nối phải cập nhật revision qua luồng catalog; nếu ghi SQL trực tiếp, cũng phải cập nhật
`updated_at` và `connection_config_version`. Worker chặn job cũ nếu revision thay đổi; không sao chép secret vào job.

Nhánh mới dùng psycopg, transaction `REPEATABLE READ READ ONLY`, server cursor và batch 512 dòng.
Schema lấy trong cùng transaction; Parquet dùng schema tường minh nên bảng rỗng/all-null vẫn giữ kiểu.
Luồng legacy chưa có policy vẫn dùng reader DuckDB cũ.

Kiểu hỗ trợ: int2/int4/int8, bool, float4/float8, text/varchar/bpchar, bytea, date,
timestamp/timestamptz, time và numeric có precision/scale hữu hạn phù hợp Arrow (precision <= 76,
0 <= scale <= precision). UUID, JSON, array, interval, numeric không ràng buộc và kiểu khác hiện bị chặn;
không tự ép thành text. Giá trị ngoài miền biểu diễn của Arrow cũng không được tiếp nhận.

## 6. Giới hạn và bước nghiệm thu tiếp theo

- Có kiểm tra byte file/copy/download, số cột, số bản ghi, độ dài chuỗi/bytes từng ô và thời gian tại các checkpoint.
- `memory_limit_bytes` kiểm tra kích thước ước tính buffer hàng/batch Python; **không phải trần RSS toàn process**.
  openpyxl/shared strings, Arrow và thư viện hệ thống còn có bộ nhớ ngoài buffer này.
- Timeout gồm deadline hợp tác và PostgreSQL statement/connect timeout; chưa có process supervisor dừng cứng
  khi parser/network bị treo. Không xem asyncio cancellation là bằng chứng đã dừng I/O.
- Chưa benchmark dữ liệu lớn; cần giới hạn container/process và kiểm thử tải trước khi cho nguồn lớn vào production.
- Chưa bật bắt buộc policy toàn hệ thống, chưa có policy registry và chưa có quarantine lưu file bị chặn.
- Chưa chạy live PostgreSQL/MinIO trong lần triển khai này vì Docker daemon chưa chạy.

Test regression hiện có dùng file CSV/Excel thật, connector PostgreSQL/MinIO giả lập và kiểm tra output Parquet thật.
Kết quả lần triển khai: 165 test pass (gồm 41 test runtime mới); Ruff đạt và Mypy không báo lỗi
trong 6 file logic đã kiểm tra. Bộ này không thay thế nghiệm thu live hoặc benchmark tải.
Sau khi bật Docker, cần kiểm thử ba nguồn thật, xác minh report được commit trước upload,
kiểm tra dữ liệu sai không tạo object, và schema PostgreSQL rỗng vẫn được giữ khi đọc lại Parquet.
