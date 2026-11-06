# Báo cáo kiểm thử kết nối Frontend với REST API (UDL-192)

Cập nhật: 06/11/2026. Người thực hiện: Trương Đình Đạt.

Tài liệu đối chiếu chính: **UniLake — Handoff API cho frontend**, bản cập nhật
05/11/2026 (19 endpoint nghiệp vụ, 2 endpoint hệ thống) và acceptance criteria
của Jira UDL-192.

## 1. Kết luận

| Hạng mục                            | Kết quả                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| CORS                                | ✅ Frontend dùng được từ `localhost:3000/3001`; origin lạ bị chặn                           |
| Login, refresh, logout              | ✅ Đã tích hợp và có kiểm thử tự động                                                       |
| Danh sách / thu hồi phiên đăng nhập | ✅ Đã nối `GET /auth/sessions`, `POST /auth/revoke-session/{id}`                            |
| Nguồn dữ liệu                       | ✅ ADMIN, DATA_ADMIN quản lý; VIEWER có giao diện chỉ xem                                   |
| Ingestion                           | ✅ Danh sách, tạo job, xem chi tiết; tự poll job đang chạy                                  |
| Cleaning Bronze → Silver            | ✅ Có thao tác từ chi tiết job cho ADMIN / DATA_ADMIN                                       |
| Catalog                             | ⚠️ Frontend mới dùng endpoint danh sách; backend checkout hiện tại chưa có 4 route CRUD mới |
| 9 role                              | ⚠️ Frontend đã nhận đủ 9 role; backend/seed checkout hiện tại vẫn là bộ role cũ             |
| Kiểm tra mã frontend                | ✅ Type-check, lint, 85/85 test và production build đều đạt                                 |

Frontend hiện tích hợp **15/19 endpoint nghiệp vụ** trong handoff. Bốn endpoint
chưa thể nối hoàn chỉnh đều thuộc Catalog CRUD và chưa tồn tại trong backend
đang checkout.

## 2. Endpoint đã nối

| Nhóm        | Endpoint                                          | Nơi dùng                                   | Trạng thái                      |
| ----------- | ------------------------------------------------- | ------------------------------------------ | ------------------------------- |
| Auth        | `POST /auth/login`                                | Trang đăng nhập                            | ✅                              |
| Auth        | `POST /auth/refresh`                              | Axios interceptor khi access token hết hạn | ✅                              |
| Auth        | `POST /auth/logout`                               | Menu người dùng                            | ✅                              |
| Auth        | `GET /auth/sessions`                              | Dialog “Phiên đăng nhập”                   | ✅ Mới                          |
| Auth        | `POST /auth/revoke-session/{session_id}`          | Dialog “Phiên đăng nhập”                   | ✅ Mới                          |
| Data source | `GET /datasources`                                | ADMIN, DATA_ADMIN, VIEWER                  | ✅                              |
| Data source | `GET /datasources/{id}`                           | Form sửa                                   | ✅                              |
| Data source | `POST /datasources/create`                        | Form thêm                                  | ✅                              |
| Data source | `PATCH /datasources/{id}`                         | Form sửa, bật/tắt                          | ✅                              |
| Ingestion   | `GET /ingestion/jobs`                             | Danh sách, KPI, poll                       | ✅                              |
| Ingestion   | `GET /ingestion/jobs/{job_id}`                    | Dialog chi tiết, poll                      | ✅ Mới                          |
| Ingestion   | `POST /ingestion/jobs`                            | Form tạo job                               | ✅                              |
| Cleaning    | `POST /pipeline/cleaning/ingestion-jobs/{job_id}` | Dialog chi tiết job                        | ✅ Mới                          |
| Catalog     | `GET /governance/catalog`                         | Data Catalog / Explore                     | ✅                              |
| NLQ demo    | `POST /nlq/ask`                                   | Hỏi UniLake AI                             | ✅ Backend vẫn trả dữ liệu demo |

Chưa nối vì backend checkout hiện tại chưa đăng ký route:

- `GET /governance/catalog/{domain_id}/{dataset}`
- `POST /governance/catalog`
- `PATCH /governance/catalog/{domain_id}/{dataset}`
- `DELETE /governance/catalog/{domain_id}/{dataset}`

## 3. Ma trận quyền frontend theo handoff 05/11

| Role                 | Phiên   | Nguồn dữ liệu | Ingestion | Cleaning | Catalog    | NLQ  |
| -------------------- | ------- | ------------- | --------- | -------- | ---------- | ---- |
| `ADMIN`              | Quản lý | Đọc / ghi     | Đọc / tạo | Chạy     | Không hiện | Dùng |
| `DATA_ADMIN`         | Quản lý | Đọc / ghi     | Đọc / tạo | Chạy     | Quản lý    | Dùng |
| `VIEWER`             | Quản lý | Chỉ xem       | Chỉ xem   | Không    | Không      | Dùng |
| `ADMISSIONS_MANAGER` | Quản lý | Không         | Không     | Không    | Không      | Dùng |
| `ADMISSIONS_STAFF`   | Quản lý | Không         | Không     | Không    | Không      | Dùng |
| `ACADEMIC_MANAGER`   | Quản lý | Không         | Không     | Không    | Không      | Dùng |
| `ACADEMIC_STAFF`     | Quản lý | Không         | Không     | Không    | Không      | Dùng |
| `HR_MANAGER`         | Quản lý | Không         | Không     | Không    | Không      | Dùng |
| `HR_STAFF`           | Quản lý | Không         | Không     | Không    | Không      | Dùng |

