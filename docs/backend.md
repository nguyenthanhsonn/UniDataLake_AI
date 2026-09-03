# Hướng dẫn Backend - UniLake AI

Tài liệu này dành cho member làm backend, data engineering, AI backend hoặc database migration trong dự án UniLake AI.

---

## 1. Tổng quan

Backend được xây dựng bằng **Python 3.11+**, **FastAPI**, **SQLAlchemy 2.0 async** và **Alembic**. Dự án dùng kiến trúc **Modular Monolith**: backend chạy trong một ứng dụng FastAPI duy nhất, nhưng code được chia theo module nghiệp vụ.

Các module chính:

| Module | Mục đích |
| :--- | :--- |
| `auth` | Xác thực, phân quyền, JWT, RBAC |
| `ingest` | Thu thập dữ liệu vào lớp Bronze |
| `pipeline` | ETL/ELT từ Bronze sang Silver/Gold |
| `governance` | Data Catalog, Lineage, Data Quality |
| `query` | API truy vấn dashboard, export dữ liệu |
| `ai_engine` | Text-to-SQL, Intent Parser, What-If, OR-Tools |

---

## 2. Cấu trúc thư mục

```text
backend/
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   ├── README
│   └── versions/
├── app/
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   ├── modules/
│   │   ├── auth/
│   │   ├── ingest/
│   │   ├── pipeline/
│   │   ├── governance/
│   │   ├── query/
│   │   └── ai_engine/
│   ├── shared/
│   └── main.py
├── tests/
└── pyproject.toml
```

Quy ước khi thêm code vào module:

```text
app/modules/<module_name>/
├── __init__.py
├── models.py      # SQLAlchemy models
├── schemas.py     # Pydantic schemas
├── service.py     # Business logic
├── repository.py  # Database access
└── router.py      # FastAPI routes
```

Chưa cần tạo đủ các file nếu module chưa dùng tới. Nhưng khi có table database, model phải đặt trong `models.py` và kế thừa `Base` từ `app.core.database`.

---

## 3. Cài đặt môi trường

Từ thư mục root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e "backend[dev]"
cp .env.example .env
```

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e "backend[dev]"
copy .env.example .env
```

---

## 4. Biến môi trường

Backend đọc cấu hình từ `.env` thông qua `backend/app/core/config.py`.

Các biến quan trọng:

| Biến | Mục đích | Mặc định |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Môi trường chạy app | `development` |
| `DEBUG` | Bật/tắt debug | `true` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL username | `unilake` |
| `DB_PASSWORD` | PostgreSQL password | `unilake` |
| `DB_NAME` | PostgreSQL database | `unilake` |
| `DB_ECHO` | Log SQL query | `false` |
| `JWT_SECRET_KEY` | Secret ký JWT | cần đổi khi production |
| `LLM_API_KEY` | API key cho LLM provider | rỗng |

Không commit `.env` lên Git.

---

## 5. Chạy backend

Chạy từ root:

```bash
source .venv/bin/activate
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Hoặc chạy từ thư mục `backend/`:

```bash
cd backend
source ../.venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Các endpoint mặc định:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

---

## 6. Database và SQLAlchemy

File chính:

- `backend/app/core/config.py`: settings và database URL.
- `backend/app/core/database.py`: async engine, session factory, `Base`.

Khi viết model:

```python
from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
```

Lưu ý:

- Dùng SQLAlchemy 2.0 typed mapping: `Mapped[...]`, `mapped_column`.
- Không tạo engine/session riêng trong từng module.
- Dùng `get_db` từ `app.core.database` cho FastAPI dependency.
- Không hardcode database credentials trong code.

---

## 7. Alembic migration

Các lệnh nhanh từ root:

```bash
make db-upgrade
make db-current
make db-history
make db-migrate MSG="add users table"
make db-downgrade
```

Quy trình tạo migration:

1. Sửa hoặc thêm model trong `backend/app/modules/<module>/models.py`.
2. Đảm bảo model được import trong `backend/alembic/env.py`.
3. Chạy:

```bash
make db-migrate MSG="add users table"
```

4. Mở file mới trong `backend/alembic/versions/` và review kỹ.
5. Chạy:

```bash
make db-upgrade
```

6. Commit file migration `.py` vào Git.

Không chỉnh sửa migration đã được merge/shared. Nếu cần thay đổi schema tiếp, tạo migration mới.

---

## 8. Code quality

Chạy trước khi tạo PR:

```bash
ruff check backend
ruff format backend --check
mypy --config-file backend/pyproject.toml backend/app
cd backend && pytest
```

Tự sửa format/lint cơ bản:

```bash
ruff check backend --fix
ruff format backend
```

Pre-commit ở root sẽ tự chạy Ruff, Mypy và các check file cơ bản trước khi commit.

---

## 9. Testing

Test backend nằm trong `backend/tests/`.

Chạy toàn bộ test:

```bash
cd backend
pytest
```

Chạy một file:

```bash
cd backend
pytest tests/test_main.py
```

Chạy theo tên test:

```bash
cd backend
pytest -k "health"
```

Coverage hiện được cấu hình trong `backend/pyproject.toml` với ngưỡng tối thiểu `70%`.

---

## 10. CI backend

Workflow: `.github/workflows/ci-backend.yml`

CI chạy khi PR/push vào `main` hoặc `develop` có thay đổi trong `backend/**`.

Các bước CI:

1. Cài Python 3.11.
2. Cài dependency bằng `python -m pip install -e "backend[dev]"`.
3. Chạy `ruff check backend`.
4. Chạy `ruff format backend --check`.
5. Chạy `mypy --config-file backend/pyproject.toml backend/app`.
6. Chạy `cd backend && alembic upgrade head` với PostgreSQL service.
7. Chạy `cd backend && pytest`.

---

## 11. Quy ước khi làm backend

- Tạo branch theo dạng `feature/BE-...`, `fix/BE-...`, `chore/BE-...`.
- Commit theo Conventional Commits, ví dụ `feat(auth): add login endpoint`.
- API response nên có schema Pydantic rõ ràng.
- Business logic đặt trong `service.py`, tránh viết hết trong router.
- Database query đặt trong `repository.py` khi logic bắt đầu phức tạp.
- Không commit credentials, data lớn, file cache hoặc generated output.
- PR có sửa schema database phải kèm Alembic migration.

---

## 12. IDE setup

Backend không phụ thuộc riêng VS Code. Các IDE như Antigravity, PyCharm, Cursor hoặc VS Code nên dùng chung các file chuẩn:

- `.editorconfig`: indent, line ending, charset, final newline.
- `backend/pyproject.toml`: Ruff, Mypy, Pytest và dependency metadata.
- `.pre-commit-config.yaml`: hook chạy trước khi commit.

Thiết lập khuyến nghị:

1. Mở root repo `UniDataLake_AI`.
2. Chọn Python interpreter là `.venv/bin/python`.
3. Bật format/lint bằng Ruff.
4. Bật type checking bằng Mypy với config `backend/pyproject.toml`.
5. Chạy terminal từ root khi dùng `make db-*`, hoặc từ `backend/` khi chạy `pytest`.

---

## 13. Checklist trước khi mở PR backend

- [ ] Code chạy được ở local.
- [ ] Đã chạy `ruff check backend`.
- [ ] Đã chạy `ruff format backend --check`.
- [ ] Đã chạy `mypy --config-file backend/pyproject.toml backend/app`.
- [ ] Đã chạy `cd backend && pytest`.
- [ ] Nếu sửa database schema, đã tạo và test Alembic migration.
- [ ] Không commit `.env`, cache, data lớn hoặc secret.
