# Source configuration và normalization profile

Đặc tả đề xuất P0; chưa phải API/ORM đã triển khai.

## Source configuration

`data_source_id` xác định cấu hình kết nối; `source_system_id` xác định hệ thống nguồn bền vững. Nhiều cấu hình upload/API/DB có thể cùng một hệ thống. Thay cấu hình không tạo namespace ID mới. FILE_SHARE chỉ là nơi vận chuyển: phải khai báo hệ thống phát sinh dữ liệu, không dùng FILE_SHARE làm namespace chung cho mọi file.

Không chứa quy tắc chuyển đổi và không nhúng credentials vào profile, log hoặc manifest.

## Binding bắt buộc

| Trường | Ý nghĩa |
|---|---|
| source_system_id / namespace | Danh tính hệ thống phát sinh, ổn định và được đăng ký |
| data_source_id, dataset_id | Cấu hình thu thập và dataset logic |
| domain_id, entity | Owner và mức hạt; xác nhận bằng registry |
| source_schema_version | Cấu trúc nguồn đã nhận diện |
| normalization_profile_id, version | Phiên bản profile active tường minh |

Không có đúng một binding thì chặn trước chạy (`PROFILE_NOT_FOUND` / `PROFILE_AMBIGUOUS`). Thay đổi cấu trúc phải validate compatibility, không tự đoán entity từ tên file.

## Profile bất biến sau kích hoạt

Profile tham chiếu target schema version; field mapping; locale, timezone, date formats và null tokens per field; enum dictionary version; crosswalk policy version; authority policy; PII policy; strict snapshot policy. DRAFT → VALIDATED → ACTIVE → RETIRED. Preview không kích hoạt profile và không ghi Silver. Run đang chạy giữ version cũ khi profile mới active.

## Bronze handoff cần mở rộng tại S2

Ngoài `batch_id`, `domain_id`, `source_type`, `records` hiện có: bắt buộc binding ở trên, bucket/object key/version/checksum, source record locator, ingestion timestamp, schema fingerprint. Nếu object storage không có version phải có bất biến theo key và checksum. Namespace FK được khai báo riêng khi FK trỏ hệ thống khác; không mặc định mọi FK thuộc hệ thống của record con.

Run pin toàn bộ tham chiếu. Locator là số dòng CSV hoặc JSON path + object version; không lấy giá trị PII làm locator. Lỗi gồm run/batch/locator/entity/field/rule/version/code/severity; raw value nhạy cảm không ghi vào log thường.
