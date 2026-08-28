---
name: Pull Request
about: Submit a pull request to UniLake AI
title: '<type>(<scope>): <short description>'
labels: ''
assignees: ''
---

## 🎯 Summary

<!-- Mô tả ngắn gọn (2-3 câu) về những gì PR này thực hiện. -->
<!-- Ví dụ: "Thêm endpoint JWT refresh token cho module Auth, cho phép user gia hạn session mà không cần đăng nhập lại." -->

## 🔗 Related Issue(s)

<!-- Link đến issue liên quan. Dùng từ khóa "Closes" để tự động đóng issue khi merge. -->

Closes #<!-- issue number -->
Related to #<!-- issue number nếu có -->

## 📦 Affected Module(s)

<!-- Đánh dấu (x) các module bị ảnh hưởng bởi PR này. -->

- [ ] 🔐 `auth` — Authentication, JWT, RBAC
- [ ] 📥 `ingest` — Data ingestion (Bronze layer)
- [ ] 🔄 `pipeline` — ETL/ELT (Bronze → Silver → Gold)
- [ ] 🛡️ `governance` — Data Catalog, Lineage, DQ Check
- [ ] 🔍 `query` — Dashboard API, export
- [ ] 🤖 `ai_engine` — Text-to-SQL, OR-Tools, LLM
- [ ] 🎨 `frontend` — Next.js Dashboard / Chatbot
- [ ] 🐳 `infra` — Docker, CI/CD, deployment
- [ ] 📚 `docs` — Documentation
- [ ] 🧪 `tests` — Test suites
- [ ] 🗄️ `data` — Synthetic data, schemas, migrations

## 🧩 Type of Change

<!-- Đánh dấu (x) vào loại thay đổi phù hợp. -->

- [ ] ✨ **New feature** — Tính năng mới (non-breaking)
- [ ] 🐛 **Bug fix** — Sửa lỗi (non-breaking)
- [ ] 🔨 **Refactor** — Tái cấu trúc code (không thay đổi chức năng)
- [ ] ⚡ **Performance** — Tối ưu hiệu năng
- [ ] 📚 **Documentation** — Thay đổi tài liệu
- [ ] 🎨 **Style** — Format, white-space, missing semi-colons, etc.
- [ ] 🧪 **Tests** — Thêm hoặc cập nhật tests
- [ ] 🔧 **Chore** — Build process, tooling, dependencies
- [ ] ⚠️ **Breaking change** — Thay đổi có thể ảnh hưởng đến API/behavior hiện tại

## 🏗️ Architecture Impact

<!-- PR này có ảnh hưởng đến kiến trúc tổng thể không? -->

- [ ] Không thay đổi kiến trúc
- [ ] Thay đổi cấu trúc module nội bộ (in-process)
- [ ] Thay đổi API contract (cần cập nhật OpenAPI spec)
- [ ] Thay đổi database schema (cần migration)
- [ ] Thay đổi Data Lake layer (Bronze/Silver/Gold)
- [ ] Thêm dependency mới (cần giải trình)

## 🧪 How Has This Been Tested?

<!-- Mô tả cách bạn đã test PR này. Liệt kê các test case đã chạy. -->

### Test Environment

- **OS:** <!-- e.g., Ubuntu 22.04 / macOS 14 / Windows 11 -->
- **Python:** <!-- e.g., 3.11.5 -->
- **Node.js:** <!-- e.g., 20.10.0 -->
- **Browser (if FE):** <!-- e.g., Chrome 120 -->

### Test Scenarios

<!-- Liệt kê các kịch bản test đã thực hiện. -->

1. **Scenario 1:** <!-- Mô tả -->
   - Input: <!-- ... -->
   - Expected: <!-- ... -->
   - Actual: <!-- ... -->
   - ✅ Pass / ❌ Fail

2. **Scenario 2:** <!-- Mô tả -->
   - Input: <!-- ... -->
   - Expected: <!-- ... -->
   - Actual: <!-- ... -->
   - ✅ Pass / ❌ Fail

### Automated Tests

<!-- Đánh dấu các loại test đã chạy. -->

