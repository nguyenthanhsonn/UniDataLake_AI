# Bronze → Silver automation: đối chiếu và phương án triển khai

Ngày: 01/11/2026. Checkout đọc: `feature/data-lineage`.
Đầu vào: `D:/Caps1/Documents/UniDataLake_Bronze_to_Silver_Automation.md`.
Đây là phân tích/đề xuất, chưa triển khai worker hoặc migration mới.
Prompt mẫu ở mục 14 của tài liệu đầu vào là nội dung tham khảo, không phải lệnh thực thi.

## 1. Kết luận thiết kế

Tự động hóa nên là: Bronze được commit hợp lệ → một công việc bền vững → worker
chọn cấu hình đã đăng ký → parse/extract → kiểm tra → publish Silver.
Không phải: thấy file mới trong bucket thì tự đoán entity, schema và ghi đè dữ liệu.

Tài liệu đầu vào có nền tảng đúng: raw Bronze bất biến, worker nền, pin input,
idempotency, publication pointer, dữ liệu bảng khác document elements. Cần chỉnh
theo cấu trúc hiện có và các quyết định strict snapshot/full replacement.

## 2. Các điểm cần sửa hoặc bổ sung trong đề xuất

| Điểm | Hiện trạng / rủi ro | Cách giải quyết |
|---|---|---|
| Bắt đầu bằng upload | API ingestion hiện nhận job cho nguồn cấu hình sẵn, chưa phải endpoint upload tổng quát | MVP kích hoạt từ ingestion job SUCCESS; upload đa định dạng là phần bổ sung riêng |
| Tạo bronze_objects, silver_versions mới | Đã có ingestion_job.output, dataset, silver_run/snapshot/head | Tái sử dụng; chỉ thêm metadata/job/profile/report còn thiếu sau khi chốt schema |
| Outbox + dispatcher + job | Có thể thừa bước khi tất cả dùng cùng PostgreSQL | MVP insert Silver job trong transaction hoàn tất Bronze; worker poll DB. Chỉ dùng outbox khi có ranh giới dispatch/event thực sự |
| Ngưỡng lỗi 2% trong ví dụ | D06 chọn strict snapshot; không có ngưỡng tỷ lệ lỗi ngầm | Giữ strict, lưu report/quarantine; warning được phân biệt với lỗi chặn |
| Từng file tự publish | Publisher thay thế toàn bộ entity | Chốt file là full snapshot hay delta; không cho delta ghi vào full-replacement publisher |
| Lease/heartbeat để giai đoạn 3 | Worker có thể chết hoặc chạy song song ngay từ MVP | Đưa lease, attempt/fencing, dedup và recovery vào MVP |
| Chỉ registry parser | Cleaning hiện giới hạn CSV/EXCEL, flat columns và hai locator kinds | Mở rộng extraction/handoff/validation theo capability, không chỉ thêm tên JSON/PDF vào factory |
| Iterator đồng nghĩa bounded memory | Pipeline hiện gom batch/results/records trong bộ nhớ | MVP giới hạn kích thước/rows; streaming lớn cần refactor cả chuỗi, không chỉ parser |
| Quarantine rồi chuyển passed rows | Generic CleaningSilverPipeline có thể chuyển subset; manual runner chặn khi có quarantine | Đặt publication policy chung trước normalization/publish, không để bypass qua caller khác |
| MinIO event là nguồn trigger | Object có thể tồn tại dù DB commit thất bại | Job/metadata PostgreSQL là điều kiện xử lý; storage event chỉ là tín hiệu cần đối chiếu |

## 3. Điều kiện để một dataset được auto-process

Chỉ bật tự động khi có binding được xác nhận:

- Source/dataset/domain và scope có quyền xử lý.
- Loại nội dung hỗ trợ và parser/config version.
- Output kind: tabular hoặc document elements; không chọn business entity từ extension.
- Schema/mapping/type/identity/crosswalk/DQ/PII policy versions.
- Chế độ nạp: FULL_SNAPSHOT hay DELTA và đơn vị publication đầy đủ.
- Các input/reference snapshot cần dùng và quy tắc file đến muộn.
- Resource budget và mode rehearsal/production.

