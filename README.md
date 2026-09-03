# 🎓 UniLake AI

> **Nền tảng Data Lake đa nguồn tích hợp AI Analytics hỗ trợ ra quyết định trong quản trị đại học**

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-1.0+-ffc537?logo=duckdb&logoColor=black)](https://duckdb.org/)
[![Delta Lake](https://img.shields.io/badge/Delta%20Lake-3.0+-FF363C?logo=apache&logoColor=white)](https://delta.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Tổng quan

**UniLake AI** là nền tảng Data Lake tích hợp dữ liệu đa nguồn và kết hợp mô-đun **AI Analytics**, được xây dựng theo kiến trúc **Modular Monolith** với Python/FastAPI.

Hệ thống thu thập và chuẩn hóa dữ liệu từ nhiều mảng nghiệp vụ trong trường đại học như **Tuyển sinh, Đào tạo, Tài chính, Nhân sự** theo mô hình **Bronze - Silver - Gold**. Sau đó, hệ thống áp dụng các cơ chế **Data Governance** như Data Catalog, Data Lineage và Data Quality Check để đảm bảo dữ liệu đáng tin cậy.

Trên lớp dữ liệu đã được chuẩn hóa, **AI Decision Engine** kết hợp **Text-to-SQL / Intent Parser** và **Constraint Optimization** để trả lời câu hỏi bằng ngôn ngữ tự nhiên, đồng thời mô phỏng các kịch bản quản trị (**What-If Analysis**). Cách tiếp cận này vượt ra ngoài báo cáo mô tả truyền thống của Dashboard/BI.

Kết quả được trình bày qua **Web Platform gồm Dashboard và Chatbot**, giúp lãnh đạo nhà trường truy vấn dữ liệu, so sánh kịch bản và ra quyết định nhanh hơn. Hệ thống sẽ được đánh giá bằng thực nghiệm định lượng và User Study.

---

## 🏗️ Kiến trúc hệ thống

UniLake AI sử dụng kiến trúc **Modular Monolith**: toàn bộ backend gồm API, Data Pipeline, Data Governance và AI Engine chạy trong một ứng dụng Python/FastAPI duy nhất, nhưng được chia thành các module nội bộ có ranh giới rõ ràng.

### Các lớp chính

| Lớp | Thành phần | Chức năng |
|-----|------------|-----------|
| **Presentation** | Web Dashboard (Next.js) | Báo cáo, so sánh kịch bản, giao diện Chatbot |
| **Application/API** | Modular Monolith FastAPI | Auth (JWT/RBAC), Ingest, Pipeline, Governance, Query, AI modules |
| **AI Analytics** | AI Module nội bộ | Text-to-SQL (LLM + LangChain + VectorDB) và Constraint Optimization (OR-Tools) |
| **Data Governance** | Catalog, Lineage, DQ Check | Đảm bảo chất lượng và khả năng truy vết dữ liệu giữa các lớp |
| **Data Lake** | Bronze (MinIO) -> Silver -> Gold (PostgreSQL) | Dữ liệu thô, dữ liệu đã làm sạch và dữ liệu tổng hợp trên Delta Lake |

---

## 🛠️ Công nghệ sử dụng

| Nhóm | Công nghệ |
|------|-----------|
| **Frontend** | Next.js 15, TailwindCSS, Recharts / Chart.js |
| **Backend** | Python 3.11+, FastAPI, Celery/ARQ (background jobs), APScheduler |
| **Database / Storage** | PostgreSQL (Silver/Gold), MinIO (Bronze, S3-compatible), Delta Lake, DuckDB |
| **AI / ML** | LangChain, LLM APIs (OpenAI/Anthropic), Google OR-Tools, VectorDB |
| **Data Governance** | OpenMetadata hoặc công cụ tương đương, Great Expectations |
| **Data Ingestion** | DuckDB, pdfplumber, python-docx, Pillow, Tesseract OCR, Claude Vision API |
| **DevOps** | Docker & Docker Compose, GitHub Actions (CI/CD) |
| **Công cụ hỗ trợ** | Postman / Swagger, Figma, draw.io, Jira |

---

## 🚀 Khởi động nhanh

### Yêu cầu hệ thống

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Clone repository

```bash
git clone https://github.com/<your-org>/unilake-ai.git
cd unilake-ai
```

### 2. Khởi động các dịch vụ hạ tầng

```bash
docker compose up -d   # PostgreSQL, MinIO, Redis
```

### 3. Thiết lập backend

```bash
# Tạo và kích hoạt môi trường ảo tại thư mục gốc dự án
python3 -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows

# Cài dependencies backend và pre-commit hooks
pip install -e "backend[dev]"
pre-commit install
pre-commit install --hook-type commit-msg
cp .env.example .env             # chỉnh lại credentials nếu cần

# Chạy Uvicorn server từ thư mục gốc
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Tài liệu API backend: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Thiết lập frontend

```bash
cd frontend
pnpm install
pnpm dev                         # http://localhost:3000
```

---

## 📁 Cấu trúc dự án

```text
unilake-ai/
├── backend/                  # Modular Monolith FastAPI
│   ├── app/
│   │   ├── core/             # Config, security, dependencies
│   │   ├── modules/
│   │   │   ├── auth/         # JWT / OAuth2 / RBAC
│   │   │   ├── ingest/       # Thu thập dữ liệu vào Bronze
│   │   │   ├── pipeline/     # ETL / ELT (Bronze -> Silver -> Gold)
│   │   │   ├── governance/   # Catalog, Lineage, DQ Check
│   │   │   ├── query/        # Dashboard API, export
│   │   │   └── ai_engine/    # Text-to-SQL + OR-Tools
│   │   └── shared/           # Utils, models, schemas
│   ├── tests/
│   └── pyproject.toml       # Dependencies và config Python backend
│
├── frontend/                 # Next.js Dashboard
│   ├── src/
│   │   ├── app/              # App Router
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── data/                     # Dữ liệu synthetic và dữ liệu mẫu
│   ├── synthetic/            # Script sinh dữ liệu
│   └── samples/              # Dữ liệu mẫu cho 4 domain
│
├── docs/                     # Tài liệu dự án
│   ├── architecture/         # Sơ đồ kiến trúc hệ thống
│   ├── api/                  # OpenAPI specs
│   └── data-schema/          # SQL schemas
│
├── infra/                    # Docker, nginx, scripts
├── notebooks/                # Jupyter POC notebooks
├── docker-compose.yml
└── README.md
```

---

## 🎯 Mục tiêu cụ thể

| ID | Mục tiêu |
|----|----------|
| 1 | Xây dựng Data Lake 3 lớp (Bronze - Silver - Gold) cho ít nhất 4 domain nghiệp vụ |
| 2 | Xây dựng mô-đun Text-to-SQL đạt **Execution Accuracy >= 85%** trên tập kiểm thử |
| 3 | Xây dựng mô-đun Data Governance với **DQ Check pass rate >= 90%** |
| 4 | Hoàn thiện Web Platform v1.0 hỗ trợ truy vấn ngôn ngữ tự nhiên thời gian thực, **response time < 5s** |
| 5 | Xây dựng AI Decision Engine cho ít nhất **10 kịch bản What-If**; User Study đạt **>=80% usefulness, >=4/5 satisfaction** |

---

## 👥 Team - C1SE.11

| Họ tên | Vai trò
|--------|---------|
| **Nguyễn Thanh Sơn** | Scrum Master / Backend Lead |
| **Hoàng Lâm Bảo Toàn** | Backend - Data Engineering |
| **Nguyễn Thị Tố Loan** | Frontend Developer |
| **Đặng Trần Trí Đức** | AI/ML Developer |
| **Trương Đình Đạt** | DevOps & QA |

### 🎓 Giảng viên hướng dẫn

**ThS. Nguyễn Đặng Quang Huy** - International School, Duy Tan University

### 🏫 Đơn vị

**International School - Duy Tan University**

Học phần: **CMU-SE 450 - Capstone Project 1**

---

## 📚 Tài liệu

- [Thiết kế kiến trúc](docs/architecture/)
- [Tài liệu API](docs/api/)
- [Data Schema](docs/data-schema/)
- [Ghi chú nghiên cứu](docs/research/)
- [Hướng dẫn Backend](docs/backend.md)
- [Hướng dẫn Frontend](docs/frontend.md)
- [Hướng dẫn đóng góp](CONTRIBUTING.md)
- [Hướng dẫn cài đặt chi tiết](SETUP.md)

---

## 🗃️ Database Migration

Backend sử dụng Alembic để quản lý schema PostgreSQL.

```bash
make db-migrate MSG="add users table"
make db-upgrade
make db-current
```

Migration mới sẽ được tạo trong `backend/alembic/versions/` và phải được commit vào Git.

---


<p align="center">
  <i>Được xây dựng bởi C1SE.11 @ International School, Duy Tan University</i>
</p>
