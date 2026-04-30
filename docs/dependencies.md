# Dependency Registry

> Cap nhat file nay truoc khi merge PR neu them hoac xoa package.

---

## Runtime Dependencies

| Package | Version | Muc dich | Dung o dau | Nguoi them | Ngay them |
|---------|---------|----------|------------|------------|-----------|
| next | ^16.1.6 | Next.js framework (App Router) | Toan bo project | - | - |
| react | ^19.2.0 | UI library | Toan bo project | - | - |
| react-dom | ^19.2.0 | React DOM renderer | Toan bo project | - | - |
| axios | ^1.13.2 | HTTP client cho API, auth token, timeout | `src/configs/axios-client.ts` | codex | 2026-04-29 |
| zod | ^4.1.12 | Schema validation cho form Account | `src/features/account/types/account.schema.ts` | codex | 2026-04-29 |
| react-hook-form | ^7.66.0 | Quan ly state form Account | `src/features/account/components/AccountFormModal.tsx` | codex | 2026-04-29 |
| @hookform/resolvers | ^5.2.2 | Ket noi Zod voi React Hook Form | `src/features/account/components/AccountFormModal.tsx` | codex | 2026-04-29 |
| react-hot-toast | ^2.6.0 | Toast thong bao thao tac Account | `src/features/account/components/AccountTable.tsx` | codex | 2026-04-29 |
| tailwind-merge | ^2.6.0 | Merge Tailwind classes tranh conflict | Tat ca components | - | - |
| flatpickr | ^4.6.13 | Date/time picker | Calendar, form date inputs | - | - |
| swiper | ^11.2.10 | Carousel/slider component | Trang can slider | - | - |
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

| Package | Version | Muc dich | Nguoi them | Ngay them |
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

## Deprecated / Da xoa

| Package | Ly do xoa | Thay the bang | Ngay xoa |
|---------|-----------|---------------|----------|
| _(chua co)_ | | | |
