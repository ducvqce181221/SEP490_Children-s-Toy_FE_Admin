# GitHub Copilot Instructions
# SEP490 – Children's Toy Admin FE

## ⚠️ MANDATORY: Read CODING_RULES.md First

Before generating or suggesting any code, read the file `CODING_RULES.md`
at the project root. It contains the authoritative rules for this project
(24 sections). These rules override general best practices.

---

## Project Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (`strict: true`)
- **Styling**: TailwindCSS 4 + `tailwind-merge`
- **HTTP**: Axios via `@/configs/axios-client` (NEVER import `axios` directly)
- **Forms**: React Hook Form + Zod + `@hookform/resolvers`
- **UI text & comments**: Vietnamese

---

## Folder Rules (Section 1 of CODING_RULES.md)

New feature code → `src/features/<feature>/{components,hooks,services,types}/`
Shared UI → `src/components/`
Shared hooks → `src/hooks/`
API config → `src/configs/axios-client.ts`
Context → `src/context/` (only: theme, sidebar, auth)

---

## Key Rules

### Components
- Default: Server Component (no directive)
- Add `"use client"` only for: state, events, browser APIs
- Never mark `layout.tsx` or `page.tsx` as `"use client"` unnecessarily

### TypeScript
- No `any` — use `unknown` for unknown types
- Derive types from Zod: `type Foo = z.infer<typeof FooSchema>`

### Axios
```ts
// ❌ NEVER
import axios from "axios";

// ✅ ALWAYS
import axiosClient from "@/configs/axios-client";
```

### Hooks
- Return object `{}`, not tuple `[]`
- Include `isLoading`, `error` state
- Cleanup in `useEffect` fetch: `let cancelled = false; return () => { cancelled = true; }`
- Query hook (`useFeature`) separate from mutation hook (`useFeatureMutations`)

### useCallback + React.memo
- `useCallback` is only useful when child is wrapped in `React.memo()`
- Without `React.memo()` on child, skip `useCallback`

### Lists
- `key={item.id}` always — `key={index}` is forbidden

### UI States
Every data component must handle all 4 states:
1. Loading → Skeleton or Spinner
2. Error → `<ErrorState />`
3. Empty → `<EmptyState />`
4. Data → render content

### Forms
- Zod schema in `features/<feature>/types/<feature>.schema.ts`
- React Hook Form + zodResolver
- Submit button: `disabled={isSubmitting}` + visual loading state

### Error Handling
```ts
// ❌ FORBIDDEN
catch {}
catch (e) { console.log(e); }

// ✅ REQUIRED
catch (error) {
  toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
  if (process.env.NODE_ENV === "development") console.error("[ctx]", error);
}
```

### New Dependencies
Always check `/docs/dependencies.md` before suggesting a new package.
Must update `/docs/dependencies.md` after adding any package.

---

## Forbidden Patterns

| Pattern | Why | Fix |
|---|---|---|
| `import axios from "axios"` | Bypasses interceptors | Use `@/configs/axios-client` |
| `any` type | Loses type safety | Use `unknown` or proper type |
| `catch {}` empty | Silent failures | Toast + conditional log |
| `key={index}` | Bugs on reorder | `key={item.id}` |
| Hardcoded URLs | Not portable | `process.env.NEXT_PUBLIC_API_URL` |
| `console.log` in prod | Info leaks | Wrap in `NODE_ENV === "development"` |
| Duplicate interface + Zod schema | Type drift | `z.infer<typeof Schema>` |
| No disabled on submit button | Duplicate requests | `disabled={isSubmitting}` |
