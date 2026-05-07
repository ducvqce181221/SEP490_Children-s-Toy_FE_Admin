# 📘 CODING RULES & CONVENTIONS

> Áp dụng cho: **SEP490 – Children's Toy Admin FE**
> Stack: **Next.js 16** · **React 19** · **TypeScript 5** · **TailwindCSS 4** · **Axios** · App Router

---

## 1. 📁 Folder Structure

```
src/
├── app/                        # Next.js App Router (Routing & Layout)
│   ├── (admin)/                # Nhóm route có sidebar/header
│   │   ├── admin/              # Prefix /admin/...
│   │   │   ├── <module>/       # Từng module chức năng (accounts, brands, vouchers...)
│   │   │   └── page.tsx        # Dashboard (@/admin)
│   │   └── layout.tsx          # Admin layout (Sidebar, Header)
│   ├── (auth)/                 # Nhóm route authentication
│   ├── (error-pages)/          # Các trang lỗi (404, 500...)
│   ├── globals.css
│   ├── layout.tsx              # Root layout (Font, Providers)
│   └── page.tsx                # Root redirect
│
├── features/                   # 🚀 MODULE CHỨC NĂNG (TRỌNG TÂM)
│   └── <feature>/              # Ví dụ: brand, category, voucher, promotion...
│       ├── components/         # UI components RIÊNG của feature này
│       ├── hooks/              # Logic & State quản lý riêng (useVoucher.ts)
│       ├── services/           # Định nghĩa API calls (voucher-api.ts)
│       └── types/              # TS Types & Zod Schemas của module
│
├── components/                 # Shared/reusable UI components
│   ├── ui/                     # 🎨 TailAdmin Primitives (Button, Modal, Table...)
│   ├── common/                 # Components dùng chung (Breadcrumb, Pagination...)
│   ├── form/                   # Shared form elements (InputGroup, Select...)
│   └── ...
│
├── configs/                    # Axios client, App constants
├── context/                    # Global Context (Theme, Sidebar)
├── hooks/                      # Global Hooks (useModal, useGoBack)
├── layout/                     # Shell components (Sidebar, AppHeader)
├── types/                      # Shared Types dùng toàn dự án
└── utils/                      # 🛠 Shared Helper Functions (date, string, validation...)

docs/
└── dependencies.md             # Registry các package đã cài
```

### Quy tắc đồng bộ hóa Module
- **Feature-First**: Tuyệt đối không viết logic nghiệp vụ (fetch data, submit form) trong `src/app/`. Mọi logic phải nằm trong `src/features/`.
- **Isolation**: Mỗi feature phải hoạt động độc lập. Feature A không được import trực tiếp từ `features/B/components`. Nếu cần dùng chung, hãy đưa lên `src/components/common/`.
- **Structure Integrity**: Giữ nguyên cấu trúc folder trong `src/components/ui/` theo TailAdmin để dễ dàng cập nhật hoặc thay thế template sau này.
- **Path Alias**: Luôn sử dụng `@/` để import (ví dụ: `@/features/brand/services/brand-api`).

---

## 2. 🏷️ Naming Convention

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | PascalCase | `AccountRow.tsx`, `AccountFormModal.tsx` |
| Page component | PascalCase | `page.tsx` (tên file cố định theo Next.js) |
| Custom Hook | `use` + PascalCase | `useAccounts.ts`, `useModal.ts` |
| Service file | kebab-case | `account-api.ts` |
| Schema file | kebab-case + `.schema` | `account.schema.ts` |
| Type/Interface | PascalCase | `Account`, `AccountFormData` |
| Variable / function | camelCase | `filteredData`, `handleSearch` |
| Constant | UPPER_SNAKE_CASE | `MAX_ITEMS_PER_PAGE` |
| Context | PascalCase + `Context` | `SidebarContext`, `ThemeContext` |
| CSS class | Tailwind utility (không đặt tên tùy ý) | — |

### Phân biệt Server vs Client Component
- Server Component: **không có directive**, tên file bình thường
- Client Component: bắt buộc có `"use client"` ở **dòng đầu tiên**

```tsx
// ✅ Client Component
"use client";
import { useState } from "react";

// ✅ Server Component (không cần directive)
export default async function AccountsPage() { ... }
```

---

## 3. ⚛️ Component Rules

### Khi nào dùng Server Component (mặc định)
- Hiển thị data tĩnh hoặc fetch từ server
- Không cần state, event handler, browser API
- Giảm JS bundle phía client

### Khi nào dùng Client Component (`"use client"`)
- Dùng `useState`, `useEffect`, `useReducer`, custom hooks có state
- Xử lý event (onClick, onChange…)
- Dùng browser API (localStorage, window…)
- Dùng Context

### Quy tắc bắt buộc
```tsx
// ❌ KHÔNG làm – đặt "use client" ở layout cấp cao
// Điều này biến toàn bộ subtree thành Client Component

// ✅ Đúng – chỉ mark "use client" ở component cần tương tác
"use client";
export function AccountFormModal() { ... }
```

- **Push `"use client"` xuống thấp nhất có thể**
- Một component chỉ làm **một việc** (Single Responsibility)
- Chia nhỏ component khi vượt **150 dòng** hoặc có nhiều concerns
- Props phải có type rõ ràng, **không dùng `any`**

