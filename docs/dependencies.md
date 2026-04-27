# 📦 Dependency Registry

> **Quy tắc bắt buộc**: Cập nhật file này **trước khi** merge PR khi thêm hoặc xóa bất kỳ package nào.
> Xem chi tiết quy trình tại **CODING_RULES.md Section 24**.

---

## Runtime Dependencies

| Package | Version | Mục đích | Dùng ở đâu | Người thêm | Ngày thêm |
|---------|---------|----------|------------|------------|-----------|
| next | ^16.1.6 | Next.js framework (App Router) | Toàn bộ project | - | - |
| react | ^19.2.0 | UI library | Toàn bộ project | - | - |
| react-dom | ^19.2.0 | React DOM renderer | Toàn bộ project | - | - |
| tailwind-merge | ^2.6.0 | Merge Tailwind classes tránh conflict | Tất cả components | - | - |
| flatpickr | ^4.6.13 | Date/time picker | Calendar, form date inputs | - | - |
| swiper | ^11.2.10 | Carousel/slider component | Trang cần slider | - | - |
| apexcharts | ^4.7.0 | Chart library | Dashboard charts | - | - |
| react-apexcharts | ^1.8.0 | React wrapper cho ApexCharts | Dashboard charts | - | - |
| @fullcalendar/react | ^6.1.19 | Full-featured calendar component | Calendar page | - | - |
| @fullcalendar/core | ^6.1.19 | FullCalendar core | Calendar page | - | - |
| @fullcalendar/daygrid | ^6.1.19 | FullCalendar month/day view | Calendar page | - | - |
| @fullcalendar/timegrid | ^6.1.19 | FullCalendar time grid view | Calendar page | - | - |
| @fullcalendar/list | ^6.1.19 | FullCalendar list view | Calendar page | - | - |
| @fullcalendar/interaction | ^6.1.19 | FullCalendar drag & drop | Calendar page | - | - |
| react-dnd | ^16.0.1 | Drag and drop | Kanban/board UI | - | - |
| react-dnd-html5-backend | ^16.0.1 | HTML5 backend cho react-dnd | Kanban/board UI | - | - |
| react-dropzone | ^14.3.8 | File upload dropzone | Upload components | - | - |
| @react-jvectormap/core | ^1.0.4 | Vector map core | Dashboard map | - | - |
| @react-jvectormap/world | ^1.1.2 | World map data | Dashboard map | - | - |
| @tailwindcss/forms | ^0.5.10 | Tailwind forms plugin | Form styling | - | - |

---

## Dev Dependencies

| Package | Version | Mục đích | Người thêm | Ngày thêm |
|---------|---------|----------|------------|-----------|
| typescript | ^5.9.3 | TypeScript compiler | - | - |
| eslint | ^9.39.1 | Linting | - | - |
| eslint-config-next | 16.0.7 | Next.js ESLint rules | - | - |
| @eslint/eslintrc | ^3.3.1 | ESLint config helper | - | - |
| tailwindcss | ^4.1.17 | CSS utility framework | - | - |
| @tailwindcss/postcss | ^4.1.17 | PostCSS plugin cho Tailwind 4 | - | - |
| postcss | ^8.5.6 | CSS post-processing | - | - |
| autoprefixer | ^10.4.22 | CSS vendor prefix | - | - |
| @svgr/webpack | ^8.1.0 | Import SVG as React component | - | - |
| @types/node | ^20.19.25 | TypeScript types cho Node.js | - | - |
| @types/react | ^19.2.1 | TypeScript types cho React | - | - |
| @types/react-dom | ^19.2.1 | TypeScript types cho ReactDOM | - | - |
| @types/react-transition-group | ^4.4.12 | TypeScript types cho transition | - | - |

---

## ⏳ Planned / Cần thêm

| Package | Mục đích | Ưu tiên | Note |
|---------|---------|---------|------|
| axios | HTTP client với interceptor auth | 🔴 High | Cần thiết cho API calls có auth |
| zod | Schema validation | 🔴 High | Cần cho form validation |
| react-hook-form | Form state management | 🔴 High | Kết hợp với Zod |
| @hookform/resolvers | Bridge react-hook-form ↔ Zod | 🔴 High | Đi kèm với react-hook-form |
| react-hot-toast | Toast notification | 🟡 Medium | Nhẹ, không cần setup phức tạp |

---

## 🗑️ Deprecated / Đã xóa

| Package | Lý do xóa | Thay thế bằng | Ngày xóa |
|---------|-----------|--------------|----------|
| _(chưa có)_ | | | |

---

## Quy tắc khi thêm dependency mới

1. **Kiểm tra** bảng "Runtime Dependencies" và "Planned" – có package đó rồi không?
2. **So sánh** bundle size trên [bundlephobia.com](https://bundlephobia.com)
3. **Kiểm tra** last publish date và weekly downloads (package phải được maintain tích cực)
4. **Thêm** vào bảng đúng (`dependencies` vs `devDependencies`) **trước khi** tạo PR
5. Nếu **thay thế** package cũ → ghi vào mục "Deprecated"

> ⚠️ PR sẽ bị reject nếu thêm package mà không cập nhật file này.
