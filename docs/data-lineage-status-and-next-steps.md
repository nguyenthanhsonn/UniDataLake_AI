# Data Lineage — Hiện trạng, phần còn thiếu và kế hoạch triển khai tiếp theo

**Dự án:** UniDataLake AI  
**Story:** UDL-20 — Data Lineage  
**Ngày tổng hợp:** 31/10/2026  
**Mục đích:** Làm rõ đã xử lý được gì, còn thiếu gì, tiếp theo làm phần nào và dựa vào đâu để nghiệm thu.

> Tài liệu tổng hợp nội dung đã trao đổi và kết quả đã ghi nhận trong phiên triển khai. Đây không phải báo cáo nghiệm thu production. Các công việc ở phần kế hoạch chưa được coi là đã thực hiện.

## 1. Yêu cầu nghiệp vụ của task

### 1.1. User Story

Là một **Data Administrator**, tôi muốn theo dõi quá trình dữ liệu đi từ **Source đến Bronze, Silver và Gold** để biết nguồn gốc và quá trình biến đổi dữ liệu.

### 1.2. Acceptance Criteria

1. Hệ thống thể hiện lineage theo luồng Source → Bronze → Silver → Gold.
2. Có thể xác định dataset nguồn và dataset đích.
3. Các bước biến đổi chính được thể hiện trong lineage.
4. Lineage có thể dùng để hỗ trợ truy vết khi dữ liệu có vấn đề.

### 1.3. Giá trị cần đạt

Data Administrator cần trả lời được:

- Dataset này lấy từ nguồn nào?
- Đây là phiên bản dữ liệu nào, được tạo bởi lần chạy nào?
- Dữ liệu đã đi qua những bước xử lý nào và dùng phiên bản quy tắc nào?
- Khi kết quả sai, cần kiểm tra lại nguồn, bước biến đổi hay lần công bố nào?
- Dữ liệu nào được cập nhật, dữ liệu nào được kế thừa từ lần chạy trước?
- Tầng tiếp theo đã thực sự có dữ liệu hay mới chỉ nằm trong thiết kế?

Lineage phải xuất phát từ **bằng chứng thực thi và dữ liệu đã được công bố**. Sơ đồ có đủ bốn ô Source/Bronze/Silver/Gold chưa chứng minh được hệ thống đã theo dõi đủ bốn tầng.

## 2. Phạm vi các subtask

| Subtask | Nội dung | Deliverable | Ranh giới cần giữ |
|---|---|---|---|
| **UDL-175** | Xác định schema cho Source, Bronze, Silver, Gold, processing run và transformation từ cấu trúc `data_lineage` hiện tại | Lineage contract | Phân biệt dataset lineage và column lineage; không tạo ID/cột/dataset giả để lấp chỗ thiếu |
| **UDL-176** | Tích hợp ghi nguồn–đích cho ingestion và chuyển Bronze sang Silver | Lineage tracking | Ghi từ luồng thực tế; không giả lập Gold chưa có dữ liệu |
| **UDL-177** | API/viewer cho lineage theo phần phân rã task đã trao đổi | API và giao diện đọc lineage | Dùng evidence thật, có kiểm soát truy cập và trạng thái thiếu dữ liệu |

Hai subtask đầu tạo nền tảng contract và tracking. Phần Data Administrator có thể mở giao diện, xem và truy vết trực tiếp cần API/viewer.

Việc hoàn thành tracking Source → Bronze → Silver **không tự động hoàn thành AC toàn tuyến đến Gold**.

## 3. Những phần đã triển khai

### 3.1. Contract ở mức dataset và phiên bản dữ liệu

Đã có các DTO trong `backend/app/modules/governance/contracts.py`:

| Thành phần | Trách nhiệm |
|---|---|
| `AssetReference` | Nhận diện đối tượng dữ liệu, tầng, domain, version và tham chiếu run tạo ra dữ liệu nếu có |
| `TransformationEvidence` | Ghi tên bước xử lý, phiên bản và fingerprint khi có bằng chứng |
| `DatasetDerivation` | Thể hiện input, output và các bước biến đổi liên quan |
| `LineageEvidence` | Gom evidence của một run, phân biệt ingestion/rehearsal/production |
| `SnapshotLineage` | Kết quả đọc lineage của snapshot đã publish, bao gồm danh sách entity thiếu evidence |

Contract hỗ trợ các tầng Source/Bronze/Silver/Gold. Input chưa được xác minh tầng có thể có `layer=null`; không tự gán nhãn Bronze chỉ từ đường dẫn `s3://`.

### 3.2. Tracking Source → Bronze

