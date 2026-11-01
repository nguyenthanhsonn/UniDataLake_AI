# Bronze → Silver đa định dạng: hiện trạng và kế hoạch bổ sung

Ngày đối chiếu: 01/11/2026. Phạm vi: code và tài liệu trong checkout hiện tại.
Không khẳng định trạng thái DB/MinIO đang chạy; không chạy pipeline hoặc sửa runtime trong lần phân tích này.

## 1. Kết luận

### Đính chính sau khi đọc proposal gốc trên Drive — 01/11/2026

Nguồn: [C1SE.11_ProjectProposal_v1.0.pdf](https://drive.google.com/file/d/1ZIL0cctZyk8OOMWMcyXGLk1Y8lLg8g0-/view), mục 6.3.4, FR08 và 10.2;
[Data Lake & Processing Engine](https://docs.google.com/document/d/1xZAeOzUOQRtoFxItcSSQ6S01BvKmrw5GrISYtQU5GC8/edit), mục 1 và 3.

Proposal 10.2 đã đề cập ba nhóm: đọc/trích xuất PDF/Excel/Word/SQL; lưu ảnh/file
nhị phân bằng DuckDB BLOB/PostgreSQL BYTEA; OCR/AI-assisted extraction cho ảnh/PDF scan.
Vì vậy không coi nhu cầu giữ binary và trích xuất nội dung là hoàn toàn ngoài proposal.
Tuy nhiên, mục 10.2 nói về ingestion/extraction tại Bronze và data store nói chung;
không đủ căn cứ kết luận mọi file phải được ghi đồng thời thành object và business rows
trong PostgreSQL tại Silver. BLOB/BYTEA cũng khác bảng nghiệp vụ đã chuẩn hóa.

Tài liệu kiến trúc chi tiết chỉ rõ Silver Parquet ở MinIO, PostgreSQL giữ metadata,
Gold PostgreSQL phục vụ analytics. Hai tài liệu còn thiếu quyết định thống nhất về
vị trí binary, extraction text/table tại Bronze hay sau Bronze, và đích dữ liệu SQL
chi tiết. Những câu phía dưới về Silver DB là đánh giá so với kiến trúc chi tiết,
không phủ nhận nội dung đa định dạng/binary/OCR đã có trong proposal.

Chưa có luồng hoàn chỉnh nhận Excel/JSON/Word/PDF rồi tạo đồng thời một sản phẩm object
Silver và các bản ghi nghiệp vụ trong PostgreSQL Silver.

Đã có một phần quan trọng: reader CSV/Excel/PostgreSQL, xử lý chuẩn hóa và publisher
Silver ghi Parquet + manifest bất biến; PostgreSQL lưu trạng thái publication.
Reader JSON, Word/PDF, OCR, document extraction, Silver document artifacts và writer
ghi bản ghi nghiệp vụ Silver vào DB chưa được tìm thấy trong luồng ứng dụng hiện có.

Tài liệu kiến trúc hiện ghi Silver chính ở MinIO/Parquet, PostgreSQL giữ metadata;
dữ liệu phục vụ AI/dashboard ở schema Gold là một tầng tiếp theo. Vì vậy yêu cầu
Silver cũng có dữ liệu nghiệp vụ trong DB là một mở rộng cần ghi thành quyết định,
không phải tính năng có thể kết luận đã tồn tại chỉ từ tên bảng hoặc dependencies.

## 2. Hai khái niệm cần tách

1. **Dạng nội dung:** bảng có cấu trúc, JSON bán cấu trúc, văn bản/tài liệu.
2. **Nơi lưu:** object storage hoặc relational database.

Parquet trên MinIO là object nhưng có cấu trúc bảng. Do đó không chia đơn giản
"object = phi cấu trúc" và "DB = có cấu trúc". Một PDF có thể tạo text/table artifacts
và các bản ghi nghiệp vụ; một Excel có thể tạo Parquet và một DB projection của cùng
snapshot. Hai sản phẩm cùng nguồn cần cùng version và lineage, không phải hai nguồn
chân lý độc lập.

File gốc nguyên bản ở Bronze. Không sao chép nguyên PDF/Word sang Silver rồi gọi đó
là dữ liệu đã làm sạch. Silver document artifact phải có biến đổi xác định, chẳng
hạn text chuẩn hóa hoặc bảng đã trích xuất, kèm evidence và version của extractor.

## 3. Bằng chứng trong dự án

| Vị trí | Nội dung đã đối chiếu | Ý nghĩa |
|---|---|---|
| `docs/architecture/data-processing-architecture.md`, mục 1 và 3 | Silver MinIO/Parquet; PostgreSQL metadata; Gold PostgreSQL marts | Kiến trúc ghi nhận hiện tại |
| `docs/standardization/decision-log.md`, D01/D05/D08/D09 | Source schema khác Silver schema; Parquet/manifest; profile version; pin input | Không tự dùng schema nguồn làm đích hoặc thay publisher |
| `backend/app/modules/ingestion/readers/factory.py` | Chỉ CSV, EXCEL, POSTGRESQL | Chưa có reader runtime JSON/PDF/Word |
| `backend/app/modules/ingestion/readers/request_builder.py` | Cùng danh sách source type hỗ trợ | Đăng ký datasource không tự bảo đảm ingestion được mọi định dạng |
| `backend/app/modules/ingestion/readers/excel_reader.py` | `.xlsx`, `.xlsm`, sheet/header/skip configuration | Chưa hỗ trợ `.xls` cũ; `.xlss` không nằm trong danh sách |
| `backend/app/modules/ingestion/readers/file_snapshot.py` | CSV/EXCEL, checksum/parser fingerprint/locator | Cần mở rộng contract cho JSON/document |
| `backend/app/bronze_capture.py` | Capture file CSV/Excel; xuất dữ liệu PostgreSQL | Cần bổ sung raw capture cho định dạng mới, không chỉ thêm extension |
| `backend/app/modules/pipeline/router.py` | Endpoint cleaning chỉ dành DEMO_FLOW synthetic profiles | Chưa là API tổng quát cho mọi file |
| `backend/app/modules/pipeline/manual_cleaning.py` | Chỉ CSV/EXCEL, đối chiếu job/object, rehearsal | Luồng manual hiện hạn chế phạm vi |
| `backend/app/modules/pipeline/silver_pipeline.py` | Mapping → Type → Identity → publisher | Tái sử dụng cho bản ghi có cấu trúc sau extraction |
| `backend/app/modules/pipeline/silver_publication.py` | Ghi/readback Parquet và manifest, sau đó stage/publish | Có data-plane Silver object thật trong implementation |
| `backend/app/modules/pipeline/silver_models.py` và `silver_repository.py` | silver_run/snapshot/head; transaction publication | PostgreSQL đang lưu metadata, không phải nội dung toàn bộ bảng Silver |
| `backend/pyproject.toml`, optional dependencies | pdfplumber/python-docx/Pillow/pytesseract | Khai báo thư viện không chứng minh extractor/OCR đã triển khai |
| `backend/app/providers.py` | MockLLMClient và EmptyGoldQueryExecutor | Không lấy luồng NLQ hiện tại làm bằng chứng Gold DB đã hoạt động thật |

Các file JSON schema, profile và fixture hiện có không phải bằng chứng ứng dụng đã
đọc file JSON nghiệp vụ từ Bronze. Tương tự, bảng `app.student`, `app.employee` trong
DDL không chứng minh pipeline đã ghi kết quả Silver vào chúng. Phải có writer và
mapping/run thực tế; baseline D01 phân biệt rõ schema nguồn với Silver.

## 4. Ma trận theo định dạng

| Định dạng | Capture/reader hiện tại | Chuyển sang Silver | Phần thiếu chính |
|---|---|---|---|
| CSV | Có | Có nền tảng bản ghi → Parquet; manual flow giới hạn demo | General binding/runner và kiểm chứng production |
| XLSX/XLSM | Có reader | Có nền tảng chuẩn hóa; manual demo chọn XLSX | Profile cho từng sheet/entity và runner tổng quát |
| XLS cũ | Không có trong reader hỗ trợ | Chưa | Adapter/convert policy có kiểm chứng, không đổi đuôi file |
| JSON/JSONL nghiệp vụ | Chưa có reader runtime trong factory | Chưa có luồng đầy đủ | Record path, nested arrays, type/locator, capture và handoff |
| DOCX | Có khai báo thư viện, chưa có extractor runtime | Chưa | Paragraph/table extraction, location, entity mapping |
| DOC cũ | Chưa có adapter | Chưa | Quyết định từ chối rõ hoặc convert trong môi trường cô lập |
| PDF có text | Có khai báo thư viện, chưa có extractor runtime | Chưa | Extraction/layout/table handling và kiểm chứng kết quả |
| PDF scan/ảnh | Có khai báo dependency OCR | Chưa | OCR runtime, cấu hình ngôn ngữ, vị trí trang và review chất lượng |

Không suy ra XLSM được manual demo hỗ trợ chỉ vì ExcelReader đọc được XLSM; đây là
hai tầng tích hợp khác nhau. Không thực thi macro khi đọc workbook.

## 5. Quyết định đích DB trước khi code writer

### Phương án A — giữ kiến trúc hiện tại

Bronze raw → extraction/normalization → Silver Parquet trên MinIO → Gold transformations
→ PostgreSQL Gold cho analytics. PostgreSQL app vẫn giữ metadata.

Phù hợp khi mục tiêu "lưu DB" thực chất là phục vụ KPI/dashboard/Text-to-SQL.
Chưa có nghĩa Gold đã được triển khai; đó vẫn là phần phải làm.

### Phương án B — bổ sung Silver DB theo nhu cầu mới

Giữ Silver Parquet/manifest làm snapshot chuẩn; bổ sung bản ghi có cấu trúc trong
một schema Silver riêng (tên cụ thể cần chốt). DB là projection có thể dựng lại từ
snapshot, không cho cập nhật nghiệp vụ tùy ý rồi lệch khỏi Parquet.

Phù hợp khi cần SQL/join trên dữ liệu đã chuẩn hóa ở độ chi tiết Silver, trước Gold.
Không dùng lại bảng nguồn `app.*` làm đích chỉ vì tên entity giống nhau.

Nếu cả object và DB bắt buộc sẵn sàng đồng thời, publication phải kiểm tra cả hai
trước đổi con trỏ active. Nếu DB projection được phép bất đồng bộ, cần trạng thái
riêng và API không được báo DB đã sẵn sàng chỉ vì object snapshot đã publish.

## 6. Flow đề xuất nếu chọn hai sản phẩm Silver

```text
Source file
  → raw capture vào Bronze, pin version/checksum
  → phân loại theo content + source/profile binding
  → parser/extractor/OCR phù hợp
      → text/table/document artifacts đã xử lý, nếu có
      → candidate records kèm locator về file nguồn
  → mapping + type + identity + PII + DQ
  → candidate snapshot
      → Parquet/document artifacts trên MinIO
      → DB projection theo snapshot, nếu được yêu cầu
  → kiểm tra readback và consistency
  → publish metadata/head
  → consumer chỉ đọc snapshot đã publish
```

Đây là flow đề xuất, chưa có đủ các thành phần trong runtime hiện tại.
Không buộc mọi file phải tạo cả document text lẫn business rows: tùy hợp đồng dataset.
Nếu một file không có trường nghiệp vụ đủ tin cậy thì giữ extraction artifact/report,
không tự tạo một student/employee giả để điền DB.

## 7. Kế hoạch triển khai theo thứ tự

### P0 — Chốt contract và một lát cắt nghiệp vụ

- Chọn một domain/entity, một loại file và một profile có mẫu thật đã được phép dùng.
- Chốt DB đích là Silver chi tiết hay Gold phục vụ analytics (mục 5).
- Chốt trường cần lấy, nguồn có thẩm quyền, PII, quy tắc xung đột và phạm vi truy cập.
- Chốt output bắt buộc: Parquet, document artifact, DB projection hay tổ hợp cụ thể.
- Chốt chế độ publication đồng bộ/bất đồng bộ, phiên bản schema và strict snapshot.

Đầu ra: decision record và contract input/output. Không tự gán toàn bộ định dạng
mới vào UDL-176; đây là năng lực ingestion/extraction/storage mà lineage phụ thuộc.

### P1 — Mở rộng ingestion giữ file gốc

- Bổ sung raw capture cho JSON/DOCX/PDF; tách capture byte khỏi bước đọc thành record.
- Kiểm tra loại nội dung, kích thước, checksum, version và khả năng đọc file.
- File mã hóa/hỏng/không hỗ trợ có trạng thái lỗi rõ. Giới hạn thời gian/tài nguyên
  cho parser; không thực thi macro hay nội dung nhúng.
- Không OCR hoặc chuẩn hóa nghiệp vụ trước khi lưu bản gốc Bronze.
- Không suy số dòng từ số trang; cho phép chưa có row count khi chưa extraction.

Đầu ra: ingestion job và Bronze receipt dùng được cho các định dạng đã công bố hỗ trợ.

### P2 — Handoff/extraction cho từng loại

**Excel:** tái sử dụng reader hiện có; cấu hình sheet/header/range và binding từng
entity. Chính sách formula/cached value phải rõ; không tự lấy sheet đầu tiên.

**JSON:** reader riêng; cấu hình JSON/JSONL và đường dẫn tập record. Quy định flatten,
array con và bảng cha/con, không explode nhiều array thành tích Descartes ngoài ý muốn.
Phân biệt missing/null, giữ mã có số 0 đầu. Locator là JSON Pointer hoặc dòng JSONL.

**DOCX/PDF text:** trích đoạn văn/bảng trước, sau đó mapping theo template/entity.
Giữ paragraph/table/cell hoặc page/block/bounding box để kiểm chứng. Không coi chuỗi
text đã lấy ra là bản ghi nghiệp vụ đã hợp lệ.

**PDF scan:** OCR riêng, pin engine/model/config version; kiểm chứng trường quan trọng
bằng quy tắc domain hoặc review. Không tự chọn một ngưỡng confidence chung cho mọi
trường; ngưỡng và cơ chế review phải được xác nhận theo dữ liệu thực tế.

**DOC/XLS cũ:** mặc định trả lỗi unsupported rõ; chỉ thêm conversion khi có yêu cầu,
giữ cả bản gốc và quan hệ conversion, không đổi đuôi file để giả định dạng mới.

Đầu ra: extraction result có schema/version, candidate records, artifacts, locators,
issues và input receipt. Có thể phát nhiều entity từ một file theo profile tường minh.

### P3 — Đưa candidate records qua pipeline chuẩn hóa hiện có

- Tái sử dụng mapping/type/identity và publication checks đã có.
- Mapping nguồn–entity–profile tường minh, không chọn entity từ extension.
- Dữ liệu OCR/AI chưa kiểm chứng không được đi thẳng vào dữ liệu active.
- Giữ chính sách strict snapshot đã chọn: lỗi bắt buộc không tự bị bỏ qua để công bố
  phần còn lại. Rà soát sự khác biệt giữa manual runner và generic cleaning pipeline
  trước khi mở runner tổng quát.
- Entity/file không phù hợp giữ trạng thái lỗi/quarantine có thể truy vết.

Đầu ra: structured records đủ điều kiện Silver, tách riêng artifacts/evidence hạn chế.

### P4 — Object publication và DB projection

- Mở rộng manifest theo artifact kind: structured table/document text/extracted table.
  Không đưa document artifact qua schema 22 entity hiện tại nếu không phù hợp.
- DB writer dùng schema đích được quản lý/versioned; không tạo bảng từ header tùy ý.
- Lưu rows theo snapshot/run và entity key; kiểm tra type, PK/FK, số dòng và digest
  bằng cách chuẩn hóa kiểu nhất quán. Không ghi đè active rows trong khi tải dở.
- Với cùng PostgreSQL metadata: tải vào vùng candidate không truy cập bởi consumer,
  kiểm tra rồi commit publication/head trong một transaction. Consumer đọc qua view
  hoặc filter snapshot đã publish; khóa quyền đọc trực tiếp candidate nếu cần.
- MinIO và PostgreSQL không có transaction phân tán mặc định: object orphan/candidate
  có thể tồn tại khi lỗi, nhưng không được nhìn thấy như dữ liệu active.
- Retry idempotent theo input/version/profile/snapshot; có reconcile và cleanup được
  kiểm soát, không xóa theo tuổi file mà thiếu đối chiếu metadata.
- Duy trì full-entity replacement hiện tại trừ khi có quyết định riêng về incremental
  upsert/delete. Không âm thầm chuyển sang upsert vì DB writer thuận tiện hơn.

Đầu ra: một snapshot có các sản phẩm nhất quán; snapshot cũ vẫn đọc được khi lần mới lỗi.

### P5 — Lineage cho nhiều sản phẩm

- Ghi input Bronze version → extraction run → candidate/artifact → Silver output.
- Phân biệt dataset logic với physical representation (MinIO/DB) để không đếm thành
  hai dataset nghiệp vụ khác nhau khi chúng chỉ là hai bản biểu diễn cùng snapshot.
- Pin parser/OCR/template/mapping/rule versions; có locator để đối chiếu từng trường
  quan trọng về trang/ô/bản ghi nguồn theo quyền được cấp.
- DB projection thêm physical reference/version; không giả thành Gold.
- Run lỗi trước publication vẫn phải có evidence bền vững đủ để hỗ trợ truy vết.
- Không tự sinh column lineage từ hai tên cột giống nhau; chỉ tạo khi có mapping thật.

Đầu ra: contract lineage mở rộng tương thích hoặc version mới rõ ràng; read service
phân biệt prepared/published/failed/missing, rồi mới nối API/viewer.

### P6 — Kiểm thử và nghiệm thu

| Tình huống | Điều kiện đạt |
|---|---|
| XLSX giữ mã `00123` | Không mất số 0 đầu do ép kiểu ngoài policy |
| JSON nested/array | Không nhân bản record ngoài thiết kế; locator xác định được record gốc |
| PDF/DOCX trích bảng | Truy được về trang/ô/đoạn; xác minh trường bắt buộc |
| OCR sai hoặc không chắc | Không công bố business row chưa được kiểm chứng |
| File hỏng/mã hóa/không hỗ trợ | Báo lỗi cụ thể, giữ bằng chứng nguồn theo policy |
| Object thành công, DB thất bại | Không đổi active snapshot nếu DB là output bắt buộc |
| Replay cùng input và profile | Không tạo thêm dữ liệu logic hoặc cạnh lineage trùng |
| Đổi extractor/rule version | Được nhận diện là xử lý khác, không reuse nhầm |
| Cập nhật một entity | Entity kế thừa giữ nguồn gốc và phiên bản cũ đúng |
| PII và quyền phòng ban | Không lộ raw artifact qua API lineage/preview |
| Chạy live | Bằng chứng PostgreSQL/MinIO và mode rehearsal/production được ghi rõ |

## 8. Thứ tự ưu tiên thực tế

1. Chốt mục tiêu DB và một lát cắt nghiệp vụ ở P0.
2. Hoàn thiện runner/binding và kiểm chứng Excel hiện có trước.
3. Thêm JSON vì có cấu trúc và tái sử dụng được phần lớn normalization.
4. Làm một document template DOCX hoặc PDF text có mẫu kiểm chứng.
5. Thêm OCR và định dạng legacy sau khi có yêu cầu/mẫu đủ rõ.
6. Nếu Silver DB là yêu cầu bắt buộc, phát triển projection trước tiên trên dữ liệu
   Excel đã chuẩn hóa để tách lỗi lưu trữ khỏi lỗi extraction, rồi mở rộng định dạng.

Không gắn ngày hoàn thành khi chưa có mẫu file, entity đích và output contract.
Không thay stack bằng Airbyte/dbt/Airflow chỉ vì skill có ví dụ sử dụng các công cụ đó.

## 9. Tài liệu cần cập nhật khi triển khai

- Kiến trúc xử lý nếu chọn bổ sung Silver DB.
- Contract ingestion: raw capture khác record extraction; counters và status cho tài liệu.
- Contract Silver và artifact types, DB projection/publication consistency.
- Lineage contract: extraction steps, physical representations và failure evidence.
- Proposal 10.2 có mô tả extraction text/table vào Bronze, còn code hiện tại giữ
  raw capture rồi chuẩn hóa sau Bronze. Cần chốt rõ raw Bronze và extracted staging
  thuộc vùng nào. Khuyến nghị giữ raw trước extraction để replay được, nhưng không
  tự coi đó là diễn giải duy nhất đã được proposal phê duyệt.
- API supported types, lỗi unsupported, quy trình review và runbook replay/reconcile.

Tham chiếu: [kiến trúc xử lý](architecture/data-processing-architecture.md),
[decision log](standardization/decision-log.md), [Silver P5](standardization/silver-integration-p5.md),
[lineage contract](data-lineage-contract.md).
