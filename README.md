# SmartGardenAI

## Tiếng Việt

### 1. SmartGardenAI là gì?

SmartGardenAI là demo sản phẩm tưới cây thông minh, kết hợp:

- dashboard theo dõi cây và vùng trồng
- logic tưới và mô phỏng cảm biến
- luồng mua thiết bị và sở hữu mã máy
- liên kết thiết bị bằng mã máy
- AI local hỗ trợ hỏi đáp, hướng dẫn và thao tác an toàn
- admin panel cho đơn hàng, moderation, risk event và inbox/report

Mục tiêu của demo là mô phỏng gần với một product thật, nhưng vẫn đủ nhanh để thử trực tiếp ngay trên trình duyệt.

### 2. Cấu trúc chính

- `index.html`
  - frontend demo chạy một file
  - chứa auth, dashboard, store, admin, AI local, simulation
- `backend/`
  - backend scaffold bằng TypeScript
  - tách dần logic sang service và route có cấu trúc hơn
- `backend/data/runtime-data.example.json`
  - dữ liệu mẫu cho backend scaffold

### 3. Cách chạy local

#### Frontend demo

Mở trực tiếp file:

- `index.html`

Demo hiện lưu dữ liệu bằng:

- `localStorage`
- `sessionStorage`

Nếu muốn reset dữ liệu demo, hãy xóa storage của trình duyệt cho trang local đó.

#### Backend scaffold

```bash
cd backend
npm install
npm run dev
```

Sao chép file dữ liệu mẫu:

- từ `backend/data/runtime-data.example.json`
- thành `backend/data/runtime-data.json`

### 4. Luồng sản phẩm hiện tại

#### Auth-first flow

1. Vào landing page
2. Đăng nhập hoặc đăng ký
3. Vào dashboard
4. Hoàn thiện hồ sơ nếu cần
5. Mua thiết bị hoặc liên kết mã máy
6. Thêm cây sau khi có thiết bị hợp lệ

#### Luồng cửa hàng

1. Chọn sản phẩm
2. Thêm vào giỏ
3. Checkout ngay trong trang store
4. Đơn vào trạng thái chờ duyệt
5. Demo tự duyệt nhanh sau khoảng 10 giây
6. Thiết bị mới và mã máy xuất hiện trong khu `Thiết bị của tôi`

#### Luồng mã máy

- Mã máy chỉ gồm chữ số
- Tối đa 8 ký tự
- Không hiện cho người dùng trước khi đơn đủ điều kiện
- `28022026` chỉ là mã sandbox/dev
- Người dùng phải sở hữu thiết bị thì mới liên kết được mã máy đó

#### Luồng thêm cây

- Có thể mở form thêm cây ngay
- Chỉ lưu được khi chọn thiết bị hợp lệ
- Thiết bị phải thuộc tài khoản hiện tại
- Thiết bị không được bị khóa, tạm ngưng hoặc remove
- Thiết bị phải còn khe khả dụng

### 5. Quy tắc thiết bị và khe

- `Standard` có khe mặc định thấp hơn `Pro`
- `Pro` có nhiều khe hơn để gắn nhiều cây/khu trồng
- Có hỗ trợ mua thêm `Gói mở rộng phụ kiện`
- Khe mở rộng sẽ được cộng thêm vào thiết bị đang sở hữu
- Dashboard luôn hiển thị:
  - mã máy
  - trạng thái thiết bị
  - firmware
  - số khe đang dùng
  - số khe còn lại

### 6. Mô phỏng cây và dữ liệu demo

Form thêm cây hỗ trợ chế độ:

- `Dữ liệu từ thiết bị`
- `Cây quét / mô phỏng`

Chế độ mô phỏng sẽ sinh dữ liệu hợp lý cho demo:

- độ ẩm đất
- nhiệt độ
- độ ẩm không khí
- ánh sáng
- xác suất mưa
- điểm sức khỏe cây

Dữ liệu mô phỏng luôn được gắn nhãn để không nhầm với dữ liệu thật.

### 7. AI local trên web

AI local hiện hỗ trợ:

- tóm tắt toàn vườn
- giải thích có nên tưới hay không
- đọc độ ẩm, cảm biến, tình trạng thiết bị
- giải thích vì sao chưa thêm được cây
- hướng dẫn cách mua thiết bị, xem mã máy, liên kết máy
- kiểm tra đơn hàng
- mở đúng màn hình cần thao tác
- hỗ trợ action có xác nhận như hoãn tưới hoặc tưới tay

AI không được vượt quyền đối với:

- auth
- ownership
- moderation
- purchase rules
- slot rules
- lifecycle rules

### 8. Admin panel

Admin hiện có thể quản lý:

- người dùng
- đơn hàng
- risk event
- report / inbox
- mở lại tài khoản hoặc cửa hàng bị tạm khóa

