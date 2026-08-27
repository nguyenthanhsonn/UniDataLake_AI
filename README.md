# 🎓 UniLake AI

> **A Multi-source Data Lake Platform Integrated with AI Analytics for University Administration Decision Support**

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-1.0+-ffc537?logo=duckdb&logoColor=black)](https://duckdb.org/)
[![Delta Lake](https://img.shields.io/badge/Delta%20Lake-3.0+-FF363C?logo=apache&logoColor=white)](https://delta.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Overview

**UniLake AI** is a Data Lake platform that integrates multi-source data and combines an **AI Analytics module**, built on a **Modular Monolith** architecture using Python/FastAPI.

The system ingests and normalizes data from multiple university business domains (**Admissions, Training, Finance, HR**) following the **Bronze – Silver – Gold** model, then applies **Data Governance** mechanisms (Data Catalog, Data Lineage, Data Quality Check) to ensure data reliability.

On top of the normalized data, the **AI Decision Engine** combines **Text-to-SQL / Intent Parser** and **Constraint Optimization** to answer natural-language questions and simulate management scenarios (**What-If Analysis**) — going beyond the descriptive reporting of traditional Dashboard/BI solutions.

Results are presented through a **Web Platform (Dashboard + Chatbot)** enabling university leadership to query, compare scenarios, and make faster decisions — validated through quantitative experiments and a User Study.

---

## 🏗️ System Architecture

UniLake AI follows a **Modular Monolith** architecture — the entire backend (API, Data Pipeline, Data Governance, AI Engine) runs inside a single Python/FastAPI application, organized into clearly bounded internal modules.

### Layers

| Layer | Component | Function |
|-------|-----------|----------|
| **Presentation** | Web Dashboard (Next.js) | Reports, scenario comparison, Chatbot UI |
| **Application/API** | Modular Monolith FastAPI | Auth (JWT/RBAC), Ingest, Pipeline, Governance, Query, AI modules |
| **AI Analytics** | AI Module (internal) | Text-to-SQL (LLM + LangChain + VectorDB) + Constraint Optimization (OR-Tools) |
| **Data Governance** | Catalog, Lineage, DQ Check | Ensure quality and traceability across layers |
| **Data Lake** | Bronze (MinIO) → Silver → Gold (PostgreSQL) | Raw, cleaned, and aggregated data on Delta Lake |

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | Next.js 14, TailwindCSS, Recharts / Chart.js |
| **Backend** | Python 3.11+, FastAPI, Celery/ARQ (background jobs), APScheduler |
| **Database / Storage** | PostgreSQL (Silver/Gold), MinIO (Bronze, S3-compatible), Delta Lake, DuckDB |
| **AI / ML** | LangChain, LLM APIs (OpenAI/Anthropic), Google OR-Tools, VectorDB |
| **Data Governance** | OpenMetadata (or equivalent), Great Expectations |
| **Data Ingestion** | DuckDB, pdfplumber, python-docx, Pillow, Tesseract OCR, Claude Vision API |
| **DevOps** | Docker & Docker Compose, GitHub Actions (CI/CD) |
| **Tools** | Postman / Swagger, Figma, draw.io, Jira |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/unilake-ai.git
cd unilake-ai
```

### 2. Start infrastructure services

```bash
docker compose up -d   # PostgreSQL, MinIO, Redis
```

### 3. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows

pip install -e ".[dev]"
cp .env.example .env             # edit with your credentials

uvicorn app.main:app --reload --port 8000
```

Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev                      # http://localhost:3000
```

---

## 📁 Project Structure

```
unilake-ai/
├── backend/                  # Modular Monolith FastAPI
│   ├── app/
│   │   ├── core/             # Config, security, dependencies
│   │   ├── modules/
│   │   │   ├── auth/         # JWT / OAuth2 / RBAC
│   │   │   ├── ingest/       # Data ingestion (Bronze)
│   │   │   ├── pipeline/     # ETL / ELT (Bronze → Silver → Gold)
│   │   │   ├── governance/   # Catalog, Lineage, DQ Check
│   │   │   ├── query/        # Dashboard API, export
│   │   │   └── ai_engine/    # Text-to-SQL + OR-Tools
│   │   └── shared/           # Utils, models, schemas
│   ├── tests/
│   └── pyproject.toml
│
├── frontend/                 # Next.js Dashboard
│   ├── src/
│   │   ├── app/              # App Router
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── data/                     # Synthetic data & samples
│   ├── synthetic/            # Data generation scripts
│   └── samples/              # Sample data for 4 domains
│
├── docs/                     # Documentation
│   ├── architecture/         # System diagrams
│   ├── api/                  # OpenAPI specs
│   └── data-schema/          # SQL schemas
│
├── infra/                    # Docker, nginx, scripts
├── notebooks/                # Jupyter POC notebooks
├── docker-compose.yml
└── README.md
```

---

## 🎯 Specific Objectives

| ID | Objective |
|----|-----------|
| 1 | Build a 3-layer Data Lake (Bronze – Silver – Gold) for ≥4 business domains |
| 2 | Text-to-SQL module with **Execution Accuracy ≥ 85%** on test set |
| 3 | Data Governance module with **DQ Check pass rate ≥ 90%** |
| 4 | Web Platform v1.0 with real-time NL queries, **response time < 5s** |
| 5 | AI Decision Engine for **≥10 What-If scenarios**; User Study with **≥80% usefulness, ≥4/5 satisfaction** |

---

## 👥 Team — C1SE.11

| Name | Role | Contact |
|------|------|---------|
| **Nguyễn Thanh Sơn** | Scrum Master / Backend Lead | [nguyensonn2805@gmail.com](mailto:nguyensonn2805@gmail.com) |
| **Hoàng Lâm Bảo Toàn** | Backend — Data Engineering | [hoanglambaotoan@gmail.com](mailto:hoanglambaotoan@gmail.com) |
| **Nguyễn Thị Tố Loan** | Frontend Developer | [nguyenthitoloan@gmail.com](mailto:nguyenthitoloan@gmail.com) |
| **Đặng Trần Trí Đức** | AI/ML Developer | [dangtrantriduc@gmail.com](mailto:dangtrantriduc@gmail.com) |
| **Trương Đình Đạt** | DevOps & QA | [truongdinhdat@gmail.com](mailto:truongdinhdat@gmail.com) |

### 🎓 Mentor
**ThS. Nguyễn Đặng Quang Huy** — International School, Duy Tan University

### 🏫 Institution
**International School — Duy Tan University**  
Course: **CMU-SE 450 — Capstone Project 1**

---

## 📚 Documentation

- [Architecture Design](docs/architecture/)
- [API Documentation](docs/api/)
- [Data Schema](docs/data-schema/)
- [Research Notes](docs/research/)
- [Contributing Guide](CONTRIBUTING.md)

---

## 📄 License

MIT License

Copyright (c) 2026 C1SE.11 — International School, Duy Tan University

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🙏 Acknowledgments

- International School, Duy Tan University — for supporting the Capstone Project.
- The CMU-SE 450 course and review panel for guidance and feedback.
- Open-source communities behind FastAPI, DuckDB, Delta Lake, LangChain, and OR-Tools.

---

<p align="center">
  <i>Built with ❤️ by C1SE.11 @ International School, Duy Tan University</i>
</p>
