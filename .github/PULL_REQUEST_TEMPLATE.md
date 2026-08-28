---
name: Pull Request
about: Gửi yêu cầu hợp nhất mã (Pull Request) vào UniLake AI
title: '<type>(<scope>): <mô tả ngắn gọn>'
labels: ''
assignees: ''
---

## 🎯 Tóm tắt

<!-- Mô tả ngắn gọn (2-3 câu) về những gì PR này thực hiện. -->
<!-- Ví dụ: "Thêm endpoint JWT refresh token cho module Auth, cho phép user gia hạn session mà không cần đăng nhập lại." -->

## 🔗 Vấn đề (Issue) liên quan

<!-- Link đến issue liên quan. Dùng từ khóa "Closes" để tự động đóng issue khi merge. -->

Closes #<!-- số issue -->
Related to #<!-- số issue nếu có -->

## 📦 Module bị ảnh hưởng

<!-- Đánh dấu (x) các module bị ảnh hưởng bởi PR này. -->

- [ ] 🔐 `auth` — Xác thực, JWT, RBAC
- [ ] 📥 `ingest` — Tiếp nhận dữ liệu (Tầng Bronze)
- [ ] 🔄 `pipeline` — ETL/ELT (Bronze → Silver → Gold)
- [ ] 🛡️ `governance` — Data Catalog, Lineage, DQ Check
- [ ] 🔍 `query` — API Dashboard, xuất dữ liệu
- [ ]  `ai_engine` — Text-to-SQL, OR-Tools, LLM
- [ ] 🎨 `frontend` — Next.js Dashboard / Chatbot
- [ ] 🐳 `infra` — Docker, CI/CD, triển khai
- [ ] 📚 `docs` — Tài liệu
- [ ]  `tests` — Bộ kiểm thử
- [ ] 🗄️ `data` — Dữ liệu mẫu, schemas, migrations

## 🧩 Loại thay đổi

<!-- Đánh dấu (x) vào loại thay đổi phù hợp. -->

- [ ] ✨ **Tính năng mới** — (Không phá vỡ tương thích)
- [ ] 🐛 **Sửa lỗi** — (Không phá vỡ tương thích)
- [ ] 🔨 **Tái cấu trúc (Refactor)** — (Không thay đổi chức năng)
- [ ] ⚡ **Tối ưu hiệu năng**
- [ ]  **Tài liệu**
- [ ]  **Định dạng (Style)** — Format, white-space, missing semi-colons, etc.
- [ ] 🧪 **Kiểm thử (Tests)**
- [ ]  **Chore** — Build process, tooling, dependencies
- [ ] ⚠️ **Breaking change** — Thay đổi có thể ảnh hưởng đến API/behavior hiện tại

## ️ Tác động đến kiến trúc

<!-- PR này có