- [ ] Unit tests (`pytest` / `npm test`)
- [ ] Integration tests
- [ ] Data Quality tests (Great Expectations)
- [ ] E2E tests (Playwright / Cypress)
- [ ] Performance / Load tests

```bash
# Lệnh đã chạy để test
# Ví dụ:
# pytest tests/modules/auth/ -v --cov=app/modules/auth
# npm run test:coverage
```

### Test Coverage

<!-- Nếu có, đính kèm coverage report. -->

```
# Paste coverage output ở đây
# Ví dụ:
# ---------- coverage: platform linux, python 3.11.5 ----------
# Name                                      Stmts   Miss  Cover
# -------------------------------------------------------------
# app/modules/auth/__init__.py                 10      0   100%
# app/modules/auth/service.py                  45      3    93%
```

## 📸 Screenshots / Recordings

<!-- Nếu PR thay đổi UI, đính kèm screenshot hoặc video demo. -->
<!-- Nếu là backend, có thể bỏ qua hoặc đính kèm log/output mẫu. -->

| Before | After |
|--------|-------|
| <!-- screenshot cũ --> | <!-- screenshot mới --> |

<details>
<summary>📹 Click to expand demo video / GIF</summary>

<!-- Chèn GIF hoặc link video -->

</details>

## 📋 Checklist

<!-- Đảm bảo TẤT CẢ các mục dưới đây được hoàn thành TRƯỚC khi request review. -->

### Code Quality

- [ ] Code tuân thủ style guide của dự án (Ruff/Black cho Python, ESLint/Prettier cho TS)
- [ ] Đã chạy `make lint` / `npm run lint` và không còn warning/error
- [ ] Đã chạy `make format` / `npm run format`
- [ ] Type hints đầy đủ cho Python functions (mypy passes)
- [ ] Không dùng `any` trong TypeScript
- [ ] Docstrings theo Google style cho public functions
- [ ] Comments rõ ràng cho logic phức tạp

### Testing

- [ ] Tests đã được thêm/cập nhật cho code mới
- [ ] Tất cả tests pass locally (`pytest` / `npm test`)
- [ ] Coverage không bị giảm (hoặc giảm không đáng kể và có giải trình)
- [ ] Edge cases đã được cover

### Security & Secrets

- [ ] ❌ KHÔNG commit file `.env`, credentials, API keys
- [ ] ❌ KHÔNG commit dữ liệu nhạy cảm (PII, financial data)
- [ ] Secrets được load từ environment variables
- [ ] Đã review code để tránh SQL injection, XSS, etc.
- [ ] RBAC permissions được check đúng cho endpoints mới

### Data & Database

- [ ] Nếu có thay đổi schema: đã tạo Alembic migration
- [ ] Migration đã được test trên DB sạch
- [ ] Data Quality rules (Great Expectations) được cập nhật nếu cần
- [ ] Synthetic data generator được cập nhật nếu schema thay đổi

### AI / LLM (chỉ áp dụng cho `ai_engine` module)

- [ ] Prompt templates được version-controlled
- [ ] Structured output (Pydantic) được validate
- [ ] Fallback mechanism khi LLM API fail
- [ ] Logging đầy đủ (prompt + response) ở DEBUG level
- [ ] Token usage được estimate để tránh vượt ngân sách

### Documentation

- [ ] README.md được cập nhật (nếu cần)
- [ ] API docs (Swagger/OpenAPI) được regenerate
- [ ] Inline comments cho logic phức tạp
- [ ] CHANGELOG.md được cập nhật (nếu có)

### Git & Branch

- [ ] Branch được rebase từ `develop` mới nhất
- [ ] Commit messages theo Conventional Commits (`feat(scope): ...`)
- [ ] Không có merge commits (đã squash/rebase)
- [ ] Không có file không cần thiết (`.DS_Store`, `__pycache__`, `node_modules`, etc.)

## 🚀 Deployment Notes

<!-- Ghi chú đặc biệt cho người deploy (nếu có). -->

- [ ] Không cần deploy đặc biệt
- [ ] Cần chạy migration: `alembic upgrade head`
- [ ] Cần cập nhật environment variables mới:
  ```bash
  # Liệt kê biến môi trường mới cần thêm
  NEW_VAR_NAME=description
  ```