`ADMIN` không còn được frontend tự động cho vào mọi workspace. Route được kiểm
tra theo đúng role; backend vẫn là lớp phân quyền cuối cùng. Hai role cũ
`ANALYST`, `MANAGER` chỉ còn alias chuyển tiếp về VIEWER để tài khoản seed cũ
không rơi vào trang lỗi trong giai đoạn backend chuyển đổi.

## 4. Sai khác giữa handoff mới và backend checkout hiện tại

| Handoff 05/11                                      | Backend / seed hiện tại                                                          | Ảnh hưởng                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| 9 role chính thức                                  | Seed vẫn có `ADMIN`, `SUPER_ADMIN`, `DATA_ADMIN`, `ANALYST`, `MANAGER`, `VIEWER` | Chưa thể login E2E bằng 6 role domain mới         |
| 9 tài khoản mẫu tương ứng                          | Seed chỉ có `admin`, `dataadmin`, `analyst`, `manager`, `viewer`                 | Sáu tài khoản mới chưa tồn tại                    |
| Catalog chỉ `DATA_ADMIN` quản lý; `ADMIN` nhận 403 | Router catalog hiện chỉ có GET danh sách và chưa gắn dependency role             | Chưa kiểm được Catalog CRUD / quyền đúng contract |
| Catalog có detail + CRUD                           | Backend hiện chỉ có `GET /governance/catalog`                                    | Frontend chưa bật form quản lý Catalog            |

Kết luận: frontend đã sẵn cấu hình 9 role và không cần sửa backend trong nhánh
này, nhưng acceptance test đầy đủ 9 tài khoản chỉ chạy được sau khi backend
merge role/seed và Catalog API theo handoff.

## 5. Kiểm thử tự động 06/11

Chạy trong `frontend/`:

```text
tsc --noEmit                         PASS
eslint . --max-warnings=0            PASS
vitest run --passWithNoTests         13 files, 85 tests PASS
next build                           PASS, 38 routes generated
```

Các test mới kiểm tra thêm:

- capability và route của 9 role;
- ADMIN không tự động truy cập workspace role khác;
- lỗi login khi mất kết nối / lỗi 5xx không bị báo nhầm “sai mật khẩu”;
- client danh sách / thu hồi phiên;
- mở quản lý phiên từ menu người dùng.
- cấu hình đủ 6 loại nguồn, gồm PostgreSQL / RDBMS và kiểm tra port.

## 6. Smoke test Docker và UI 06/11

Môi trường `docker compose up -d --build` chạy đủ frontend, backend, PostgreSQL,
Redis, MinIO và ingestion worker. Kết quả live:

| Kiểm tra                                                               | Kết quả                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| `GET http://localhost:3000/login` / `GET http://localhost:8000/health` | 200 / 200                                                |
| Login `admin`, `dataadmin`, `analyst`, `manager`, `viewer`             | 200; UI chuyển lần lượt về ADMIN, DATA_ADMIN hoặc VIEWER |
| Login 6 username domain mới                                            | 401 vì backend chưa seed; UI hiện đúng lỗi đăng nhập     |
| ADMIN mở trang nguồn dữ liệu và dialog phiên                           | ✅                                                       |
| VIEWER mở nguồn dữ liệu chỉ xem                                        | ✅                                                       |
| List / revoke session                                                  | 200; danh sách giảm đúng 1 phiên sau revoke              |
| Route guard ADMIN → workspace role khác                                | Chuyển về `/admin`                                       |
| Route guard VIEWER → `/admin`                                          | Chuyển về `/viewer`                                      |
| CORS origin `localhost:3000`                                           | Preflight 200, có allow-origin                           |
| CORS origin lạ                                                         | Preflight 400, không có allow-origin                     |

Phát hiện backend live: `GET /governance/catalog` trả 200 cho ADMIN, DATA_ADMIN,
VIEWER **và cả request không có token**. Đây là bằng chứng route Catalog hiện
chưa áp xác thực/phân quyền như handoff.

## 7. Việc backend cần bàn giao để đóng hoàn toàn UDL-192

1. Merge role và seed 9 tài khoản đúng danh sách trong handoff.
2. Đăng ký đủ 4 endpoint Catalog detail / create / update / delete và quyền
   `DATA_ADMIN`.
3. Cung cấp dataset Bronze hợp lệ để chạy happy path ingestion → cleaning →
   Silver.
4. Sau khi backend mới có mặt trên `developer`, chạy lại ma trận 9 tài khoản và
   cập nhật phần live E2E trong báo cáo này.
