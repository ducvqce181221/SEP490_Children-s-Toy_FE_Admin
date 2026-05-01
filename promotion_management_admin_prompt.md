> Bạn là senior Frontend (Next.js/React).
>
> Nhiệm vụ: xây dựng UI cho module **Promotion Management** trong project `SEP490_Children-s-Toy_FE_Admin`.
>
> ---
>
> ## 🔴 Yêu cầu bắt buộc
>
> * Đọc và tuân thủ `CODING_RULES.md` của FE project
> * UI/structure phải đồng bộ với các module hiện có, đặc biệt là **Voucher Management** (`/admin/vouchers`)
> * Không tự ý thay đổi pattern đã có
>
> ---
>
> ## 📂 Routing (BẮT BUỘC)
>
> Sử dụng **page-based flow**, KHÔNG dùng modal cho form chính:
>
> ```
> /admin/promotions
> /admin/promotions/create
> /admin/promotions/[id]
> ```
>
> ---
>
> ## 🧩 UI Flow
>
> ### 1. Promotion List
>
> * Hiển thị danh sách promotion
> * Actions:
>
>   * Create
>   * Edit
>   * View Detail
>
> ---
>
> ### 2. Promotion Create / Edit Page
>
> #### (A) General Information
>
> * Promotion Name
> * Start Date / End Date
> * Promotion Type
> * Description
>
> #### (B) Products in Promotion
>
> * Table danh sách sản phẩm (ban đầu rỗng)
> * Nút: **[+ Add Products]**
>
> ---
>
> ### 3. Product Picker (Modal duy nhất)
>
> Khi bấm **Add Products**:
>
> * Mở modal chọn sản phẩm từ API `/products`
> * Có:
>
>   * Search
>   * Filter
>   * Checkbox multi-select
> * Sau khi confirm:
>
>   * Thêm vào table ở page
>   * KHÔNG gọi API lưu ngay
>
> ---
>
> ### 4. Configure Product Promotion
>
> Tại table:
>
> * Cho phép nhập (xem backend để biết chi tiết):
>
>   Ví dụ:
>   * Discount (% hoặc giá)
>   * Sale Price
>   * Quantity / limit
>
> ---
>
> ### 5. Save Promotion
>
> * Khi bấm Save:
>
>   * Gửi toàn bộ:
>
>     * Promotion info
>     * Danh sách products + config
> * Backend xử lý:
>
>   * Promotions
>   * ProductPromotions
>
> ---
>
> ## ⚙️ Behavior Rules
>
> * Flow: **Select → Configure → Save all**
> * Không lưu product khi chọn trong modal
> * Cho phép:
>
>   * Remove product khỏi list
>   * Edit inline
> * Validate:
>
>   * Trùng sản phẩm
>   * Rule từ backend
>
> ---
>
> ## 🧱 Kiến trúc FE (quan trọng)
>
> Phải tách component rõ ràng:
>
> * `PromotionForm`
> * `ProductTable`
> * `ProductPickerModal` ⭐ (reusable)
> * `usePromotions` (custom hook)
>
> ---
>
> ## 🔌 API Integration
>
> * Kết nối đầy đủ API Promotion
> * Sử dụng API Products cho ProductPicker
>
> ---
>
> ## ⚠️ Trước khi code
>
> * Kiểm tra API hiện có
> * Nếu thiếu:
>
>   * Liệt kê rõ API còn thiếu
> * Nếu cần sửa BE:
>
>   * Đọc `CODING_RULES.md` của BE (`SEP490_Children-s-Toy_Backend`)