Chưa có binding, schema đổi ngoài hợp đồng, format không hỗ trợ hoặc thiếu reference
phải dừng có lý do. Không tự suy schema mới rồi publish vào production.

## 4. Trigger và hàng đợi đề xuất

### 4.1 Cùng PostgreSQL: ưu tiên transaction trực tiếp

1. Ingestion writer ghi/kiểm chứng object Bronze, nhận version/checksum.
2. Trong transaction hoàn tất ingestion: cập nhật SUCCESS/output; với dataset có
   auto-processing enabled và binding hợp lệ, insert Silver processing job QUEUED.
3. Commit. Worker chỉ claim các row đã commit.
4. Nếu rollback, không có SUCCESS/job mới; object orphan chưa phải input được công bố.

Insert trong transaction không có nghĩa worker xử lý trước commit. API ingestion
vẫn trả trạng thái ingestion; Silver có trạng thái riêng. Dataset chưa opt-in không
tự phát sinh pipeline job, giữ tương thích hành vi Source → Bronze hiện tại.

Outbox là lựa chọn thay thế nếu sau này có broker/nhiều subscriber; khi đó ghi event
cùng transaction Bronze và consumer tạo job idempotent. Không cần triển khai đồng
thời hai cơ chế cho cùng một kết quả MVP.

### 4.2 Phân biệt execution và publication

- Processing job tồn tại trước parse/extraction để ghi được lỗi đầu luồng.
- Silver run/snapshot/head hiện có tiếp tục quyết định publication.
- Job liên kết ingestion ID và publication run/snapshot; không thay thế silver_run.
- Status và stage tách nhau. Trạng thái dự kiến: QUEUED, RUNNING, RETRY_WAIT,
  SUCCEEDED, FAILED, REVIEW_REQUIRED; stage chỉ vị trí parse/clean/normalize/publish.
- SUCCEEDED chỉ khi snapshot published hoặc tái sử dụng snapshot hợp lệ đã published.
- Các trạng thái mới cần contract/migration, không được mô tả như API đang tồn tại.

## 5. Worker và xử lý cạnh tranh

Tái sử dụng pattern ingestion worker: claim với khóa, lease, heartbeat, retry giới hạn.
I/O/CPU parser chạy ngoài HTTP request; OCR và parser nặng dùng worker/process có budget.

Mỗi lần claim cần attempt token tăng đơn điệu hoặc token duy nhất. Worker mất lease
không được đổi trạng thái/publish bằng token cũ. Heartbeat hoặc hủy coroutine đơn
thuần chưa đủ vì thread/process cũ có thể còn chạy; cần kiểm tra token tại publication
transaction và hủy/giới hạn tiến trình xử lý nếu phù hợp.

Retry transient (timeout/storage/DB) khác retry lỗi dữ liệu: file hỏng, schema sai,
identity không xác định không lặp vô hạn. Lưu report và yêu cầu profile/input mới hoặc review.

Serialize publication theo scope hoặc giữ CAS như hiện tại. Khi head đã đổi, không
đổi base_snapshot sang latest rồi retry mù: kiểm tra lại reference/FK, freshness và
đơn vị thay thế; nếu rebase thì là candidate được đánh giá lại với identity tương ứng.

## 6. Parsing theo định dạng

