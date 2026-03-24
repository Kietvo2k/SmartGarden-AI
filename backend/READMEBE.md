# SmartGardenAI Backend

## Tiếng Việt

### 1. Backend này là gì?

Đây là backend scaffold theo hướng `JSON-first` để chuyển dần logic từ frontend demo sang service/backend có cấu trúc hơn.

Hiện nó đóng vai trò nền cho:

- recommendation engine tưới cây
- commerce và ownership flow
- verify mã máy trước khi thêm cây
- plant provisioning
- device lifecycle

### 2. Những gì backend đang bao phủ

- recommendation engine cho tưới
- sản phẩm, checkout, đơn hàng
- reveal mã máy sau khi đơn đủ điều kiện
- verify máy thuộc user trước khi tạo cây
- kiểm tra khe còn lại
- action vòng đời thiết bị
- schema validate an toàn hơn cho payload số

### 3. Route hiện có

- `GET /health`
- `GET /api/v1/products`
- `GET /api/v1/orders?userEmail=...`
- `GET /api/v1/devices/owned?userEmail=...`
- `POST /api/v1/checkout`
- `POST /api/v1/admin/orders/status`
- `POST /api/v1/devices/link`
- `POST /api/v1/plants/verify-machine`
- `POST /api/v1/plants`
- `POST /api/v1/devices/:machineCode/lifecycle`
- `GET /api/v1/plants/:plantId/recommendation`

### 4. Business rules chính

- mã máy chỉ gồm chữ số, tối đa 8 ký tự
- `28022026` chỉ là sandbox/demo code
- user phải sở hữu và verify thiết bị trước khi tạo cây
- Standard và Pro có quota khe khác nhau
- payload số được validate tập trung
- checkout của user thường bị chặn nếu vượt hạn mức ngày
- hành vi lặp bất thường có thể dẫn tới `store freeze`

### 5. Dữ liệu runtime

Backend dùng:

- `backend/data/runtime-data.json`

Dữ liệu mẫu nằm ở:

- `backend/data/runtime-data.example.json`

### 6. Chạy local

```bash
cd backend
npm install
npm run dev
```

### 7. Ghi chú hiện trạng

- backend hiện là scaffold, chưa phải production DB thật
- repository hiện vẫn theo kiểu JSON adapter
- mục tiêu là giữ domain/service rõ trước, rồi mới thay storage phía dưới

---

## English

### 1. What is this backend?

This is a `JSON-first` backend scaffold used to gradually move SmartGardenAI logic out of the frontend demo into a more structured backend/service layer.

It currently acts as the foundation for:

- irrigation recommendation logic
- commerce and ownership flow
- machine-code verification before plant creation
- plant provisioning
- device lifecycle handling

### 2. What the backend currently covers

- irrigation recommendation engine
- products, checkout, and orders
- machine-code reveal after eligible order states
- ownership verification before plant creation
- slot-availability checks
- device lifecycle actions
- safer numeric schema validation

### 3. Current routes

- `GET /health`
- `GET /api/v1/products`
- `GET /api/v1/orders?userEmail=...`
- `GET /api/v1/devices/owned?userEmail=...`
- `POST /api/v1/checkout`
- `POST /api/v1/admin/orders/status`
- `POST /api/v1/devices/link`
- `POST /api/v1/plants/verify-machine`
- `POST /api/v1/plants`
- `POST /api/v1/devices/:machineCode/lifecycle`
- `GET /api/v1/plants/:plantId/recommendation`

### 4. Core business rules

- machine code must be numeric and at most 8 characters
- `28022026` is sandbox/demo only
- a user must own and verify a device before creating a plant
- Standard and Pro have different slot quotas
- numeric payloads are centrally validated
- normal-user checkout is blocked above the daily cap
- repeated suspicious behavior can trigger store freeze

### 5. Runtime data

The backend expects:

- `backend/data/runtime-data.json`

Sample data is provided in:

- `backend/data/runtime-data.example.json`

### 6. Run locally

```bash
cd backend
npm install
npm run dev
```

### 7. Current notes

- this backend is still a scaffold, not a full production DB service
- repositories currently use a JSON adapter approach
- the idea is to stabilize domain and service boundaries first, then replace storage later