```tsx
// ✅
interface AccountRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

// ❌
function AccountRow(props: any) { ... }
```

### Khi nào dùng `React.memo()`

`React.memo()` bọc component để bỏ qua re-render khi props không thay đổi. Dùng **có chọn lọc**, không áp dụng mặc định cho mọi component.

| Nên dùng `React.memo()` | Không cần |
|---|---|
| Component render tốn kém (table row lớn, chart) | Component đơn giản, render nhanh |
| Component nhận callback từ parent (kết hợp `useCallback`) | Component luôn nhận props mới |
| Component render nhiều lần không cần thiết (đo bằng Profiler) | Component ở leaf không có children |

```tsx
// ✅ Hợp lệ – AccountRow render nhiều lần trong list lớn
export const AccountRow = React.memo(function AccountRow({
  account,
  onEdit,
  onDelete,
}: AccountRowProps) {
  return <tr>...</tr>;
});

// ✅ Pair với useCallback ở parent để memo có hiệu quả
const handleEdit = useCallback((account: Account) => {
  setEditTarget(account);
}, []);

<AccountRow key={account.id} account={account} onEdit={handleEdit} />
```

> **Lưu ý**: Nếu không dùng `React.memo()`, thì `useCallback` ở parent cho handler đó **không có tác dụng** giảm re-render. Hai thứ phải đi cùng nhau.

### Quy tắc `key` prop trong list render

Đây là lỗi phổ biến gây bug khó debug — bắt buộc tuân thủ:

```tsx
// ❌ KHÔNG dùng index làm key – gây bug khi list thay đổi thứ tự
accounts.map((account, index) => <AccountRow key={index} />)

// ✅ Luôn dùng unique ID từ data
accounts.map((account) => <AccountRow key={account.id} />)
```

> **Lý do**: Dùng `index` làm key khiến React không detect được sự thay đổi thứ tự item, gây ra lỗi hiển thị và mất state cục bộ của component.

---

## 4. 🪝 Custom Hooks

- Đặt trong `features/<feature>/hooks/` hoặc `src/hooks/` nếu dùng chung
- Hook chỉ chứa **logic**, không chứa JSX
- Tên bắt đầu bằng `use`

```ts
// ✅ src/features/account/hooks/useAccounts.ts
export const useAccounts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  // ...logic...
  return { searchQuery, handleSearch, paginatedData, ... };
};
```

- Dùng `useMemo` cho dữ liệu derived (filter, sort, paginate)
- Dùng `useCallback` **chỉ khi** handler được pass vào child component đã được bọc `React.memo()` — tránh `useCallback` bừa bãi vì không có tác dụng nếu child không memo
- **Không fetch API trực tiếp trong component** – luôn qua hook

```tsx
// ❌ useCallback không có tác dụng nếu Button không được React.memo()
const handleClick = useCallback(() => doSomething(), []);
<Button onClick={handleClick} />

// ✅ useCallback có ý nghĩa khi child được memo
const MemoizedTable = React.memo(AccountTable);
const handleSort = useCallback((col: string) => setSort(col), []);
<MemoizedTable onSort={handleSort} />
```

### Return value của hook

Hook nên return object (không phải tuple) để dễ destructure có tên rõ ràng:

```ts
// ✅
return { accounts, isLoading, error, createAccount, deleteAccount };

// ❌ Tuple khó đọc khi có nhiều giá trị
return [accounts, isLoading, createAccount];
```

---

## 5. 🌐 Data Fetching Strategy

### Server-first (ưu tiên)
```tsx
// ✅ Page component – Server Component
export default async function AccountsPage() {
  const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, {
    next: { revalidate: 60 }, // ISR
  });
  const accounts = await data.json();
  return <AccountTable initialData={accounts} />;
}
```

### Pattern gọi API (Service)
Mọi module phải định nghĩa service trong `features/<feature>/services/<feature>-api.ts`.

```ts
// ✅ src/features/brand/services/brand-api.ts
import axiosClient from "@/configs/axios-client";
import { Brand, BrandFormData } from "../types/brand";

export const brandApi = {
  // Trả về Promise từ axiosClient (đã có interceptor xử lý .data)
  getAll: () => axiosClient.get<Brand[]>("/brands"),
  getById: (id: number) => axiosClient.get<Brand>(`/brands/${id}`),
  create: (data: BrandFormData) => axiosClient.post("/brands", data),
  update: (id: number, data: BrandFormData) => axiosClient.put(`/brands/${id}`, data),
  delete: (id: number) => axiosClient.delete(`/brands/${id}`),
};
```

### Pattern Custom Hook cho Feature
Để đồng bộ giữa các module, chia hook thành 2 loại: **Query** (lấy dữ liệu) và **Mutation** (thay đổi dữ liệu).

```ts
// ✅ features/brand/hooks/useBrands.ts (Query Hook)
export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await brandApi.getAll();
      setBrands(data);
    } catch (err) {
      setError("Không thể tải danh sách thương hiệu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  return { brands, isLoading, error, refetch: fetchBrands };
};
```

### Pattern Mutation Hook
```ts
// ✅ features/brand/hooks/useBrandMutations.ts (Mutation Hook)
export const useBrandMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBrand = async (data: BrandFormData) => {
    setIsSubmitting(true);
    try {
      await brandApi.create(data);
      toast.success("Thêm mới thành công");
      onSuccess?.();
    } catch (err) {
      toast.error("Thêm mới thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBrand = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa?")) return;
    try {
      await brandApi.delete(id);
      toast.success("Xóa thành công");
      onSuccess?.();
    } catch (err) {
      toast.error("Xóa thất bại");
    }
  };

  return { createBrand, deleteBrand, isSubmitting };
};
```