Đã bổ sung evidence vào `output.lineage` của ingestion job:

- Source lấy từ context của job đã kiểm tra.
- Bronze lấy dataset ID và metadata object do writer trả về.
- Có tham chiếu ingestion run để liên kết giữa nguồn, dữ liệu Bronze và quá trình xử lý phía sau.
- Evidence được đưa vào output trước khi repository hoàn tất job; output và trạng thái thành công sử dụng transaction hiện có.
- Job thất bại không được tạo output lineage thành công.

Điểm cần hiểu đúng: object đã upload lên MinIO nhưng job chưa commit thành công không đồng nghĩa dữ liệu đã được công bố hợp lệ.

### 3.3. Tracking Bronze → Silver

Đã bổ sung `dataset_lineage` vào manifest Silver:

- Ghi input và output từ các batch thực sự tham gia publication.
- Ghi các bước mapping, chuyển kiểu và chuẩn hóa định danh từ kết quả xử lý.
- Ghi các bước cleaning khi cleaning thực sự chạy.
- Liên kết input Bronze với ingestion job ở luồng manual runner sau khi đối chiếu bằng chứng object theo kiểm tra hiện có.
- Phân biệt rehearsal với production.
- Không thêm cạnh Silver → Gold khi chưa có publisher Gold thực tế.

Metadata cleaning đã được tách sang `processing_steps`, truyền qua:

```text
BronzeBatch
  → MappingResult
  → TypeResult
  → IdentityResult
  → Silver manifest
```

Provenance của file gốc không bị biến thành nơi lưu lịch sử cleaning.

### 3.4. Đọc lineage Silver đã công bố

Đã có hàm nội bộ `SilverPublicationService.read_lineage()`:

- Kiểm tra snapshot có trong repository published.
- Đọc manifest và đối chiếu scope, phiên bản, domain và tham chiếu liên quan.
- Với entity được cập nhật: lấy lineage của lần cập nhật đó.
- Với entity được kế thừa: truy về parent snapshot và đối chiếu object reference.
- Với entity thiếu evidence: báo thiếu, không lấy lineage cũ để điền vào kết quả mới.
- Có giới hạn độ sâu và kiểm tra vòng lặp khi truy theo parent.
- Chỉ tải manifest cho truy vấn lineage; không tải toàn bộ Parquet để đọc metadata.

Đây là **service nội bộ**, chưa phải API lineage hoàn chỉnh cho frontend.

### 3.5. Giữ đúng ngữ nghĩa replay

Đã điều chỉnh để:

- Tham chiếu ingestion job phục vụ audit không tự làm đổi định danh dữ liệu.
- Input không có cleaning giữ cách tính hash trước thay đổi lineage.
- Phiên bản cleaning được đưa vào định danh yêu cầu khi có bước cleaning.
- Không sửa lại evidence trong snapshot đã publish để bổ sung thông tin mới theo suy đoán.

### 3.6. Kết quả kiểm tra đã ghi nhận

| Kiểm tra | Kết quả trong lần triển khai gần nhất | Phạm vi chứng minh |
|---|---|---|
| Bộ hồi quy 11 file | **359 test pass** | Contract, ingestion, publication, cleaning và các luồng handoff/standardization liên quan |
| Ruff | Pass trên các file được kiểm tra | Quy tắc lint |
| Mypy | Pass trên 10 file ứng dụng thay đổi | Kiểm tra kiểu trong phạm vi đã chạy |
| `git diff --check` | Pass | Không phát hiện lỗi whitespace trong diff khi kiểm tra |
| Live PostgreSQL/MinIO | **Chưa có kết quả kiểm chứng mới** | Chưa đủ bằng chứng nghiệm thu môi trường thực tế |

Các test có sử dụng SQLite và Parquet thật tại thư mục tạm. Điều đó không thay thế kiểm chứng transaction, object version và quyền truy cập trên PostgreSQL/MinIO thật.

## 4. Những phần còn lại trong task

### 4.1. Kiểm chứng tracking end-to-end trên môi trường thật — ưu tiên tiếp theo

**Liên quan chính:** UDL-176.

Hiện chưa có lần kiểm chứng mới nối toàn bộ bằng chứng sau trong một luồng thực tế:

```text
Nguồn đầu vào
  → ingestion job thành công
  → Bronze object và version cụ thể
  → input đã kiểm chứng của pipeline
  → các transformation thực sự chạy
  → Silver snapshot đã publish
  → lineage đọc lại từ metadata bền vững
```

Cần đối chiếu:

