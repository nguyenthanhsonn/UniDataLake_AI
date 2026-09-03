# 🚀 Hướng Dẫn Cài Đặt & Sử Dụng UniLake AI

Tài liệu này hướng dẫn chi tiết từng bước dành cho các thành viên team **UniLake AI** khi clone dự án về máy cá nhân, thiết lập môi trường phát triển (Development Environment), chạy ứng dụng và kiểm tra mã nguồn.

Nếu bạn phụ trách chuyên sâu từng phần, đọc thêm:

- [Hướng dẫn Backend](docs/backend.md)
- [Hướng dẫn Frontend](docs/frontend.md)

Repo hỗ trợ nhiều IDE. VS Code có file gợi ý extension riêng trong `frontend/.vscode/`, còn Antigravity/Cursor/WebStorm/PyCharm có thể dùng các file chuẩn như `.editorconfig`, `backend/pyproject.toml`, `frontend/tsconfig.json`, `frontend/eslint.config.mjs` và `frontend/.prettierrc`.

---

## 📋 Mục lục

1. [Yêu cầu hệ thống (Prerequisites)](#1-yêu-cầu-hệ-thống-prerequisites)
2. [Bước 1: Clone Repository](#bước-1-clone-repository)
3. [Bước 2: Thiết lập môi trường Backend (Python & venv)](#bước-2-thiết-lập-môi-trường-backend-python--venv)
4. [Bước 3: Kích hoạt Git Pre-commit Hooks](#bước-3-kích-hoạt-git-pre-commit-hooks)
5. [Bước 4: Khởi động Hạ tầng (Docker Compose)](#bước-4-khởi-động-hạ-tầng-docker-compose)
6. [Bước 5: Chạy Backend Server (FastAPI / Uvicorn)](#bước-5-chạy-backend-server-fastapi--uvicorn)
7. [Bước 6: Chạy Frontend (Next.js)](#bước-6-chạy-frontend-nextjs)
8. [Bước 7: Bộ công cụ kiểm tra Code Quality & Testing](#bước-7-bộ-công-cụ-kiểm-tra-code-quality--testing)
9. [Bước 8: GitHub Automation cho Pull Request](#bước-8-github-automation-cho-pull-request)
10. [Bước 9: Database Migration với Alembic](#bước-9-database-migration-với-alembic)
11. [🛠️ Bảng tra cứu lỗi thường gặp (Troubleshooting)](#-bảng-tra-cứu-lỗi-thường-gặp-troubleshooting)

---

## 1. Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

- **Python**: `3.11` hoặc mới hơn (`python3 --version`)
- **Node.js**: `20+` LTS và `npm` (`node -v` & `npm -v`)
- **Docker** & **Docker Compose**: Đã khởi động Docker Desktop (`docker --version`)
- **Git**: Đã cài đặt và cấu hình SSH/HTTP (`git --version`)

---

## 2. Bước 1: Clone Repository

Mở Terminal (macOS/Linux) hoặc PowerShell/Git Bash (Windows) và chạy:

```bash
git clone https://github.com/<your-org>/UniDataLake_AI.git
cd UniDataLake_AI
```

---

## 3. Bước 2: Thiết lập môi trường Backend (Python & venv)

### 3.1. Tạo môi trường ảo (Virtual Environment)
Tạo môi trường ảo tên `.venv` tại thư mục gốc dự án:

```bash
# macOS / Linux
python3 -m venv .venv

# Windows
python -m venv .venv
```

### 3.2. Kích hoạt Virtual Environment (BẮT BUỘC)
Mỗi khi mở Terminal mới để làm việc với Python, bạn cần kích hoạt môi trường ảo:

- **macOS / Linux**:
  ```bash
  source .venv/bin/activate
  ```
- **Windows (PowerShell)**:
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
- **Windows (CMD)**:
  ```cmd
  .venv\Scripts\activate.bat
  ```

*(Sau khi kích hoạt thành công, đầu dòng Terminal sẽ xuất hiện tiền tố `(.venv)`)*.

### 3.3. Cài đặt Dependencies & Dev Tools
Cài đặt tất cả gói phụ thuộc Backend và bộ công cụ kiểm thử ở chế độ Editable (`-e`):

```bash
pip install -e "backend[dev]"
```

### 3.4. Cấu hình biến môi trường (`.env`)
Tạo file cấu hình môi trường từ file mẫu:

```bash
cp .env.example .env
```
*(Chỉnh sửa lại các thông tin credentials trong file `.env` nếu cần thiết)*.

---

## 4. Bước 3: Kích hoạt Git Pre-commit Hooks

Pre-commit sẽ tự động kiểm tra cú pháp, format code (Ruff), kiểu dữ liệu (Mypy) và định dạng commit message trước khi bạn thực hiện `git commit`.

Cài đặt hooks vào Git:

```bash
pre-commit install
pre-commit install --hook-type commit-msg
```

**Kiểm tra xem pre-commit hoạt động bình thường chưa:**
```bash
pre-commit run --all-files
```
*(Nếu tất cả đều báo `Passed`, bạn đã cài đặt thành công)*.

---

## 5. Bước 4: Khởi động Hạ tầng (Docker Compose)

Khởi động các dịch vụ phụ trợ như PostgreSQL, MinIO (Object Storage), Redis:

```bash
docker compose up -d
```

Kiểm tra trạng thái các container đang chạy:
```bash
docker compose ps
```

---

## 6. Bước 5: Chạy Backend Server (FastAPI / Uvicorn)

Do mã nguồn backend nằm ở thư mục `backend/app/`, có 2 cách chạy server:

### Cách 1: Chạy từ thư mục gốc (Root) — Khuyên dùng
```bash
# Đảm bảo đã activate .venv
source .venv/bin/activate

# Chạy uvicorn với flag --app-dir backend
uvicorn app.main:app --app-dir backend --reload --port 8000
```

### Cách 2: Chuyển vào thư mục `backend/` rồi chạy
```bash
cd backend
source ../.venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 📌 Đường dẫn truy cập sau khi server chạy:
- **Swagger API Docs (tương tác trực tiếp)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 7. Bước 6: Chạy Frontend (Next.js)

Mở một cửa sổ Terminal mới:

```bash
cd frontend
pnpm install
pnpm dev
```

- **Địa chỉ Frontend Web**: [http://localhost:3000](http://localhost:3000)

---

## 8. Bước 7: Bộ công cụ kiểm tra Code Quality & Testing

Trước khi tạo Pull Request, vui lòng kiểm tra code bằng bộ công cụ sau:

### 8.1. Linting & Auto-fix với Ruff
```bash
# Kiểm tra lỗi và tự động sửa các lỗi cơ bản
ruff check backend --fix

# Format lại code chuẩn PEP 8
ruff format backend
```

### 8.2. Static Type Check với Mypy
```bash
mypy --config-file backend/pyproject.toml backend/app
```

### 8.3. Chạy Unit Test & Kiểm tra Code Coverage
```bash
cd backend
pytest
```

---

## 9. Bước 8: GitHub Automation cho Pull Request

Repo đã được cấu hình một số automation trong thư mục `.github/` để giảm việc gắn nhãn thủ công và giúp team theo dõi PR nhất quán hơn.

### 9.1. Dependabot - tự động cập nhật dependencies

File cấu hình: `.github/dependabot.yml`

Dependabot sẽ tự kiểm tra dependency mới và tạo Pull Request định kỳ:

- **Python backend**: kiểm tra `backend/pyproject.toml` mỗi thứ Hai lúc `02:00` theo múi giờ `Asia/Ho_Chi_Minh`.
- **GitHub Actions**: kiểm tra mỗi thứ Hai lúc `03:00` theo múi giờ `Asia/Ho_Chi_Minh`.
- PR Dependabot sẽ tự có label như `dependencies`, `area/backend`, `area/devops`, `python`, `ci-cd`.
- Một số package liên quan được gom nhóm thành một PR, ví dụ `fastapi-stack`, `data-stack`, `dev-tools`, `actions-all`.

Khi review PR từ Dependabot, member cần:

1. Đọc changelog hoặc release note nếu dependency có thay đổi lớn.
2. Chạy test/lint ở local nếu PR ảnh hưởng phần đang phụ trách.
3. Kiểm tra CI trên GitHub đã pass trước khi merge.
4. Không merge vội các dependency quan trọng như `fastapi`, `pydantic`, `sqlalchemy`, `langchain` nếu chưa test API chính.

Hiện tại repo bật Dependabot cho Python trong thư mục `backend/`, JavaScript/TypeScript trong thư mục `frontend/`, và GitHub Actions. Docker sẽ bật sau khi Dockerfile có nội dung dependency thật.

### 9.2. Frontend ESLint + Prettier

File cấu hình:

- `frontend/eslint.config.mjs`: ESLint 9 flat config cho Next.js/TypeScript/React/Tailwind.
- `frontend/.prettierrc`: Prettier dùng `printWidth: 100`, đồng bộ với Ruff backend.
- `frontend/.prettierignore`: bỏ qua `node_modules`, build output, lockfile và report.
- `frontend/tsconfig.json`: TypeScript strict mode cho Next.js App Router.
- `frontend/.vscode/settings.json` và `frontend/.vscode/extensions.json`: cấu hình VS Code khuyến nghị cho frontend.
- `.editorconfig`: cấu hình indent, line ending và final newline dùng chung cho Antigravity, VS Code, Cursor, WebStorm/PyCharm và IDE khác.

Lệnh kiểm tra frontend trước khi tạo PR:

```bash
cd frontend
pnpm lint
pnpm format:check
pnpm type-check
pnpm build
```

Nếu muốn tự động sửa lint/format:

```bash
cd frontend
pnpm lint:fix
pnpm format
```

Kiểm tra Lighthouse local:

```bash
cd frontend
pnpm build
pnpm lighthouse
```

Lighthouse cần Chrome/Chromium trên máy. Trên GitHub Actions, workflow frontend đã có bước cài Chrome tự động trước khi chạy Lighthouse CI.

### 9.3. Pull Request Labeler - tự động gắn label cho PR

File cấu hình:

- `.github/labeler.yml`: định nghĩa rule gắn label.
- `.github/workflows/labeler.yml`: workflow chạy `actions/labeler`.

Khi một PR được mở, cập nhật hoặc mở lại, workflow sẽ tự gắn label dựa trên file thay đổi và tên branch.

Các label chính:

| Label | Khi nào được gắn |
| :--- | :--- |
| `area/backend` | Sửa `backend/**`, `backend/pyproject.toml`, `backend/requirements*.txt` |
| `area/frontend` | Sửa `frontend/**` |
| `area/devops` | Sửa `.github/**`, Docker, `infra/**`, pre-commit/config |
| `area/data` | Sửa `data/**`, `notebooks/**` |
| `area/docs` | Sửa `docs/**`, file Markdown hoặc template GitHub |
| `tests` | Sửa thư mục/file test |
| `dependencies` | Sửa dependency manifest/lockfile hoặc branch `dependabot/*` |
| `ci-cd` | Sửa `.github/workflows/**` |
| `security` | Sửa cấu hình security hoặc branch có chữ `security` |
| `feature`, `bug`, `chore` | Dựa trên prefix tên branch |

Quy ước tên branch khuyến nghị:

```bash
feature/<short-description>
feat/<short-description>
fix/<short-description>
bugfix/<short-description>
chore/<short-description>
docs/<short-description>
ci/<short-description>
refactor/<short-description>
```

Ví dụ:

```bash
git checkout -b feature/add-bronze-ingestion
git checkout -b fix/backend-health-check
git checkout -b docs/update-setup-guide
```

Lưu ý cho member:

- Labeler chỉ tự thêm label phù hợp, không tự xóa label do người khác đặt.
- Nếu label thiếu hoặc sai do PR quá đặc biệt, có thể chỉnh label thủ công trên GitHub.
- PR lớn trên 100 file thay đổi sẽ bỏ qua label theo file để tránh gắn quá nhiều label.
- Label giúp reviewer lọc PR nhanh hơn, vì vậy không nên xóa label nếu không có lý do rõ ràng.

---

## 10. Bước 9: Database Migration với Alembic

Backend sử dụng Alembic để quản lý thay đổi schema PostgreSQL. Cấu hình nằm trong:

- `backend/alembic.ini`
- `backend/alembic/env.py`
- `backend/alembic/script.py.mako`
- `backend/alembic/versions/`
- `backend/app/core/config.py`
- `backend/app/core/database.py`

### 10.1. Chạy migration hiện có

```bash
# Đảm bảo PostgreSQL đang chạy
docker compose up -d

# Apply tất cả migration còn thiếu
make db-upgrade

# Xem revision hiện tại
make db-current
```

### 10.2. Tạo migration mới

Khi member sửa hoặc thêm SQLAlchemy model trong các module như `auth`, `ingest`, `pipeline`, `governance`, `query`, `ai_engine`, tạo migration bằng:

```bash
make db-migrate MSG="add users table"
```

Sau khi Alembic tạo file trong `backend/alembic/versions/`, cần:

1. Mở file migration vừa tạo và review kỹ phần `upgrade()` / `downgrade()`.
2. Chạy `make db-upgrade` để test migration.
3. Commit file migration vào Git.

Không được ignore hoặc bỏ commit file `backend/alembic/versions/*.py`, vì member khác cần các file này để đồng bộ database.

---

## 🛠️ Bảng tra cứu lỗi thường gặp (Troubleshooting)

| Sự cố / Thông báo lỗi | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **`zsh: command not found: ruff`** (hoặc `pytest`, `mypy`) | Bạn chưa kích hoạt môi trường ảo `.venv` trong phiên terminal hiện tại. | Chạy `source .venv/bin/activate` hoặc dùng `.venv/bin/ruff`. |
| **`ERROR: Could not import module "app.main"`** | Uvicorn không tìm thấy thư mục `app` khi bạn đứng ở gốc dự án. | Thêm flag `--app-dir backend`: `uvicorn app.main:app --app-dir backend --reload --port 8000`. |
| **`[Errno 48] Address already in use`** | Cổng `8000` đang bị chiếm bởi một tiến trình Uvicorn cũ chưa tắt. | Tắt tiến trình cũ: `lsof -i :8000` sau đó `kill -9 <PID>`, hoặc đổi port `--port 8001`. |
| **`pre-commit` báo lỗi khi `git commit`** | Code chứa lỗi format, unused import hoặc sai type annotation. | Chạy `ruff check backend --fix` và `ruff format backend`, sửa lỗi theo báo cáo rồi `git add .` và commit lại. |
| **`Commit message invalid`** | Tên commit không theo chuẩn Conventional Commits. | Đặt lại tên commit theo mẫu: `feat(scope): description` hoặc `fix(scope): description`. |

---

> 💡 **Mẹo**: Hãy chạy `pre-commit run --all-files` trước khi đẩy branch lên GitHub để chắc chắn CI/CD Build sẽ không bị FAILED!