> **Lưu ý**: Tách biệt Query và Mutation giúp các hook đồng bộ, dễ quản lý và tránh re-render không cần thiết.

### Quy tắc Data Fetching
| Loại | Công cụ | Caching | Dùng khi |
|---|---|---|---|
| **Server Component** | `fetch()` native | Next.js Cache | Render ban đầu, SEO |
| **Client Hook (Query)** | `axiosClient` | Local State | List, Search, Filter |
| **Client Hook (Mutation)** | `axiosClient` | N/A | Create, Update, Delete |

---

## 6. 🔧 Axios Client

File: `src/configs/axios-client.ts`

> **Quyết định về Auth Token**: Dự án hiện dùng **`localStorage`** để lưu token (approach đơn giản, phù hợp với SPA admin tool). Nếu sau này nâng cấp bảo mật, chuyển sang `HttpOnly Cookie` thì xóa request interceptor bên dưới và xử lý cookie server-side. Không được dùng lẫn lộn hai cách.

```ts
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor – đính kèm token từ localStorage
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor – xử lý lỗi global theo HTTP status
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    // Dev-only logging để debug interceptor
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[axiosClient] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.status,
        error.response?.data
      );
    }

    switch (error.response?.status) {
      case 400:
        // Validation error từ server – để service layer tự xử lý chi tiết
        break;
      case 401:
        // Token hết hạn – xóa token và redirect login
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        break;
      case 403:
        toast.error("Bạn không có quyền thực hiện thao tác này");
        break;
      case 404:
        toast.error("Không tìm thấy dữ liệu");
        break;
      case 500:
        toast.error("Lỗi server. Vui lòng thử lại sau");
        break;
      default:
        if (!error.response) {
          toast.error("Mất kết nối. Vui lòng kiểm tra mạng và thử lại");
        }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
```

---

## 7. 📦 State Management

### Ưu tiên sử dụng theo thứ tự
1. **Local state (`useState`)** – đủ cho hầu hết UI state trong 1 component
2. **Derived state (`useMemo`)** – filter, sort, paginate từ dữ liệu có sẵn
3. **Custom Hook** – gom state + logic của 1 feature
4. **Context** – chỉ cho state thật sự global (theme, sidebar, auth)

```tsx
// ✅ SidebarContext – global state hợp lệ
// ✅ ThemeContext – global state hợp lệ

// ❌ KHÔNG dùng Context cho state chỉ dùng trong 1 page
```

### Tránh anti-patterns
```ts
// ❌ useEffect để sync state với state khác
useEffect(() => {
  setFiltered(data.filter(...));
}, [data, filter]);

// ✅ Dùng useMemo thay thế
const filtered = useMemo(() => data.filter(...), [data, filter]);
```

---

## 8. ⏳ Loading, Empty & Error States

Mọi feature hiển thị danh sách hoặc data từ API **bắt buộc** xử lý đủ 4 trạng thái: loading, error, empty, và có data. Không để UI bị blank hoặc crash.

### Convention đặt tên prop
```ts
// ✅ Tên prop loading thống nhất toàn dự án
isLoading: boolean    // đang fetch data lần đầu
isSubmitting: boolean // đang submit form hoặc thực hiện action
isRefetching: boolean // đang reload data ngầm (optional, khi cần UX nâng cao)
```

### Pattern chuẩn cho list component

```tsx
// ✅ AccountTable.tsx
export function AccountTable({ accounts, isLoading, error }: AccountTableProps) {
  // 1. Loading state – dùng Skeleton (ưu tiên) hoặc Spinner
  if (isLoading) return <AccountTableSkeleton />;

  // 2. Error state
  if (error) return <ErrorState message={error} />;

  // 3. Empty state – phân biệt "chưa có dữ liệu" vs "không tìm thấy kết quả"
  if (accounts.length === 0) return <EmptyState message="Chưa có tài khoản nào" />;

  // 4. Data
  return (
    <table>
      {accounts.map((account) => (
        <AccountRow key={account.id} account={account} />
      ))}
    </table>
  );
}
```

### isSubmitting trong form

Button submit phải luôn phản ánh trạng thái `isSubmitting` — không để user bấm nhiều lần:

```tsx
// ✅ Button submit chuẩn
<button
  type="submit"
  disabled={isSubmitting}
  aria-disabled={isSubmitting}
  className={twMerge(
    "px-4 py-2 bg-blue-600 text-white rounded",
    isSubmitting && "opacity-50 cursor-not-allowed"
  )}
>
  {isSubmitting ? (
    <span className="flex items-center gap-2">
      <Spinner size="sm" /> Đang lưu...
    </span>
  ) : (
    "Lưu"
  )}
</button>
```

### Skeleton vs Spinner
| Dùng Skeleton | Dùng Spinner |
|---|---|
| List, table, card (biết trước layout) | Action button (submit, delete) |
| Initial page load | Inline action trong row |
| Fetch data lần đầu | Upload file |