| Đối tượng | Bằng chứng cần kiểm tra |
|---|---|
| Source | Đúng nguồn và bảng/file được chọn; không suy ra version hệ nguồn nếu hệ nguồn không cung cấp |
| Ingestion | Đúng job ID, trạng thái, output và lỗi nếu có |
| Bronze | Đúng dataset, URI nội bộ, object version và checksum |
| Transformation | Đúng bước đã chạy và phiên bản cấu hình được ghi nhận |
| Silver | Đúng snapshot, manifest reference, entity output và trạng thái published |
| Lineage | Các liên kết trên khớp nhau khi đọc lại, không chỉ xuất hiện trong response tạm thời |

Nếu luồng được dự án hỗ trợ hiện chỉ chạy ở chế độ rehearsal, kết quả phải ghi là **kiểm chứng live của luồng rehearsal**, không gọi là production.

### 4.2. Hoàn thiện contract bàn giao — UDL-175

Đã có tài liệu và DTO, nhưng để bàn giao cần đối chiếu lại với bằng chứng chạy thật và xác nhận:

1. Mỗi trường lấy từ đâu, trường nào bắt buộc và trường nào có thể thiếu.
2. ID nào là dataset logic, ID nào là phiên bản object, ID nào là run/snapshot.
3. Quy tắc xác nhận output thành công và xử lý dữ liệu chưa publish.
4. Cách xử lý snapshot cũ thiếu evidence.
5. Cách nối input Silver về ingestion job và nguồn.
6. Giới hạn của dataset lineage so với column lineage.

**Điểm cần rõ với schema hiện tại:**

- `data_lineage` đang biểu diễn quan hệ cột nguồn–đích.
- Dataset evidence mới đang lưu cùng job output và manifest.
- Chưa có migration chuẩn hóa toàn bộ runtime lineage vào `data_processing_run`, `transformation_step` và `data_lineage`.
- Nếu yêu cầu nghiệm thu bắt buộc truy vấn toàn bộ graph bằng các bảng quan hệ đó, cần xác nhận yêu cầu và thiết kế projection/migration tương ứng. Không được coi cách lưu evidence hiện tại là đã đáp ứng một yêu cầu DB chưa được chốt.

### 4.3. API đọc lineage — UDL-177

Chưa có API hoàn chỉnh để frontend đọc luồng Source → Bronze → Silver.

Các khả năng cần thiết kế và triển khai:

- Chọn dataset/version hoặc snapshot cần truy vết.
- Đọc nguồn–đích và transformation từ evidence đã được xác nhận.
- Liên kết Silver input với ingestion job, sau đó tới Source.
- Trả trạng thái thiếu evidence, dữ liệu cũ hoặc tầng chưa có dữ liệu rõ ràng.
- Giới hạn phạm vi và độ sâu truy vấn để không tải graph không kiểm soát.

Tên endpoint, query parameters và response schema cần được chốt trong bước API; tài liệu này không coi một endpoint đề xuất là endpoint đã tồn tại.

### 4.4. Phân quyền và thông tin trả về — đi cùng API

Data Administrator là người dùng chính của story. API cần:

- Xác thực người gọi.
- Kiểm tra quyền `lineage.read` và phạm vi truy cập theo cơ chế RBAC của dự án.
- Bảo vệ cả request trực tiếp, không chỉ ẩn menu trên giao diện.
- Không trả nguyên manifest, thông tin kết nối, credentials hoặc các metadata nhạy cảm không cần thiết.

Quyền xem lineage không tự đồng nghĩa với quyền tải dữ liệu nguồn. Nếu RBAC theo domain chưa hoàn thiện, phải ghi rõ dependency và cách giới hạn truy cập tạm thời; không mặc định mọi người dùng đăng nhập đều được xem.

### 4.5. Giao diện dùng dữ liệu thật — UDL-177

Giao diện cần thay phần mock bằng API đã kiểm chứng và hỗ trợ:

| Tình huống | Cách thể hiện cần có |
|---|---|
| Có dữ liệu và lineage | Hiển thị các node/cạnh tương ứng evidence thực tế |
| Chọn node/quan hệ | Xem dataset nguồn–đích, phiên bản, run và transformation liên quan |
| Entity kế thừa | Hiển thị đúng run tạo dữ liệu, không gán cho run mới nhất |
| Thiếu evidence cũ | Thông báo thiếu bằng chứng; không vẽ cạnh suy đoán |
| Chưa có Gold | Thể hiện chưa có dữ liệu; không vẽ cạnh thành công giả |
| Không đủ quyền | Trạng thái bị từ chối truy cập |
| Loading, lỗi API, kết quả rỗng | Có trạng thái tương ứng để người dùng hiểu tình hình |

