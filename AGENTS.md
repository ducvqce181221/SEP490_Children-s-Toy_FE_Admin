# 🤖 AGENTS – Project Instructions
# (Used by: OpenAI Codex, ChatGPT, and other OpenAI-powered agents)

> **MANDATORY**: Read `CODING_RULES.md` in full before making ANY code change.
> File location: `./CODING_RULES.md`

---

## Project Overview

- **Name**: SEP490 – Children's Toy Admin FE
- **Stack**: Next.js 16, React 19, TypeScript 5, TailwindCSS 4, Axios, App Router
- **Architecture**: Feature-based modules under `src/features/`
- **Language**: Code in TypeScript/TSX; UI text and comments in Vietnamese

---

## Required Reading Order

When starting ANY task in this project:

1. **`CODING_RULES.md`** — Full project coding standards (24 sections)
2. **`/docs/dependencies.md`** — Registered packages (check before adding new ones)
3. Relevant feature files in `src/features/<feature>/`

---

## Folder Structure (from CODING_RULES.md Section 1)

```
src/
├── app/              # Next.js App Router pages
├── features/         # Feature modules (primary location for new code)
│   └── <feature>/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/    # TypeScript types + Zod schemas
├── components/       # Shared reusable components
├── configs/          # axios-client.ts (ONLY axios instance to use)
├── context/          # React Context (global: theme, sidebar, auth)
├── hooks/            # Shared custom hooks
└── types/            # Shared TypeScript types
```

---

## Strict Rules

### 1. TypeScript
- `strict: true` — no `any` type allowed
- Use `z.infer<typeof Schema>` to derive types from Zod schemas
- All props must be typed

### 2. Components
- Server Component by default
- Add `"use client"` only when needed (state, events, browser APIs)
- Never add `"use client"` to layout files unless entire subtree needs it

### 3. Axios
```ts
// ❌ FORBIDDEN
import axios from "axios";
axios.get("/accounts");

// ✅ REQUIRED
import axiosClient from "@/configs/axios-client";
axiosClient.get("/accounts");
```

### 4. API Calls
- Always in `src/features/<feature>/services/<feature>-api.ts`
- Never call API directly from component or hook without going through service

### 5. Hooks
- Return an object `{}`, not a tuple `[]`
- Query hook (`useFeature`) separate from mutation hook (`useFeatureMutations`)
- Every `useEffect` with fetch must have cleanup

### 6. Error Handling
- No empty `catch {}` blocks
- Toast user-visible errors in Vietnamese
- Map HTTP 400 validation errors to form fields via `setError`

### 7. Forms
- Zod schema required for all forms
- Use React Hook Form + `zodResolver`
- Submit button must be `disabled={isSubmitting}` with visual loading indicator

### 8. Performance
- `useCallback` only when child uses `React.memo()`
- `useMemo` for computed/derived values (filter, sort, paginate)
- `dynamic()` for heavy client components

### 9. Lists
- Always `key={item.id}` — never `key={index}`
- Always render: loading state + error state + empty state + data

### 10. New Dependencies
- Check `/docs/dependencies.md` first
- Must update `/docs/dependencies.md` before merging

---

## Before Submitting Code

Verify:
- [ ] `npm run lint` passes (no ESLint errors)
- [ ] No `any` types
- [ ] No `console.log` outside `NODE_ENV === "development"` guard
- [ ] No hardcoded API URLs
- [ ] All async operations have try/catch with user feedback
- [ ] Forms use Zod + React Hook Form
- [ ] Lists handle all 4 states: loading, error, empty, data
- [ ] `key={item.id}` in all list renders
- [ ] Icon buttons have `aria-label`
- [ ] Inputs have associated `<label>`