### Shared components
```
src/components/common/
├── Skeleton.tsx       # Base skeleton block
├── EmptyState.tsx     # "Không có dữ liệu" với icon + message
└── ErrorState.tsx     # "Có lỗi xảy ra" với nút retry
```

```tsx
// ✅ EmptyState.tsx
interface EmptyStateProps {
  message?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  message = "Không có dữ liệu",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <InboxIcon className="mb-3 h-10 w-10" />
      <p className="text-sm">{message}</p>
      {action && (
        <button onClick={action.onClick} className="mt-4 text-blue-500 text-sm underline">
          {action.label}
        </button>
      )}
    </div>
  );
}
```

---

## 9. 🔄 Optimistic Update

Dùng optimistic update **có chọn lọc** — không áp dụng cho mọi action:

| Action | Nên Optimistic? | Lý do |
|---|---|---|
| Toggle active/inactive | ✅ Có | Thao tác nhỏ, rollback dễ |
| Xóa item | ✅ Có | UX nhanh hơn rõ rệt |
| Tạo mới | ❌ Không | Cần ID từ server |
| Cập nhật form phức tạp | ❌ Không | Rollback phức tạp, dễ conflict |

### Pattern chuẩn

```ts
// ✅ Optimistic delete trong hook
const deleteAccount = async (id: number) => {
  // 1. Lưu state cũ để rollback
  const previousAccounts = accounts;

  // 2. Update UI ngay lập tức
  setAccounts((prev) => prev.filter((a) => a.id !== id));

  try {
    await accountApi.delete(id);
    toast.success("Xóa tài khoản thành công");
  } catch (error) {
    // 3. Rollback nếu API thất bại
    setAccounts(previousAccounts);
    toast.error(error instanceof Error ? error.message : "Xóa thất bại");
  }
};
```

---

## 10. 🎨 Styling (TailwindCSS 4 & TailAdmin)

