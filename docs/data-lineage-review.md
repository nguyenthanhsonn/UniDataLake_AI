# Rà soát nghiệp vụ lineage sau khi đọc .agents — 2026-10-31

## Căn cứ áp dụng

Đã đọc ba SKILL.md trong `.agents/skills`: data-engineering-data-pipeline,
data-engineering-medallion-pipeline, python-backend và bốn reference của Python.
Áp dụng nguyên tắc dữ liệu thô bất biến, phân tầng đúng trách nhiệm, publication
nguyên tử, replay có thể kiểm chứng, DTO có validation và đọc metadata có giới hạn.
Các ví dụ Airbyte/dbt/Airflow/Delta/Upstash trong skill không phải stack đã chốt của
UniDataLake; không cài thêm hoặc thay stack theo ví dụ. Task và tài liệu dự án vẫn
là căn cứ xác định phạm vi. Các ngưỡng SLA/chất lượng/cost mẫu không trở thành AC.

## Vấn đề tìm thấy và thay đổi

| Vấn đề | Ảnh hưởng nghiệp vụ | Xử lý |
|---|---|---|
| Cleaning versions đặt trong FileProvenance | Trộn dấu vết xử lý với bằng chứng file gốc | Chuyển sang processing_steps và truyền qua S2/S3/S4; provenance gốc giữ nguyên |
| Thêm field audit vào hash input | Replay có thể tạo logical request mới dù dữ liệu không đổi | Loại ingestion_job_id khỏi hash/record ID; chỉ hash processing_steps khi có |
| Chỉ có metadata ghi, chưa có cách đọc an toàn | Có thể đọc manifest staged hoặc gán sai nguồn cho entity kế thừa | Thêm read_lineage từ repository published, đối chiếu parent/object và trả nguồn theo entity |
| Phiên bản output có thể rỗng; job ref có thể sai kiểu | Cạnh trông hợp lệ nhưng không truy được dữ liệu cụ thể | Siết contract version/layer và kiểm tra bằng chứng Bronze trước tạo cạnh |
| Tên asset input chưa xác minh quá chung | Hai nguồn cùng entity có thể bị gộp | Dùng source_system/data_source/dataset khi provenance có đủ định danh |
| Đọc lineage có thể kéo toàn bộ dữ liệu | Tốn I/O và RAM chỉ để xem metadata | Chỉ đọc manifest, giới hạn ancestry và phát hiện chu trình |

## Các điểm còn lại, không tuyên bố đã hoàn thành

1. API/viewer UDL-177 vẫn cần tích hợp read service, quyền lineage.read và scope;
   hàm GovernanceService.lineage in-memory cũ chưa trở thành API production.
2. Lỗi cleaning/normalization trước publication chưa có durable run journal xuyên
   suốt. Job ingestion và Silver publication giữ lỗi theo cơ chế hiện có; không
   suy ra rằng mọi bước trước publisher đã được lưu vào data_processing_run.
3. Dataset lineage hiện lưu cùng job output/manifest. data_lineage là column lineage;
   chưa tự động tạo mapping cột hoặc materialized graph index trong PostgreSQL.
4. Source DB không có source snapshot/version thì để null, không dùng timestamp
   làm version giả. Input không gắn receipt Bronze đã kiểm chứng có layer=null.
5. Gold chưa có publication thực tế trong luồng này: không tạo cạnh Gold; không thể
   nghiệm thu AC toàn tuyến bốn tầng chỉ bằng các test Source/Bronze/Silver.
6. Rehearsal, SQLite/local Parquet tests khác production PostgreSQL/MinIO. Chưa có
   kết quả live mới thì không công bố production ready.

Contract chi tiết: [data-lineage-contract.md](data-lineage-contract.md).

## Kiểm chứng sau sửa

359 test pass trong bộ hồi quy 11 file; Ruff pass; mypy pass trên 10 file ứng dụng
thay đổi; git diff --check pass. Có test mới cho read published-only, kế thừa đúng
nguồn, missing legacy không lấy lineage cũ, giới hạn ancestry, metadata-only reads,
phiên bản rỗng, job ID sai kiểu, replay khi bổ sung job context và thay cleaning version.
Không có kết quả live PostgreSQL/MinIO mới trong lần rà soát này.
