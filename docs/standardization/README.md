# P0 — Baseline chuẩn hóa dữ liệu

Ngày kiểm tra: **14/10/2026**. Phạm vi: P0.1–P0.5 trong roadmap, chuẩn bị S1–S4 và P5. Không phải triển khai normalization engine.

## Kết quả và cách sử dụng

1. Đọc [baseline](baseline.md) và [scope matrix](scope-matrix.md) để biết hợp đồng nguồn, phạm vi entity và khoảng trống hiện tại.
2. Dùng [decision log](decision-log.md) làm điểm xuất phát cho thiết kế S1. Quyết định kỹ thuật được chọn cho bản triển khai này; thẩm quyền nghiệp vụ và PII chưa có chữ ký xác nhận.
3. Review [PII matrix](pii-matrix.csv) theo từng field. Đây là chính sách đề xuất, không phải quyền truy cập đã được cấp.
4. Dùng [handoff contract](source-profile-contract.md) để phân biệt cấu hình nguồn và normalization profile.
5. Chạy bộ fixture riêng tại `data/standardization/p0/`. Expected outputs là đặc tả ví dụ, chưa phải kết quả của engine.
6. Theo dõi [G0 và các phụ thuộc](g0-checklist.md). Chỉ đánh dấu G0 PASS khi có bằng chứng còn thiếu.

**Trạng thái: P0 có bộ đầu ra kỹ thuật; G0 chưa PASS.** Docker Engine chưa hoạt động tại thời điểm kiểm tra; chưa có bằng chứng người sở hữu domain duyệt Unified Schema, crosswalk và chính sách PII.

Các đường dẫn tương đối trong bộ tài liệu tính từ repo hoặc từ tài liệu chứa liên kết. Các file nguồn và mẫu legacy được giữ nguyên.