- Dự án sử dụng **TailwindCSS 4** với cấu hình tập trung trong `src/app/globals.css` (thay vì `tailwind.config.js`).
- **Hệ màu chuẩn (Theme Colors)**: Ưu tiên sử dụng các biến màu đã định nghĩa trong `@theme`:
    - `brand`: `--color-brand-500` (#ff6a00) - Màu chủ đạo.
    - `gray`: Hệ màu xám từ `50` đến `950`.
    - `success`, `error`, `warning`: Dùng cho thông báo và trạng thái.
- **Utility chuẩn của Template**: Sử dụng các utility class có sẵn trong `globals.css` cho menu và layout:
    - `menu-item`, `menu-item-active`, `menu-item-inactive`.
    - `custom-scrollbar`, `no-scrollbar`.
- **Merge Class**: Luôn sử dụng `twMerge` (từ `tailwind-merge`) khi nối class có điều kiện để tránh xung đột.
- **Dark mode**: Sử dụng prefix `dark:` (ThemeContext sẽ tự động toggle class `.dark` trên thẻ `<html>`).
- **Typography**: Sử dụng font **Outfit** (đã cấu hình mặc định).

```tsx
// ✅ Cách dùng twMerge chuẩn
import { twMerge } from "tailwind-merge";

const Button = ({ className, isActive }) => (
  <button className={twMerge(
    "px-4 py-2 rounded-lg transition-all",
    isActive ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700",
    className
  )}>
    Click me
  </button>
);
```

---

## 11. 🔒 TypeScript Rules

- **`strict: true`** bật sẵn – không tắt
- **Không dùng `any`** – dùng `unknown` nếu chưa rõ type
- Interface cho object shape, type alias cho union/primitive
- Đặt types trong `features/<feature>/types/` hoặc `src/types/` nếu share
- **Ưu tiên dùng `z.infer<typeof Schema>`** thay vì viết interface trùng lặp với Zod schema

```ts
// ✅ Rõ ràng
interface Account {
  id: number;
  user: { image: string; name: string; email: string };
  role: string;
  status: string;
  joinDate: string;
}

// ✅ Infer từ Zod schema (ưu tiên cho form data)
export type AccountFormData = z.infer<typeof AccountFormSchema>;

// ❌
const account: any = {};
```

---

## 12. 🚀 Performance Best Practices

- **Hạn chế `"use client"`** – giảm JS bundle
- Dùng `dynamic()` cho component nặng (charts, calendar, map)

```tsx
import dynamic from "next/dynamic";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
```

- Dùng `next/image` cho tất cả `<img>` tag
- Dùng `next/font/google` cho font (đã có Outfit)
- Tránh re-render không cần: `useMemo` cho expensive computation, `useCallback` **chỉ khi** child được `React.memo()`
- **Không tạo object/function mới trong JSX** trừ khi cần

```tsx
// ❌ Tạo mới mỗi render – gây re-render child nếu child dùng React.memo
<Button onClick={() => handleDelete(id)} />

// ✅ Với child được memo
const handleDeleteClick = useCallback(() => handleDelete(id), [id, handleDelete]);
<MemoizedButton onClick={handleDeleteClick} />
```

---

## 13. 🌍 Environment Variables

| Prefix | Accessible ở | Dùng cho |
|--------|-------------|---------|
| `NEXT_PUBLIC_` | Client + Server | API URL, App name |
| Không prefix | Server only | Secret keys, DB URL |

### File cần có
```
.env.local          # Development (git-ignored)
.env.production     # Production (git-ignored, set trực tiếp trên host)
.env.example        # Template (commit lên Git)
```

### Ví dụ `.env.example`
```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=Children's Toy Admin
```

> ⚠️ **KHÔNG bao giờ commit `.env.local` hay `.env.production` lên Git**

---

## 14. 🏗️ Build & next.config.ts

File hiện tại đã cấu hình SVG support qua `@svgr/webpack`. Các rule bổ sung:

```ts
const nextConfig: NextConfig = {
  // SVG as React component (đã có)
  webpack(config) { ... },

  // Tối ưu production
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.example.com" },
    ],
  },

  // Bật compression
  compress: true,

  // Không expose source map production
  productionBrowserSourceMaps: false,
};
```

---

## 15. 🚢 Deployment

### Vercel (Recommended)
1. Push code lên GitHub
2. Connect repo trên vercel.com
3. Set environment variables trong Vercel Dashboard
4. Deploy tự động khi push vào `main`

### Docker (VPS/Self-hosted)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> Cần thêm `output: "standalone"` vào `next.config.ts` khi deploy Docker.

### Checklist trước khi deploy
- [ ] `npm run build` chạy không lỗi
- [ ] `npm run lint` pass không warning
- [ ] Tất cả `NEXT_PUBLIC_` env đã set đúng trên host
- [ ] Không còn `console.log` debug trong production code
- [ ] `next/image` dùng đúng (có `width`, `height` hoặc `fill`)
- [ ] Không có hardcoded URL (thay bằng env var)

---

## 16. 🔀 Git Workflow

### Branch naming
```
main                  # Production-ready code
develop               # Integration branch
feature/<name>        # Tính năng mới       → feature/account-management
fix/<name>            # Bug fix             → fix/login-redirect
chore/<name>          # Config, deps        → chore/update-tailwind
refactor/<name>       # Refactor code       → refactor/account-hook
```

### Commit message (Conventional Commits)
```
feat: add account filter by role and status
fix: resolve pagination reset on filter change
refactor: extract account logic to useAccounts hook
chore: update eslint config
docs: update CODING_RULES with deployment guide
```

### Pull Request Rules
- Mô tả rõ: **what**, **why**, **how to test**
- Phải có ít nhất 1 reviewer approve trước khi merge
- **Không merge nếu lint fail**
- Squash merge vào `develop`, merge commit vào `main`

---

## 17. ❌ Anti-patterns (PHẢI TRÁNH)

| Anti-pattern | Tại sao xấu | Cách đúng |
|---|---|---|
| `"use client"` ở layout cấp cao | Biến toàn bộ subtree thành client | Chỉ mark ở component cần tương tác |
| `import axios from "axios"` trực tiếp | Bỏ qua interceptor | Luôn dùng `axiosClient` từ `@/configs` |
| Fetch API trong component | Khó test, coupling cao | Tách vào `services/feature-api.ts` |
| `useEffect` để derive state | Gây extra render | Dùng `useMemo` |
| `any` type | Mất type safety | `unknown` hoặc define interface |
| Hardcode URL/API key | Không thể deploy linh hoạt | Dùng env var |
| Prop drilling > 2 cấp | Khó maintain | Dùng Context hoặc gom vào hook |
| Component > 200 dòng | Khó đọc, khó test | Chia nhỏ theo responsibility |
| `console.log` trong production code | Lộ thông tin | Xóa trước merge, dùng logger |
| `catch {}` rỗng hoặc chỉ `console.log` | Lỗi im lặng, UX không phản hồi | Toast error + log có điều kiện |
| Validate bằng `if/else` thủ công | Dễ sót, khó maintain | Dùng Zod schema |
| Viết `interface` trùng với Zod schema | Drift giữa runtime và type | `z.infer<typeof Schema>` |
| Thêm package không ghi `/docs/dependencies.md` | Không ai biết tại sao có | Bắt buộc ghi trước khi merge |
| `toast.error("Có lỗi xảy ra")` cho mọi case | Không giúp user hiểu vấn đề | Message cụ thể theo từng HTTP status |
| `key={index}` trong list render | Gây bug khi list thay đổi thứ tự | `key={item.id}` dùng unique ID |
| `useCallback` bừa bãi không có `React.memo` | Tốn memory, không giảm re-render | Chỉ dùng khi child được `React.memo()` |
| `React.memo()` trên mọi component | Overhead không cần thiết | Chỉ memo component thật sự có vấn đề re-render |
| Không xử lý empty state | UI bị blank, UX kém | Luôn render `<EmptyState />` khi list rỗng |
| Không cleanup `useEffect` fetch | setState sau unmount gây warning | Dùng biến `cancelled` hoặc `AbortController` |
| Lưu token bằng cả localStorage lẫn cookie | Xung đột, không nhất quán | Chọn 1 cách và ghi rõ trong Section 6 |
| Mutation logic trong component | Khó test, logic bị lặp | Tách vào `useFeatureMutations` hook |
| Import chéo giữa các feature | Coupling cao, khó refactor | Shared logic vào `src/hooks/` hoặc `src/components/` |
| Button submit không có `disabled={isSubmitting}` | User bấm nhiều lần, duplicate request | Luôn disable + hiện loading state khi submitting |

---

## 18. 🔍 Code Style

### ESLint + Prettier
- Cấu hình: `eslint.config.mjs` + `prettier.config.js`
- Chạy: `npm run lint`
- **Không merge PR nếu lint fail**

### Quy tắc chung
- Hàm/component không quá **50 dòng** nếu có thể
- Không nested quá **3 cấp** (if/loop)
- Comment khi logic phức tạp – **không comment điều hiển nhiên**
- Export named thay vì default khi có thể (dễ refactor)

```tsx
// ✅ Named export cho components trong features
export function AccountRow({ account, onEdit }: AccountRowProps) { ... }

// Default export chỉ cho page.tsx và layout.tsx (yêu cầu của Next.js)
export default function AccountsPage() { ... }
```

---

## 19. 🔐 Security

### Lưu trữ Auth Token
Dự án dùng **`localStorage`** để lưu `access_token` — đây là lựa chọn có chủ đích cho admin tool internal. Không được dùng lẫn lộn với cookie.

Nếu nâng cấp lên `HttpOnly Cookie` trong tương lai:
- Xóa request interceptor trong `axios-client.ts`
- Dùng `next/headers` để đọc cookie trong Server Component
- Cập nhật section này và Section 6

### Các quy tắc bắt buộc
- Validate input phía client (UX) **và** phía server (security) — không bỏ qua bên nào
- Không render HTML từ user input trực tiếp (XSS)
- Env var chứa secret: **không prefix `NEXT_PUBLIC_`**
- Khi logout: xóa token khỏi `localStorage` + invalidate token phía server nếu có

---

## 20. ⚙️ CI/CD (GitHub Actions – Khuyến nghị)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
```

- **Lint fail → block merge tự động**
- Deploy production chỉ từ `main` branch
- Secrets quản lý qua GitHub Repository Secrets

---

## 21. ✅ Validation

### Nguyên tắc
- **Validate ở 2 tầng**: client-side (UX feedback nhanh) + trước khi gọi API (bảo vệ)
- Dùng **Zod** làm schema validation library thống nhất
- Schema đặt trong `features/<feature>/types/` để tái dùng cả ở form lẫn API layer

### Cài đặt
```bash
npm install zod @hookform/resolvers react-hook-form
```
> Ghi vào `/docs/dependencies.md` sau khi cài (xem Section 23)

### Định nghĩa schema
```ts
// features/account/types/account.schema.ts
import { z } from "zod";

export const AccountFormSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(100),
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["admin", "staff", "viewer"], {
    errorMap: () => ({ message: "Role không hợp lệ" }),
  }),
  status: z.enum(["active", "inactive"]),
});