Không đưa toàn bộ cấu trúc kỹ thuật nội bộ lên giao diện nếu thông tin đó không giúp Data Administrator đưa ra quyết định.

### 4.6. Truy vết lỗi trước publication — khoảng thiếu cần xác định phạm vi

Hiện tại có thông tin lỗi của ingestion job và Silver publication. Tuy nhiên, cleaning hoặc normalization có thể thất bại **trước khi publisher tạo Silver run**.

Vì vậy chưa thể khẳng định mọi lần chạy đều có journal bền vững từ đầu đến cuối.

Cần đánh giá theo AC truy vết:

1. Những loại lỗi nào đã có report hoặc record bền vững?
2. Report đó có liên kết được với input version và run không?
3. Khi backend khởi động lại, thông tin còn truy được không?
4. Nếu thiếu, nên mở rộng lifecycle hiện tại hay bổ sung run/step record?

Đây là khoảng thiếu đã biết. Chưa triển khai một hệ thống orchestration mới và không tự coi việc đó là điều kiện bắt buộc của task.

### 4.7. Silver → Gold — dependency của nghiệm thu toàn story

Chỉ triển khai tracking Gold khi có luồng publication Gold thực tế với:

- Input Silver cụ thể.
- Output Gold cụ thể.
- Lần chạy thực tế.
- Quy tắc aggregation/transformation được thực thi.
- Trạng thái công bố và evidence tương ứng.

Trong phạm vi subtask tracking hiện tại, **không tạo pipeline Gold hoặc dữ liệu Gold giả để làm đầy sơ đồ**.

## 5. Đối chiếu Acceptance Criteria với hiện trạng

| Acceptance Criterion | Đã có | Còn thiếu để nghiệm thu story |
|---|---|---|
| Thể hiện Source → Bronze → Silver → Gold | Contract hỗ trợ các tầng; producer evidence cho ingestion và Silver | Kiểm chứng live, API/viewer và Gold thực tế |
| Xác định dataset nguồn và đích | Asset/version/run references trong evidence | Đối chiếu xuyên suốt nguồn thật và API liên kết toàn tuyến |
| Thể hiện các bước biến đổi chính | Processing steps và metadata mapping/type/identity trong manifest | Kiểm chứng đúng với execution thật và hiển thị qua API/viewer |
| Hỗ trợ truy vết khi dữ liệu có vấn đề | Version, parent, run references; lỗi ingestion/publication hiện có | Trải nghiệm truy vết sử dụng được và đánh giá lỗi trước publication |

Không đánh dấu toàn bộ story Done chỉ dựa vào số test pass hoặc việc contract có enum `GOLD`.

## 6. Phần sẽ làm tiếp theo: kiểm chứng và hoàn thiện UDL-176

### Bước 1 — Kiểm tra môi trường và luồng được hỗ trợ

- Kiểm tra trạng thái PostgreSQL/MinIO và cấu hình cần thiết bằng thao tác an toàn.
- Kiểm tra schema hiện có và điều kiện chạy pipeline.
- Xác định nguồn/dataset kiểm thử phù hợp với runner của dự án.
- Ghi rõ mode rehearsal/production trước khi chạy.
- Giữ nguyên volume, dữ liệu và các production gate hiện có.

**Đầu ra:** Checklist môi trường và danh sách điều kiện đã đáp ứng/chưa đáp ứng.

### Bước 2 — Kiểm chứng Source → Bronze

- Thực hiện ingestion bằng luồng được hỗ trợ.
- Theo dõi job tới trạng thái kết thúc; không coi trạng thái queued là thành công.
- Đối chiếu job output với Bronze object thực tế.
- Kiểm tra `output.lineage` nhận diện đúng nguồn, dataset đích và version.

**Đầu ra:** Bằng chứng job thành công và object/version tương ứng, không kèm thông tin xác thực.

### Bước 3 — Kiểm chứng Bronze → Silver

- Chọn đúng input Bronze đã kiểm chứng ở bước trước.
- Chạy cleaning/normalization/publication theo luồng hiện có.
- Đối chiếu transformation versions với cấu hình thực sự sử dụng.
- Kiểm tra Silver snapshot và manifest đã được công bố.
- Đọc lại lineage qua read service từ metadata bền vững.

**Đầu ra:** Bộ bằng chứng liên kết Bronze version → transformation → Silver snapshot.

### Bước 4 — Kiểm tra replay, failure và inheritance

Các tình huống lỗi phải sử dụng dữ liệu kiểm thử/phạm vi cô lập phù hợp; không chủ động làm gián đoạn dịch vụ đang dùng hoặc phá dữ liệu thật để thử.

