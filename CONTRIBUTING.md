# 🤝 Contributing to UniLake AI

> Cảm ơn bạn đã quan tâm đến việc đóng góp cho **UniLake AI**! Tài liệu này hướng dẫn quy trình làm việc, chuẩn code và các quy ước dành cho team **C1SE.11** trong suốt 12 tuần Capstone Project.

---

## 📋 Table of Contents

1. [Code of Conduct](#-code-of-conduct)
2. [Team & Roles](#-team--roles)
3. [Development Setup](#-development-setup)
4. [Branching Strategy](#-branching-strategy)
5. [Commit Message Convention](#-commit-message-convention)
6. [Pull Request Process](#-pull-request-process)
7. [Code Style & Linting](#-code-style--linting)
8. [Testing Guidelines](#-testing-guidelines)
9. [Module-Specific Guidelines](#-module-specific-guidelines)
10. [Issue Reporting](#-issue-reporting)
11. [Communication](#-communication)
12. [Getting Help](#-getting-help)

---

## 🧭 Code of Conduct

Chúng ta làm việc với tinh thần **tôn trọng, hợp tác và học hỏi**:

- ✅ Tôn trọng ý kiến của nhau, phản biện dựa trên code/data, không công kích cá nhân.
- ✅ Review code kỹ lưỡng, đưa ra feedback mang tính xây dựng.
- ✅ Cam kết với deadline Sprint, báo sớm nếu có nguy cơ trễ.
- ✅ Không commit file nhạy cảm (`.env`, credentials, API keys).
- ✅ Tuân thủ quy tắc sử dụng AI có kiểm soát (theo Section 13 của Proposal).



> 📌 **Mọi thay đổi lớn về kiến trúc** phải được **Sơn (Backend Lead)** review trước khi merge.


## 💻 Development Setup

### Prerequisites

- **Python** 3.11+
- **Node.js** 20+ (LTS)
- **Docker** & **Docker Compose**
- **Git** (with SSH key configured)
- **IDE bất kỳ** có hỗ trợ EditorConfig, ESLint/Prettier và Python/TypeScript tooling. VS Code, Antigravity, Cursor, WebStorm/PyCharm đều dùng được.

### 1. Clone the repository

```bash
git clone git@github.com:<your-org>/unilake-ai.git
cd unilake-ai
```

### 2. Start infrastructure

```bash
docker compose up -d   # PostgreSQL, MinIO, Redis
```

### 3. Backend setup

```bash
# Tạo môi trường ảo tại root dự án
python3 -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Cài đặt dependencies + dev tools + pre-commit hooks
pip install -e "backend[dev]"
pre-commit install               # Setup git pre-commit hook
pre-commit install --hook-type commit-msg # Setup commit message hook
cp .env.example .env             # Edit với credentials của bạn

# Chạy server Uvicorn từ root
uvicorn app.main:app --app-dir backend --reload --port 8000
```

### 4. Frontend setup

```bash
cd frontend
pnpm install
pnpm dev                         # http://localhost:3000
```

### 5. Verify setup

- Backend API docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- MinIO Console: http://localhost:9001

### 6. Database migrations

```bash
make db-upgrade
make db-migrate MSG="add users table"
make db-current
```

Migration files are stored in `backend/alembic/versions/` and must be committed.

---

## 🌿 Branching Strategy

Chúng ta dùng **GitHub Flow** đơn giản hóa, phù hợp với team 5 người:

```
main           ← Production-ready, protected, chỉ merge từ develop
  └── develop  ← Integration branch, protected, merge từ feature/*
       ├── feature/BE-auth-jwt
       ├── feature/DE-pipeline-bronze
       ├── feature/AI-text-to-sql
       ├── feature/FE-dashboard
       ├── bugfix/fix-lineage-ui
       └── hotfix/critical-api
```

### Branch Naming Convention

```
<type>/<module>-<short-description>
```

| Type | Module | Example |
|------|--------|---------|
| `feature` | `BE`, `FE`, `AI`, `DE`, `INFRA`, `DOCS` | `feature/BE-auth-jwt` |
| `bugfix` | same | `bugfix/FE-chatbot-scroll` |
| `hotfix` | same | `hotfix/BE-critical-auth` |
| `release` | — | `release/v1.0.0` |

**Modules:**
- `BE` — Backend (auth, query, governance)
- `DE` — Data Engineering (ingest, pipeline)
- `AI` — AI/ML (text-to-sql, OR-Tools)
- `FE` — Frontend
- `INFRA` — DevOps/Docker/CI
- `DOCS` — Documentation

### Rules

- ❌ **KHÔNG** push thẳng lên `main` hoặc `develop`.
- ✅ Luôn tạo **Pull Request** và cần ít nhất **1 approval**.
- ✅ Branch phải **rebase** từ `develop` mới nhất trước khi merge.
- ✅ Xóa branch sau khi merge.

---

## 💬 Commit Message Convention

Chúng ta dùng **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(<scope>): <short description>
```

### Types

| Type | Mô tả |
|------|-------|
| `feat` | Tính năng mới |
| `fix` | Sửa bug |
| `docs` | Thay đổi tài liệu |
| `style` | Format, không thay đổi logic |
| `refactor` | Tái cấu trúc code |
| `perf` | Tối ưu hiệu năng |
| `test` | Thêm/sửa test |
| `chore` | Build, CI, dependencies |
| `ci` | Thay đổi CI/CD |

### Scopes

`auth`, `ingest`, `pipeline`, `governance`, `query`, `ai_engine`, `fe`, `infra`, `docs`, `deps`

### Examples

```bash
feat(auth): add JWT refresh token endpoint
feat(ai): implement text-to-sql with LangChain
fix(pipeline): handle null values in Bronze ingestion
docs(api): update OpenAPI spec for query module
test(governance): add unit tests for data quality rules
chore(deps): upgrade FastAPI to 0.115.0
refactor(ai): extract prompt templates to separate module
perf(query): optimize dashboard aggregation queries
```

### Commit Body (optional but recommended)

```bash
feat(pipeline): add DuckDB-based Bronze to Silver transformation

- Implement ETL for Admissions domain
- Add schema validation with Pydantic
- Handle encoding detection for CSV files
- Add unit tests covering 15 edge cases

Closes #42
```

> 💡 **Tip:** Dùng `git commit -m "..."` cho commit ngắn, và `git commit` (mở editor) cho commit dài có body.

---

## 🔀 Pull Request Process

### 1. Before creating PR

- [ ] Rebase từ `develop` mới nhất: `git pull --rebase origin develop`
- [ ] Chạy test local: `cd backend && pytest` (backend) / `pnpm test` (frontend)
- [ ] Chạy linter: `ruff check backend` / `pnpm lint`
- [ ] Nếu sửa model/database schema, tạo và test Alembic migration
- [ ] Đảm bảo CI passes (GitHub Actions sẽ tự chạy)

### 2. Create PR

- **Title:** Theo commit convention, ví dụ: `feat(auth): add JWT refresh token endpoint`
- **Description:** Dùng template có sẵn (`.github/PULL_REQUEST_TEMPLATE.md`)
- **Assignees:** Chính bạn
- **Reviewers:** Ít nhất 1 người (Sơn cho backend, Đạt cho infra, Sơn cho frontend nếu liên quan architecture)
- **Labels:** `feature`, `bug`, `docs`, `priority:high`, v.v.

### 3. PR Template

```markdown
## 🎯 What does this PR do?
[Mô tả ngắn gọn]

## 🔗 Related Issue
Closes #<issue-number>

## 🧪 How to test
1. Step 1
2. Step 2
3. Expected result

## 📸 Screenshots (if UI change)

## ✅ Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No sensitive data committed
```

### 4. Review Rules

- Reviewer phải review trong vòng **24 giờ**.
- Author phải trả lời **tất cả comments** trước khi merge.
- Merge chỉ khi:
  - ✅ CI passes
  - ✅ ≥ 1 approval
  - ✅ Không có unresolved comments
  - ✅ Up-to-date với `develop`

### 5. Merge Strategy

- Dùng **Squash and merge** cho feature branches (giữ history sạch).
- Dùng **Create a merge commit** cho release branches.

---

## 🎨 Code Style & Linting

### Python (Backend)

| Tool | Mục đích | Config |
|------|----------|--------|
| **Ruff** | Linter + formatter | `backend/pyproject.toml` |
| **Black** | Code formatter | Line length: 100 |
| **isort** | Import sorting | Compatible with Black |
| **mypy** | Type checking | Strict mode |
| **pre-commit** | Auto-check before commit | `.pre-commit-config.yaml` |

```bash
# Chạy manual
ruff check backend
ruff format backend
mypy --config-file backend/pyproject.toml backend/app
```

### JavaScript/TypeScript (Frontend)

| Tool | Mục đích |
|------|----------|
| **ESLint** | Linter |
| **Prettier** | Formatter |
| **TypeScript** | Type checking (strict mode) |

```bash
pnpm lint
pnpm format
pnpm type-check
```

### General Rules

- ✅ **Python:** Dùng type hints cho tất cả function signatures.
- ✅ **Python:** Docstrings theo [Google style](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings).
- ✅ **TypeScript:** Không dùng `any`, ưu tiên strict types.
- ✅ **Line length:** 100 ký tự (Python), 80 ký tự (TypeScript).
- ✅ **Naming:**
  - Python: `snake_case` cho functions/variables, `PascalCase` cho classes
  - TypeScript: `camelCase` cho functions/variables, `PascalCase` cho components/classes

---

## 🧪 Testing Guidelines

### Coverage Requirements

| Component | Minimum Coverage |
|-----------|------------------|
| Backend core modules | 80% |
| AI Engine | 70% (do tính phi deterministic) |
| Frontend critical paths | 60% |
| Data Pipeline | 85% |

### Backend Testing (Pytest)

```python
# tests/modules/auth/test_login.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@unilake.ai", "password": "test123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
```

```bash
# Chạy tests
cd backend
pytest                              # Tất cả
pytest tests/modules/auth/          # Một module
pytest -v --cov=app                 # Với coverage
pytest -k "test_login"              # Filter by name
```

### Frontend Testing (Jest + React Testing Library)

```bash
pnpm test                # CI mode
pnpm test:watch          # Watch mode
pnpm test:coverage       # Coverage report
```

### Data Quality Tests (Great Expectations)

```python
# data/expectations/admissions_suite.py
import great_expectations as gx

expectation_suite = gx.ExpectationSuite(name="admissions.bronze")
expectation_suite.add_expectation(
    gx.expectations.ExpectColumnValuesToNotBeNull(column="student_id")
)
```

### Test Naming

```
test_<functionality>_<scenario>_<expected_result>

Ví dụ:
test_login_with_valid_credentials_returns_token
test_text_to_sql_with_ambiguous_query_raises_error
test_pipeline_bronze_to_silver_handles_null_values
```

---

## 🏗️ Module-Specific Guidelines

### 📦 Modular Monolith Structure

```
backend/app/
├── core/              # Config, security, deps (CHỈ Sơn/Đạt sửa)
├── modules/
│   ├── auth/          # JWT, OAuth2, RBAC
│   ├── ingest/        # Data ingestion → Bronze
│   ├── pipeline/      # ETL: Bronze → Silver → Gold
│   ├── governance/    # Catalog, Lineage, DQ Check
│   ├── query/         # Dashboard API, export
│   └── ai_engine/     # Text-to-SQL, OR-Tools
└── shared/            # Utils, base models, schemas
```

### 🔒 Module Boundaries

- ✅ Các module **giao tiếp qua hàm Python** (in-process), KHÔNG qua HTTP.
- ✅ Mỗi module có `__init__.py` export public API rõ ràng.
- ❌ KHÔNG import trực tiếp từ module khác — dùng **dependency injection** hoặc **shared interfaces**.
- ✅ Mỗi module có `tests/` riêng.

### 🤖 AI Engine Guidelines (Đức)

- Prompt templates đặt ở `backend/app/modules/ai_engine/prompts/`.
- Dùng **LangChain** cho orchestration, **structured output** (Pydantic) cho LLM responses.
- **KHÔNG** hardcode API keys — dùng `settings` từ `core/config.py`.
- Log tất cả LLM calls với prompt + response (cho debug) ở `DEBUG` level.

### 📊 Data Engineering Guidelines (Toàn)

- Pipeline dùng **DuckDB** làm engine chính.
- Bronze files lưu ở **MinIO** theo pattern: `bronze/{domain}/{year}/{month}/{filename}`.
- Silver/Gold dùng **Delta Lake** trên PostgreSQL.
- Data Quality rules viết bằng **Great Expectations**, đặt ở `data/expectations/`.

### 🎨 Frontend Guidelines (Loan)

- Dùng **Next.js App Router** (không dùng Pages Router).
- Components đặt ở `frontend/src/components/<domain>/`.
- API calls qua `frontend/src/lib/api/` (centralized client).
- State management: ưu tiên **React Server Components** + **SWR/TanStack Query** cho client state.
- Styling: **TailwindCSS** only, không dùng CSS modules.

### 🐳 DevOps Guidelines (Đạt)

- Mọi thay đổi hạ tầng phải qua PR + review.
- Docker images dùng **multi-stage build** để giảm size.
- Secrets quản lý qua `.env` (local) hoặc GitHub Secrets (CI/CD).
- CI pipeline chạy: lint → test → build → (optional) deploy.

---

## 🐛 Issue Reporting

### Bug Report

Dùng template `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
## 🐛 Mô tả bug
[Mô tả ngắn gọn]

## 🔄 Các bước tái hiện
1. Go to '...'
2. Click on '...'
3. See error

## ✅ Expected behavior
[Kết quả mong đợi]

## ❌ Actual behavior
[Kết quả thực tế]

## 📸 Screenshots

## 🖥️ Environment
- OS: [e.g. Ubuntu 22.04]
- Python: [e.g. 3.11.5]
- Node: [e.g. 20.10.0]
- Browser: [e.g. Chrome 120]

## 📝 Additional context
```

### Feature Request

Dùng template `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
## 💡 Mô tả feature
[Feature giải quyết vấn đề gì?]

## 🎯 Use case
[Ai sẽ dùng? Khi nào?]

## ✅ Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## 📊 Priority
[ ] Critical  [ ] High  [ ] Medium  [ ] Low
```

---

## 💬 Communication

| Channel | Mục đích |
|---------|----------|
| **Daily Standup** (9:00 AM, 15 min) | Sync tiến độ, blockers |
| **Sprint Review** (Mỗi 2 tuần, Friday 2:00 PM) | Demo, retrospective |
| **Zalo Group** | Chat nhanh, hỏi đáp tức thì |
| **GitHub Issues** | Track bugs, features, tasks |
| **GitHub Discussions** | Thảo luận kiến trúc, quyết định kỹ thuật |
| **Google Drive** | Tài liệu, design, meeting notes |

### Escalation Path

1. Blocker kỹ thuật → Hỏi trong Zalo group
2. Không giải quyết được trong 4h → Ping directly reviewer
3. Ảnh hưởng deadline → Báo Sơn (Scrum Master) ngay
4. Vấn đề kiến trúc lớn → Đề xuất trong Sprint Review

---

## 🆘 Getting Help

- 📚 **Documentation:** Xem thư mục `docs/`
- 🏗️ **Architecture:** `docs/architecture/`
- 🔌 **API Docs:** http://localhost:8000/docs (khi chạy backend)
- 🎓 **References:** Proposal Section 15
- 👨‍🏫 **Mentor:** ThS. Nguyễn Đặng Quang Huy

---

## 🎉 Thank You!

Mỗi đóng góp của bạn — dù là code, docs, review, hay ý tưởng — đều giúp **UniLake AI** tiến gần hơn đến mục tiêu hỗ trợ ra quyết định cho quản trị đại học.

> *"Together we build, together we learn."* — C1SE.11

---

<p align="center">
  <i>Last updated: August 27, 2026 | Maintained by C1SE.11</i>
</p>