Tài khoản admin trong bản demo được ưu tiên toàn quyền hơn user thường, để tiện test và vận hành demo.

### 9. Device lifecycle

Thiết bị hiện hỗ trợ các trạng thái chính:

- `available`
- `owned`
- `inactive`
- `locked`
- `removed`
- `sandbox`

Các action hiện có trong demo:

- kích hoạt lại
- tạm ngưng
- reset máy
- ngắt liên kết
- khóa
- gỡ khỏi tài khoản

### 10. Ghi chú phát triển

- Frontend hiện vẫn là single-file prototype để triển khai nhanh
- Backend mới là scaffold production-minded, chưa phải hệ DB hoàn chỉnh
- Bước tiếp theo tốt nhất là nối state từ frontend sang backend API thật
- Sau đó mới nâng AI từ local rule-based sang API-backed assistant

### 11. Tài liệu backend

Xem thêm:

- `backend/README.md`

---

## English

### 1. What is SmartGardenAI?

SmartGardenAI is a smart irrigation product demo that combines:

- plant and growing-zone dashboarding
- irrigation logic and sensor simulation
- store flow for buying devices
- machine-code ownership and linking
- local AI support for questions, guidance, and guarded actions
- admin tools for orders, moderation, risk events, and inbox/report handling

The goal is to feel close to a real product while still being fast to run directly in the browser.

### 2. Main structure

- `index.html`
  - single-file frontend demo
  - contains auth, dashboard, store, admin, local AI, and simulation
- `backend/`
  - TypeScript backend scaffold
  - gradually moves logic out of the frontend into structured services and routes
- `backend/data/runtime-data.example.json`
  - sample runtime data for the backend scaffold

### 3. How to run locally

#### Frontend demo

Open:

- `index.html`

The demo currently stores state in:

- `localStorage`
- `sessionStorage`

If you want a clean demo state, clear browser storage for the local page.

#### Backend scaffold

```bash
cd backend
npm install
npm run dev
```

Copy:

- `backend/data/runtime-data.example.json`

to:

- `backend/data/runtime-data.json`

### 4. Current product flows

#### Auth-first flow

1. Open the landing page
2. Log in or register
3. Enter the dashboard
4. Complete the user profile if needed
5. Buy a device or link a machine code
6. Create plants only after a valid device is available

#### Store flow

1. Browse products
2. Add items to cart
3. Checkout inside the store flow
4. Order enters review state
5. Demo auto-approves after about 10 seconds
6. New devices and machine codes appear in `Thiết bị của tôi`

#### Machine-code flow

- Machine code must be digits only
- Maximum length is 8 characters
- It is not shown before the order is eligible
- `28022026` is sandbox/dev only
- A user can only link a code for a device they own

#### Plant creation flow

- Users can open the plant form at any time
- Submission is allowed only when a valid device is selected
- The device must belong to the current account
- The device must not be locked, inactive, or removed
- The device must still have available slots

### 5. Device and slot rules

- `Standard` has fewer default slots than `Pro`
- `Pro` supports more linked plants/zones
- The demo also supports buying an expansion item
- Expansion credits are added to owned devices
- The dashboard shows:
  - machine code
  - device status
  - firmware
  - used slots
  - remaining slots

### 6. Simulated plant mode

The plant form supports:

- `Dữ liệu từ thiết bị`
- `Cây quét / mô phỏng`

Simulation mode generates demo-friendly values for:

- soil moisture
- temperature
- air humidity
- light
- rain probability
- plant health score

Simulated data is always labeled so it is not confused with real device data.

### 7. Local AI support

The local AI currently supports:

- whole-garden summaries
- irrigation explanation
- sensor and device status questions
- explaining why plant creation is blocked
- guidance for buying devices and linking machine codes
- order-status questions
- opening the right screen for the user
- guarded actions such as manual irrigation or irrigation defer

The AI does not bypass:

- auth
- ownership
- moderation
- purchase rules
- slot rules
- lifecycle rules

### 8. Admin panel

Admins can currently manage:

- users
- orders
- risk events
- reports / inbox
- restoring frozen user or store access

In this demo, admin accounts have broader permissions than normal users so testing and moderation flows are easier.

### 9. Device lifecycle

Current core states include:

- `available`
- `owned`
- `inactive`
- `locked`
- `removed`
- `sandbox`

Current demo actions include:

- reactivate
- deactivate
- reset device
- disconnect
- lock
- remove from account

### 10. Development notes

- The frontend is still a single-file prototype for fast iteration
- The backend is a production-minded scaffold, not a full database-backed system yet
- The next strong step is moving state from browser storage into backend APIs
- After that, the AI can evolve from local rules into an API-backed assistant

### 11. Backend docs

See:

- `backend/README.md`
