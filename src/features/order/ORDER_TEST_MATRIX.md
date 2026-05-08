# Order Management — Test Matrix

## Roles
| roleId | roleName     |
|--------|--------------|
| 3      | Staff        |
| 4      | Merchandise  |
| 1/2    | Admin        |

---

## A. List page — Filter preset theo role

| Role        | Default filter gửi lên           | Kết quả kỳ vọng                          |
|-------------|-----------------------------------|------------------------------------------|
| Staff       | `statusIds=[1,2]`                 | Chỉ thấy Pending + Confirmed             |
| Merchandise | `statusIds=[2,3,4]`               | Chỉ thấy Confirmed + Processing + Shipped|
| Admin       | Không gửi statusId                | Thấy tất cả đơn                         |
| Bất kỳ      | Chọn trạng thái cụ thể            | Gửi `statusId=<id>` thay thế default    |
| Bất kỳ      | Tick "Đơn của tôi"               | Thêm `assignedToMe=true`                |
| Bất kỳ      | Nhập keyword                     | Debounce 350ms, reset về trang 1         |

---

## B. OrderRow — Hiển thị

| Trường              | Kỳ vọng                                                             |
|---------------------|---------------------------------------------------------------------|
| 2 badges            | Badge đơn (màu theo statusId) + Badge thanh toán (màu riêng)       |
| Badge "Chưa gán"    | Dashed border + italic khi assignedToStaffName = null               |
| Timestamps          | orderDate + ✓ confirmedAt (nếu có) + ↑ shippedAt (nếu có)         |

---

## C. OrderDetailModal — Quyền action

| Role        | Status đơn   | canConfirm | canProcess | canShip | canCancel | canAssign |
|-------------|--------------|:----------:|:----------:|:-------:|:---------:|:---------:|
| Staff       | Pending      | ✓          | ✗          | ✗       | ✓         | ✗         |
| Staff       | Confirmed    | ✗          | ✗          | ✗       | ✓         | ✗         |
| Staff       | Processing   | ✗          | ✗          | ✗       | ✗         | ✗         |
| Staff       | Shipped+     | ✗          | ✗          | ✗       | ✗         | ✗         |
| Merchandise | Pending      | ✗          | ✗          | ✗       | ✗         | ✗         |
| Merchandise | Confirmed    | ✗          | ✓          | ✗       | ✗         | ✗         |
| Merchandise | Processing   | ✗          | ✗          | ✓       | ✗         | ✗         |
| Merchandise | Shipped+     | ✗          | ✗          | ✗       | ✗         | ✗         |
| Admin       | Pending      | ✓          | ✗          | ✗       | ✓         | ✓         |
| Admin       | Confirmed    | ✗          | ✓          | ✗       | ✓         | ✓         |
| Admin       | Processing   | ✗          | ✗          | ✓       | ✗         | ✓         |
| Admin       | Shipped      | ✗          | ✗          | ✗       | ✗         | ✓         |
| Admin       | Completed    | ✗          | ✗          | ✗       | ✗         | ✗         |
| Admin       | Cancelled    | ✗          | ✗          | ✗       | ✗         | ✗         |

---

## D. OrderDetailModal — Tabs & Sections

| Tab              | Điều kiện hiển thị              | Nội dung                                              |
|------------------|---------------------------------|-------------------------------------------------------|
| Tổng quan        | Luôn hiện                       | Giao hàng, Thanh toán, Tiến trình, Vận chuyển, Sản phẩm, Tổng tiền |
| Lịch sử đơn (N)  | Luôn hiện                       | Timeline với system rows (⚙ Hệ thống) vs user rows   |
| Lịch sử vận chuyển (N) | Chỉ khi shippingHistory.length > 0 | Bảng Previous/New/Source/Time                    |

| Section          | Điểm kiểm tra                                                |
|------------------|--------------------------------------------------------------|
| Thanh toán       | PaymentBadge riêng, PaidAt hiển thị chỉ khi PAID            |
| Vận chuyển       | Chỉ render khi `order.shipping != null`                      |
| Actual fee       | Highlight màu brand khi `actualShippingFee != null`          |
| Cancellation box | Render khi `statusName === Cancelled`, hiện reason + by + at |
| System history   | Dashed border + italic + "⚙ Hệ thống (auto)"                |

---

## E. Action Modals — Validation

| Modal   | Validation                         | Expected behavior                             |
|---------|------------------------------------|-----------------------------------------------|
| Confirm | note optional                      | Submit OK với note rỗng                       |
| Process | note optional                      | Submit OK với note rỗng                       |
| Ship    | provider required                  | Cannot submit khi provider rỗng               |
| Cancel  | reason required min 1 char         | Error message hiện khi submit rỗng            |
| Assign  | targetAccountId > 0                | Error khi chọn "-- Vui lòng chọn --" (value=0)|

---

## F. API Error responses

| HTTP  | Scenario                            | UI kỳ vọng                                         |
|-------|-------------------------------------|-----------------------------------------------------|
| 404   | orderId không tồn tại              | toast.error "Đơn hàng không tồn tại..."             |
| 403   | Role không có quyền                 | toast.error (nút đã bị ẩn — trường hợp race condition) |
| 422   | Transition trạng thái không hợp lệ | toast.error với message từ backend                  |
| 502   | Shipping provider API lỗi           | toast.error hiện message từ provider                |

---

## G. AssignModal — roleId logic

| Order Status             | targetRoleId tìm kiếm | Lý do                              |
|--------------------------|----------------------|------------------------------------|
| Pending                  | 3 (Staff)            | Giai đoạn Staff nhận đơn           |
| Confirmed / Processing / Shipped | 4 (Merchandise) | Giai đoạn Merchandise đóng gói |
| Các trạng thái khác      | 3 (Staff) default    | Fallback                           |

---

## H. Regression checklist

- [ ] Staff login → List chỉ thấy Pending/Confirmed theo default
- [ ] Merchandise login → List chỉ thấy Confirmed/Processing/Shipped
- [ ] Admin login → List thấy tất cả; có thể filter từng status
- [ ] Tick "Đơn của tôi" → lọc đúng assignedToMe=true
- [ ] Xem chi tiết đơn Pending (Staff) → Hiện nút "Xác nhận đơn" + "Hủy đơn"
- [ ] Xem chi tiết đơn Pending (Merchandise) → Không có nút nào
- [ ] Xem chi tiết đơn Shipped (Staff) → Không có nút Hủy
- [ ] Auto-confirm row trong lịch sử → Hiện "⚙ Hệ thống (auto)"
- [ ] Đơn có actualShippingFee → Hiện dòng "Phí vận chuyển thực tế" màu brand
- [ ] Đơn bị hủy → Hiện cancellation box đỏ với reason + by + at
- [ ] Ship modal submit → Nếu 502, toast.error hiện message provider