// Infer TypeScript type từ schema – không viết type riêng
export type AccountFormData = z.infer<typeof AccountFormSchema>;

// Dùng cho PATCH request
export type AccountUpdateData = Partial<AccountFormData>;
// Hoặc: AccountFormSchema.partial() nếu cần validate partial
```

### Dùng với React Hook Form
```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountFormSchema, type AccountFormData } from "../types/account.schema";

export function AccountFormModal() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AccountFormData>({
    resolver: zodResolver(AccountFormSchema),
  });

  const onSubmit = async (data: AccountFormData) => {
    // data đã được validate – gọi API
    await createAccount(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && (
        <p className="text-red-500 text-sm">{errors.email.message}</p>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
```

### Xử lý server validation errors (400) map về form

Khi server trả về lỗi validation cho từng field (HTTP 400), phải map lại vào form thay vì chỉ toast chung chung:

```ts
// Kiểu dữ liệu lỗi server trả về
type ServerValidationError = {
  errors: Record<string, string[]>; // { "email": ["Email đã tồn tại"], "name": ["..."] }
};
```

```tsx
// ✅ Trong onSubmit – map server errors về từng field
const onSubmit = async (data: AccountFormData) => {
  try {
    await accountApi.create(data);
    toast.success("Tạo tài khoản thành công");
    reset();
  } catch (error) {
    const axiosError = error as AxiosError<ServerValidationError>;

    // Nếu server trả về lỗi từng field – map vào form
    if (axiosError.response?.status === 400 && axiosError.response.data?.errors) {
      const serverErrors = axiosError.response.data.errors;
      Object.entries(serverErrors).forEach(([field, messages]) => {
        setError(field as keyof AccountFormData, {
          type: "server",
          message: messages[0], // lấy message đầu tiên
        });
      });
      return; // không toast – lỗi hiển thị ngay dưới field
    }

    // Lỗi không phải validation – toast chung
    toast.error(error instanceof Error ? error.message : "Tạo tài khoản thất bại");
  }
};
```

> **Lưu ý**: `setError` từ `react-hook-form` dùng để inject lỗi từ server vào đúng field, giúp user biết field nào sai mà không cần đọc toast.

### Validate trước khi gọi API (service layer)
```ts
// features/account/services/account-api.ts
import { AccountFormSchema } from "../types/account.schema";

export const accountApi = {
  create: (data: unknown) => {
    const validated = AccountFormSchema.parse(data); // throw nếu invalid
    return axiosClient.post("/accounts", validated);
  },
};
```

### Quy tắc

| | Rule |
|---|---|
| Schema location | `features/<feature>/types/<feature>.schema.ts` |
| Type inference | `z.infer<typeof Schema>` – không viết `interface` trùng |
| Error messages | Luôn viết bằng tiếng Việt, rõ ngữ nghĩa |
| Partial update | Dùng `Schema.partial()` cho PATCH request |
| Server validation errors (400) | Map về form fields bằng `setError`, không toast chung |
| Server response | Validate với Zod trước khi dùng (optional nhưng khuyến nghị) |

---

## 22. 🚨 Error Handling

### Nguyên tắc
- **Không để lỗi im lặng**: mọi `catch` phải có hành động rõ ràng
- **Phân tầng xử lý**: service → hook → component
- Dùng **toast notification** cho lỗi người dùng thấy được
- Dùng **Error Boundary** cho lỗi render không mong muốn

### Pattern chuẩn trong service
```ts
// features/account/services/account-api.ts
import { AxiosError } from "axios";

export type ApiError = {
  message: string;
  code?: string;
  errors?: Record<string, string[]>; // validation errors từ server
};

export const accountApi = {
  create: async (data: AccountFormData): Promise<Account> => {
    try {
      return await axiosClient.post<Account>("/accounts", data);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message ?? "Tạo tài khoản thất bại"
      );
    }
  },
};
```

### Pattern chuẩn trong hook
```ts
// features/account/hooks/useAccounts.ts
import { useState } from "react";
import toast from "react-hot-toast";

export const useAccounts = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createAccount = async (data: AccountFormData) => {
    setIsLoading(true);
    try {
      await accountApi.create(data);
      toast.success("Tạo tài khoản thành công");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.error(message);
      if (process.env.NODE_ENV === "development") {
        console.error("[useAccounts.createAccount]", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { createAccount, isLoading };
};
```

### Error Boundary cho render errors
```tsx
// components/common/ErrorBoundary.tsx
"use client";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Gửi lên logging service (Sentry, etc.) ở đây
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <p>Có lỗi xảy ra. Vui lòng tải lại trang.</p>
        )
      );
    }
    return this.props.children;
  }
}
```

```tsx
// Bọc các section quan trọng
<ErrorBoundary fallback={<ErrorState />}>
  <AccountTable />