| Loại | Cách xử lý | Điều kiện để đi tiếp |
|---|---|---|
| CSV | Tái sử dụng reader, pin delimiter/encoding/header; locator theo parsed record | Không dùng số dòng vật lý cho CSV có newline trong ô |
| XLSX | Tái sử dụng openpyxl, chọn sheet/header qua binding | Không tự chọn sheet đầu; ngày/formula/cached values theo policy |
| XLS cũ | Adapter riêng hoặc conversion được kiểm chứng | Không chỉ đổi đuôi; chưa hỗ trợ thì lỗi rõ |
| JSON/JSONL | Reader mới, explicit record path; flatten theo mapping | Missing/null khác nhau, tránh Cartesian product khi nhiều array |
| PDF text | Extract text/table theo từng trang/element | Bảng chỉ thành business records khi mapping và validation đạt |
| PDF scan/mixed | Đánh giá từng trang, OCR theo budget cho trang cần thiết | Không OCR toàn bộ chỉ vì một trang scan; không dùng confidence đơn lẻ làm chứng nhận dữ liệu đúng |
| DOCX | Paragraph/table theo thứ tự, locator rõ | Không coi cả tài liệu là một bảng; không tải external resources |

Detector kiểm tra extension + content/container + khai báo nguồn. MIME không thể tự
quyết định entity. XLSX/DOCX cùng là ZIP cần kiểm tra cấu trúc container; CSV/JSON là
text nên cần parsing validation. Không có một magic-byte check giải quyết mọi loại.

Chưa cần thêm mọi thư viện trong tài liệu. Tận dụng parser/dependency hiện có; chọn
thêm thư viện khi có mẫu file và tiêu chí extraction cụ thể.

## 7. Hai output contract

**Tabular:** bản ghi nghiệp vụ có schema, field types, keys, provenance/locators.
Tái sử dụng normalization và Silver Parquet publisher sau khi sửa handoff phù hợp.

**Document elements:** text/heading/table/image reference theo page/paragraph/cell,
extractor version, confidence nếu công cụ có. Cần schema/publisher artifact tương ứng;
không ép vào 22 entity tabular hoặc nhét tất cả vào một string rồi coi đã chuẩn hóa.

Một file có thể sinh nhiều output, nhưng contract phải xác định output nào bắt buộc
và publication group nào nguyên tử. Nếu text extraction hợp lệ còn bảng nghiệp vụ
chưa xác minh, có thể lưu artifact hạn chế; không công bố dataset nghiệp vụ đó như hợp lệ.

Silver vẫn lưu object artifacts/Parquet trên MinIO và metadata trên PostgreSQL theo
kiến trúc đã đối chiếu. Automation không tự mở rộng thành Silver business DB hoặc Gold.

## 8. Full snapshot, nhiều file và idempotency

Ví dụ: Silver có 10.000 sinh viên; file mới chỉ chứa 20 sinh viên bổ sung. Publisher
hiện tại sẽ thay toàn bộ entity bằng 20 dòng nếu coi file là full snapshot. Đây là
rủi ro nghiệp vụ lớn nhất khi tự kích hoạt mọi file.

MVP nên chỉ nhận FULL_SNAPSHOT theo binding. Với nhiều file tạo cùng một entity,
phải có input manifest/group biết khi nào tập input đã đầy đủ rồi mới publish.
Không dùng khoảng chờ tùy ý làm bằng chứng "đã đủ file".

DELTA cần thiết kế riêng: insert/update/delete, authority, thời gian hiệu lực, late
arrivals và merge với base snapshot; không có sẵn chỉ vì dataset có primary key.

Khóa job cần stable input reference (namespace/object key/version/checksum), output
scope, parser/extractor/config, schema/mapping/type/identity/PII/DQ versions, mode và
input group nếu có. Khóa publication còn phụ thuộc base/reference snapshot theo cơ
chế hiện tại. Không dùng object version đơn lẻ như ID toàn cục giữa các bucket/key.

Retry cùng công việc khác reprocess với cấu hình mới. Giữ lịch sử attempts; không
bắt người dùng tăng pipeline version chỉ để chạy lại một lỗi mạng nhất thời.

## 9. Publication, report và security

