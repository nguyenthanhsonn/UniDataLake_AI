# syntax=docker/dockerfile:1
# ==============================================================================
# Stage 1: Build & Dependencies
# ==============================================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Worker chọn danh sách gọn; backend vẫn dùng requirements.txt mặc định.
ARG REQUIREMENTS_FILE=requirements.txt
COPY ${REQUIREMENTS_FILE} ./requirements.txt

# Cache tải package tồn tại qua các lần build, không được đưa vào runtime image.
RUN --mount=type=cache,target=/root/.cache/pip,sharing=locked \
    pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/pip,sharing=locked \
    pip install --no-deps -e .

# ==============================================================================
# Stage 2: Production Runtime
# ==============================================================================
FROM python:3.11-slim AS runtime

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000

# Install runtime system libraries and create non-root user
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash appuser

# Copy installed dependencies from builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application source code, migrations & configs
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini pyproject.toml ./

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

# PostgreSQLReader uses LOAD postgres; install for the same runtime user/version.
RUN python -c "import duckdb; connection = duckdb.connect(); connection.execute('INSTALL postgres'); connection.close()"

EXPOSE 8000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch Uvicorn ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