| Trường hợp | Kết quả mong đợi |
|---|---|
| Chạy lại cùng yêu cầu logic | Tái sử dụng đúng kết quả khi thỏa điều kiện idempotency; không sinh lineage trùng |
| Chỉ bổ sung context audit của ingestion | Không tự thay định danh nội dung; không viết lại evidence đã publish |
| Đổi phiên bản cleaning | Phân biệt yêu cầu xử lý mới; không reuse sai kết quả cũ |
| Validation đầu vào thất bại | Không có Bronze output thành công giả |
| Publication thất bại | Không coi manifest staged/orphan là snapshot published |
| Cập nhật một phần entity | Entity không đổi giữ đúng nguồn từ parent |
| Entity được cập nhật nhưng thiếu evidence | Báo thiếu; không lấy lineage cũ thay thế |
| Chưa có Gold | Không xuất hiện cạnh Gold thành công |

**Đầu ra:** Kết quả từng kịch bản, lỗi phát hiện và cách xử lý. Phân biệt test tự động với tình huống đã chạy live.

### Bước 5 — Sửa vấn đề và chốt bằng chứng bàn giao

- Sửa lỗi phát hiện trong phạm vi contract/tracking.
- Chạy lại đúng nhóm test bị ảnh hưởng.
- Cập nhật contract và tài liệu kiểm chứng để phản ánh implementation cuối cùng.
- Liệt kê rõ những giới hạn còn tồn tại.

**Đầu ra:** Căn cứ đánh giá hoàn thành UDL-175/UDL-176 và đầu vào đáng tin cậy cho UDL-177.

## 7. Thứ tự sau khi tracking được xác minh

1. Hoàn thiện contract API và liên kết Source → Bronze → Silver.
2. Tích hợp xác thực, quyền và giới hạn dữ liệu trả về.
3. Kết nối giao diện với API, xử lý trạng thái thiếu/lỗi/chưa có Gold.
4. Kiểm thử trải nghiệm truy vết của Data Administrator xuyên suốt frontend–backend.
5. Đánh giá và xử lý khoảng thiếu của run journal theo phạm vi được xác định.
6. Tích hợp Gold lineage khi có publication Gold thực tế.

Không chốt ngày hoàn thành hoặc khối lượng còn lại chỉ từ số dòng code. Kết quả kiểm chứng live và các dependency RBAC/Gold sẽ quyết định phần việc còn lại.

## 8. Checklist bàn giao

### Đã có theo kết quả triển khai ghi nhận

- [x] Contract dataset lineage và tài liệu giải thích.
- [x] Ghi evidence vào output ingestion.
- [x] Ghi evidence vào Silver manifest.
- [x] Tách processing metadata khỏi provenance file gốc.
- [x] Read service cho lineage Silver đã publish và entity kế thừa.
- [x] Test cho contract, replay, missing evidence và published-only reads.

### Chưa nghiệm thu

- [ ] Kiểm chứng end-to-end trên PostgreSQL/MinIO thật và ghi rõ mode.
- [ ] Chốt bằng chứng bàn giao UDL-175/UDL-176 sau kiểm chứng.
- [ ] API liên kết lineage toàn tuyến hiện có.
- [ ] Xác thực, quyền và scope cho API lineage.
- [ ] Giao diện dùng dữ liệu thật.
- [ ] Xác định mức đáp ứng truy vết lỗi trước publication.
- [ ] Tracking Gold thực tế khi dependency sẵn sàng.
- [ ] Nghiệm thu đầy đủ bốn Acceptance Criteria của story.

## 9. Tài liệu và mã nguồn tham chiếu

- [Lineage contract](data-lineage-contract.md).
- [Báo cáo rà soát nghiệp vụ](data-lineage-review.md).
- [Tích hợp Silver qua Parquet và manifest](standardization/silver-integration-p5.md).
- [Quyết định module boundary](module-boundary-questions-and-decisions.md).
- [Schema database hiện tại](../infra/postgres/init/02-schema.sql).
- [DTO lineage](../backend/app/modules/governance/contracts.py).
- [Luồng ingestion](../backend/app/modules/ingestion/execution.py).
- [Bộ dựng evidence Silver](../backend/app/modules/pipeline/lineage.py).
- [Publication và read service Silver](../backend/app/modules/pipeline/silver_publication.py).

Các mã task và phạm vi subtask trong tài liệu dựa trên nội dung đã trao đổi trong phiên làm việc. Tài liệu không khẳng định trạng thái Jira đã được cập nhật hoặc được kiểm tra lại trực tiếp khi soạn bản tổng hợp này.