- [ ] Cần restart service sau deploy
- [ ] Cần clear cache / rebuild index
- [ ] Cần update MinIO bucket policy
- [ ] Khác: <!-- mô tả -->

## ⚠️ Breaking Changes

<!-- Nếu PR có breaking changes, mô tả chi tiết và hướng dẫn migrate. -->

- [ ] Không có breaking changes
- [ ] Có breaking changes — mô tả bên dưới:

<details>
<summary>📝 Chi tiết breaking changes</summary>

**What changed:**
<!-- Mô tả thay đổi -->

**Why:**
<!-- Lý do -->

**Migration guide:**
<!-- Hướng dẫn migrate cho người dùng/developer khác -->

```python
# Before
old_code()

# After
new_code()
```

</details>

## 🎯 Reviewer Notes

<!-- Ghi chú đặc biệt cho reviewer — những điểm cần chú ý khi review. -->

<!-- Ví dụ:
- Focus vào file `app/modules/auth/service.py` lines 45-80
- Logic mới ở `pipeline/transform.py` cần double-check
- Prompt template ở `ai_engine/prompts/text_to_sql.py` cần validate với domain expert
-->

## 📊 Performance Impact

<!-- Nếu PR có thể ảnh hưởng performance, mô tả ở đây. -->

- [ ] Không ảnh hưởng performance
- [ ] Có cải thiện performance:
  - Before: <!-- e.g., 2.5s response time -->
  - After: <!-- e.g., 0.8s response time -->
- [ ] Có thể làm chậm (cần theo dõi):
  - Lý do: <!-- ... -->
  - Mitigation: <!-- ... -->

## 🐛 Known Issues / Limitations

<!-- Liệt kê các vấn đề đã biết nhưng chưa fix trong PR này (sẽ fix ở PR sau). -->

<!-- Ví dụ:
- Endpoint `/api/v1/query` chưa handle timeout cho query phức tạp → sẽ fix ở #123
- UI chưa responsive trên mobile → sẽ fix ở #124
-->

- [ ] Không có known issues
- [ ] Có — liệt kê bên dưới:

1. <!-- Issue 1 -->
2. <!-- Issue 2 -->

## 📚 References

<!-- Link đến tài liệu tham khảo (docs, papers, design docs, Figma, etc.) -->

- Design doc: <!-- link -->
- Figma: <!-- link -->
- API spec: <!-- link -->
- Paper/Research: <!-- link -->

---

## 👀 Reviewer Checklist

<!-- Dành cho reviewer — đánh dấu khi review xong. -->

- [ ] Code logic đúng và dễ hiểu
- [ ] Tests đầy đủ và meaningful
- [ ] Không có security issues
- [ ] Performance acceptable
- [ ] Documentation đầy đủ
- [ ] Follows project conventions
- [ ] No unnecessary dependencies added
- [ ] Ready to merge

---

<!-- 
📌 HƯỚNG DẪN SỬ DỤNG TEMPLATE NÀY:

1. Copy template này khi tạo PR mới (GitHub tự động fill)
2. Điền đầy đủ các section bắt buộc:
   - Summary
   - Related Issue(s)
   - Affected Module(s)
   - Type of Change
   - How Has This Been Tested
   - Checklist (Code Quality, Testing, Security)
3. Xóa các section không áp dụng (ví dụ: Screenshots nếu là backend-only)
4. Đảm bảo TẤT CẢ checklist items được check trước khi request review
5. Assign reviewer phù hợp:
   - Backend → Sơn (nguyensonn2805)
   - Data Engineering → Toàn (hoanglambaotoan)
   - Frontend → Loan (nguyenthitoloan)
   - AI/ML → Đức (dangtrantriduc)
   - DevOps/Infra → Đạt (truongdinhdat)

💡 Tips:
- PR nhỏ, tập trung vào 1 feature/fix → dễ review
- PR lớn (>500 lines) → nên tách thành nhiều PR nhỏ
- Draft PR → dùng khi đang develop, chưa ready for review
- WIP prefix → Work In Progress, không merge

🔗 Xem thêm: CONTRIBUTING.md để biết chi tiết quy trình PR.
-->