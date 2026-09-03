## 🎯 Tóm tắt

<!-- Mô tả ngắn gọn (2-3 câu) về những gì PR này thực hiện. -->
<!-- Ví dụ: "Thêm endpoint JWT refresh token cho module Auth, cho phép user gia hạn session mà không cần đăng nhập lại." -->

## 🔗 Vấn đề (Issue) liên quan

<!-- Link đến issue liên quan. Dùng từ khóa "Closes #123" để tự động đóng issue khi merge. -->

- Closes #
- Related to #

## 📦 Module bị ảnh hưởng

- [ ] 🔐 `auth` — Xác thực, JWT, RBAC
- [ ] 📥 `ingest` — Tiếp nhận dữ liệu (Tầng Bronze)
- [ ] 🔄 `pipeline` — ETL/ELT (Bronze → Silver → Gold)
- [ ] 🛡️ `governance` — Data Catalog, Lineage, DQ Check
- [ ] 🔍 `query` — API Dashboard, xuất dữ liệu
- [ ] 🤖 `ai_engine` — Text-to-SQL, OR-Tools, LLM
- [ ] 🎨 `frontend` — Next.js Dashboard / Chatbot
- [ ] 🐳 `infra` — Docker, CI/CD, triển khai
- [ ] 📚 `docs` — Tài liệu
- [ ] 🧪 `tests` — Bộ kiểm thử
- [ ] 🗄️ `data` — Dữ liệu mẫu, schemas, migrations

## 🧩 Loại thay đổi

- [ ] ✨ **Tính năng mới** (Feature - không breaking change)
- [ ] 🐛 **Sửa lỗi** (Bugfix - không breaking change)
- [ ] 🔨 **Tái cấu trúc** (Refactor - không thay đổi logic)
- [ ] ⚡ **Tối ưu hiệu năng** (Performance Improvement)
- [ ] 📚 **Tài liệu** (Documentation update)
- [ ] 🎨 **Style / Formatting** (Chỉ sửa format, không đổi logic)
- [ ] 🧪 **Kiểm thử** (Adding or updating tests)
- [ ] 🧹 **Chore** (Build tools, dependencies, CI/CD)
- [ ] ⚠️ **Breaking change** (Thay đổi có thể làm hỏng API/behavior cũ)

## 🏗️ Tác động đến kiến trúc

<!-- PR này có thay đổi database schema, API contract, hoặc luồng dữ liệu chính không? -->

- [ ] Có thay đổi Database Schema (đã kèm Alembic migration)
- [ ] Có thay đổi API Contract (đã cập nhật docs/OpenAPI)
- [ ] Không ảnh hưởng đến kiến trúc hiện tại

## 🧪 Danh sách kiểm tra (Checklist)

- [ ] Code tuân thủ quy chuẩn của dự án (đã chạy `ruff check .` và `mypy`).
- [ ] Đã chạy thành công unit test ở local (`pytest` / `pnpm test`).
- [ ] Đã kiểm tra pre-commit hooks passed.
- [ ] Đã cập nhật tài liệu tương ứng (nếu có).