- Lưu report lỗi trước publisher để lỗi parse/clean cũng truy được sau restart.
- Giữ strict snapshot D06; không áp dụng 2% trong tài liệu minh họa.
- Counts có ngữ nghĩa theo stage: parsed records/pages/elements không trộn nhau.
- Staging và quarantine không mặc định hiển thị như dataset Silver đã công bố.
- Tái sử dụng immutable manifest, readback và CAS; nối trạng thái job với publication
  bằng transaction hoặc reconcile idempotent nếu không thể cùng transaction.
- Quyền trong tài liệu `dataset:write` chỉ là tên minh họa, phải map về permission
  code thật của dự án. Kiểm tra quyền thao tác và scope; không lưu bearer token dài
  hạn vào job. Recheck policy trước publication theo ngữ nghĩa automation đã chốt.
- Không chạy production qua rehearsal để vượt gate chưa approved.
- File size/page/decompression/timeout limits, least-privilege storage và chống ghi
  PII vào log là điều kiện MVP, không để đến sau khi mở PDF/Word cho người dùng.

## 10. Triển khai theo lát cắt nhỏ

### A. Tự động CSV/XLSX trên một binding FULL_SNAPSHOT

Tách loader/profile resolver khỏi manual demo; sửa policy gate chung; thêm job,
transaction enqueue, worker, attempts/reports, status read API phù hợp router hiện tại.
Giữ default opt-in và rehearsal cho các contract chưa approved.

Điểm thay đổi dự kiến: ingestion completion/repository, processing job model/repo và
migration mới, worker entrypoint/composition, cleaning policy gate, profile resolver,
publication-job linkage, compose worker, tests. Không tạo lại publisher đã có.

### B. JSON/JSONL

Mở rộng capture/request builder/factory, extraction contract và cleaning locator/shape
validation. Test nested records và cấu trúc parent-child; không chỉ thêm JsonParser.

### C. Document elements cho DOCX/PDF text

Schema artifact riêng, extractor version, locators, resource budget, report/review
backend. Chọn một template trước; không hứa hiểu chính xác mọi tài liệu tự do.

### D. OCR và dữ liệu delta nếu được yêu cầu

OCR bounded theo trang, workflow review và bằng chứng trường quan trọng; delta merge
là công việc riêng. Không gộp hai phạm vi này vào MVP lineage/worker.

## 11. Kiểm thử nghiệm thu tối thiểu

- Bronze transaction rollback: không có processing job nhìn thấy được.
- Duplicate delivery/claim/restart: một logical publication, attempts truy vết được.
- Worker mất lease: token cũ không publish được dù process còn chạy.
- Bad schema/required field/FK: strict block, có report, head không đổi.
- Partial file gửi vào FULL_SNAPSHOT: chặn theo binding/input contract, không âm thầm thay dữ liệu.
- Concurrent publications: CAS đúng, không rebase file cũ để đè dữ liệu mới.
- PDF mixed pages: chỉ OCR trang cần; low-confidence fields không tự thành business truth.
- New JSON locator không bị ép thành CSV locator; không phát sinh Cartesian duplicates.
- Stage/object thành công nhưng DB lỗi: không có published output giả; reconcile an toàn.
- Lineage truy được input version/profile/steps và lỗi đầu luồng, không tạo Gold giả.
- Kiểm chứng live PostgreSQL/MinIO tách biệt unit tests và rehearsal tách production.

## 12. Các quyết định cần chốt trước implementation

1. Dataset/entity đầu tiên và profile đã được phép dùng.
2. Full snapshot hay delta; với nhiều file, cách biết bộ input đã đủ.
3. Ai bật automation, scope nào và hiệu lực khi quyền bị thu hồi.
4. Document elements có là output cần công bố không, hay chỉ cần bảng nghiệp vụ.
5. Mode và các gate nghiệp vụ/PII/crosswalk còn mở.

Các mục này là thông tin nghiệp vụ cần thiết cho implementation, không phải yêu cầu
phê duyệt phát sinh từ prompt mẫu trong tài liệu đính kèm.