</ErrorBoundary>
```

### HTTP Status Handling
Xem Section 6 – Axios Client cho cách xử lý từng status code trong response interceptor.

### Quy tắc bắt buộc
```ts
// ❌ KHÔNG – catch rỗng hoàn toàn
try {
  await accountApi.create(data);
} catch {}

// ❌ KHÔNG – chỉ console.log không có UX feedback
try {
  await accountApi.create(data);
} catch (e) {
  console.log(e);
}

// ✅ Đúng – có UX feedback + logging có điều kiện
try {
  await accountApi.create(data);
  toast.success("...");
} catch (error) {
  toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
  if (process.env.NODE_ENV === "development") {
    console.error("[context]", error);
  }
}
```

### Bảng xử lý theo loại lỗi

| Loại lỗi | Xử lý |
|---|---|
| Validation (client) | React Hook Form inline error |
| Validation (server 400) | Parse `response.data.errors`, map vào form fields bằng `setError` |
| Auth lỗi (401) | Redirect `/login` tự động + xóa token |
| Permission (403) | Toast error, không crash UI |
| Not found (404) | Toast hoặc empty state |
| Server error (5xx) | Toast chung, log chi tiết |
| Network offline | Toast "Mất kết nối. Vui lòng kiểm tra mạng và thử lại" |
| Render crash | Error Boundary fallback UI |

---

## 23. ♿ Accessibility (a11y) – Baseline

Dù là admin tool internal, vẫn cần đáp ứng baseline a11y để tránh lỗi thao tác và hỗ trợ keyboard navigation.

### Quy tắc bắt buộc

```tsx
// ✅ Icon button phải có aria-label
<button aria-label="Xóa tài khoản" onClick={handleDelete}>
  <TrashIcon />
</button>

// ❌ Icon button không có aria-label
<button onClick={handleDelete}>
  <TrashIcon />
</button>
```

```tsx
// ✅ Input phải liên kết với label
<label htmlFor="email">Email</label>
<input id="email" {...register("email")} />

// ❌ Placeholder thay thế label
<input placeholder="Nhập email" />
```

```tsx
// ✅ Dialog/Modal phải có role và aria-label
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Tạo tài khoản</h2>
  ...
</div>
```

```tsx
// ✅ Disabled state phải có aria-disabled
<button disabled={isSubmitting} aria-disabled={isSubmitting}>
  Lưu
</button>
```

```tsx
// ✅ Loading state phải thông báo cho screen reader
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <AccountTable />}
</div>
```

### Checklist a11y tối thiểu
- [ ] Mọi icon button có `aria-label`
- [ ] Mọi input có `<label>` liên kết bằng `htmlFor`/`id`
- [ ] Modal có `role="dialog"` và `aria-labelledby`
- [ ] Không dùng `<div>` hay `<span>` làm button — dùng `<button>` thật
- [ ] Màu text đủ contrast với background (tối thiểu 4.5:1 theo WCAG AA)
- [ ] Keyboard navigation hoạt động (Tab, Enter, Escape cho modal)

---

## 24. 📚 Dependency Registry

### Quy tắc bắt buộc
> Mọi thư viện thêm vào dự án **phải được ghi vào `/docs/dependencies.md`** trước khi merge PR.

Mục đích: tránh dependency trùng lặp, giúp team hiểu tại sao mỗi package tồn tại, dễ audit và cleanup.

### Format file `/docs/dependencies.md`

```markdown
# 📦 Dependency Registry

> Cập nhật file này mỗi khi thêm hoặc xóa dependency.
> Format: package name | mục đích | người thêm | ngày thêm

---

## Runtime Dependencies

| Package | Version | Mục đích | Dùng ở đâu | Người thêm | Ngày thêm |
|---------|---------|----------|------------|------------|-----------|
| axios | ^1.6.0 | HTTP client, thay thế fetch với interceptor | `src/configs/axios-client.ts` | @quang | 2024-01-10 |
| zod | ^3.22.0 | Schema validation cho form và API data | `features/*/types/*.schema.ts` | @quang | 2024-02-01 |
| react-hook-form | ^7.49.0 | Form state management, tích hợp với Zod | Components dùng form | @quang | 2024-02-01 |
| @hookform/resolvers | ^3.3.0 | Bridge giữa react-hook-form và Zod | Form components | @quang | 2024-02-01 |
| react-hot-toast | ^2.4.1 | Toast notification nhẹ, không cần setup | `src/hooks/useToast.ts` | @quang | 2024-02-15 |
| tailwind-merge | ^2.2.0 | Merge Tailwind class tránh conflict | Tất cả components | @quang | 2024-01-10 |

## Dev Dependencies

| Package | Version | Mục đích | Người thêm | Ngày thêm |
|---------|---------|----------|------------|-----------|
| @types/node | ^20.0.0 | TypeScript types cho Node.js APIs | @quang | 2024-01-10 |

## Deprecated / Đã xóa

| Package | Lý do xóa | Ngày xóa |
|---------|-----------|----------|
| moment | Bundle quá lớn (67kb), thay bằng date-fns | 2024-03-01 |

---

## Quy tắc khi thêm dependency mới

1. Kiểm tra xem chức năng đó đã có package nào trong bảng trên đảm nhận chưa
2. So sánh bundle size trên bundlephobia.com
3. Kiểm tra last publish date và số weekly downloads
4. Thêm vào bảng này **trước khi** tạo PR
5. Nếu thay thế package cũ → ghi vào mục "Deprecated"
```

### Checklist khi thêm thư viện mới
- [ ] Chức năng chưa có package nào trong registry đảm nhận
- [ ] Bundle size chấp nhận được (kiểm tra bundlephobia.com)
- [ ] Package được maintain tích cực (< 6 tháng từ last publish)
- [ ] Đã thêm vào `/docs/dependencies.md` với đầy đủ thông tin
- [ ] Đã cập nhật đúng `dependencies` vs `devDependencies` trong `package.json`

---

## ✅ Quick Reference Checklist

**Trước khi tạo component mới:**
- [ ] Cần Server hay Client Component?
- [ ] Thuộc feature nào? → tạo trong `features/<feature>/components/`
- [ ] Logic state → tách vào hook
- [ ] API call → tách vào service
- [ ] Có xử lý đủ 4 trạng thái: loading, error, empty, data không?

**Trước khi tạo custom hook mới:**
- [ ] Hook chỉ chứa logic, không chứa JSX?
- [ ] Đặt đúng chỗ: `features/<feature>/hooks/` hoặc `src/hooks/` nếu share?
- [ ] Return object (không phải tuple) với tên rõ ràng?
- [ ] Nếu hook quá dài (>80 dòng): tách thành query hook và mutation hook riêng?
- [ ] Mọi `useEffect` fetch có cleanup function?

**Trước khi render list:**
- [ ] Dùng `key={item.id}` (unique ID từ data), không dùng `key={index}`
- [ ] Có `<EmptyState />` khi list rỗng không?
- [ ] Có `<Skeleton />` hoặc spinner khi loading không?

**Trước khi submit form / gọi API:**
- [ ] Có Zod schema validate dữ liệu đầu vào chưa?
- [ ] Error message viết bằng tiếng Việt, rõ ràng chưa?
- [ ] Xử lý server 400 errors bằng `setError` map về đúng field chưa?
- [ ] Hook có `try/catch` với toast feedback chưa?
- [ ] Không để `catch {}` rỗng?
- [ ] Button submit có `disabled={isSubmitting}` và hiện loading state không?

**Trước khi dùng `useCallback` / `useMemo` / `React.memo`:**
- [ ] `useCallback`: child component có được `React.memo()` không? Nếu không thì bỏ qua.
- [ ] `useMemo`: computation có thật sự expensive không?
- [ ] `React.memo()`: component có thật sự re-render không cần thiết không? (dùng React Profiler kiểm tra trước)

**Trước khi thêm thư viện mới:**
- [ ] Đã kiểm tra `/docs/dependencies.md` – chưa có package tương tự?
- [ ] Đã check bundle size trên bundlephobia.com?
- [ ] Đã thêm record vào `/docs/dependencies.md`?

**Trước khi merge PR:**
- [ ] `npm run lint` không lỗi
- [ ] Không có `any` type
- [ ] Không có hardcoded URL
- [ ] Không có `console.log` (trừ wrapped trong `NODE_ENV === "development"`)
- [ ] Component có type rõ ràng cho props
- [ ] Mọi form có Zod schema
- [ ] Mọi async call có error handling
- [ ] Mọi `useEffect` fetch có cleanup function
- [ ] Không có `key={index}` trong list render
- [ ] Icon button có `aria-label`
- [ ] Input có `<label>` liên kết