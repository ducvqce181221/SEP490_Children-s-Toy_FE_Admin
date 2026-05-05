# 🤖 GEMINI / ANTIGRAVITY – Project Instructions

> **MANDATORY**: Read `CODING_RULES.md` in full before making ANY code change.
> File location: `./CODING_RULES.md`

---

## Project Context

- **Project**: SEP490 – Children's Toy Admin FE
- **Stack**: Next.js 16 · React 19 · TypeScript 5 · TailwindCSS 4 · Axios · App Router
- **Monorepo**: No – single FE admin app
- **Language**: Code in TypeScript/TSX; comments and UI text in Vietnamese

---

## Mandatory Workflow

Before writing or modifying any code:

1. **Read `CODING_RULES.md`** – every section applies
2. **Identify the feature** – does it belong to an existing `src/features/<feature>/` module?
3. **Check the folder structure** (Section 1 of CODING_RULES.md) before creating new files
4. **Check `/docs/dependencies.md`** before suggesting or installing any new package

---

## Critical Rules (Summary)

These are non-negotiable. Full details are in `CODING_RULES.md`.

### Files & Structure
- New feature code → `src/features/<feature>/` (components, hooks, services, types)
- Shared UI → `src/components/`; shared hooks → `src/hooks/`
- Shared utils → `src/utils/`
- No cross-feature imports

### TypeScript
- `strict: true` – never use `any`; use `unknown` if type is unclear
- Infer types from Zod schemas: `z.infer<typeof Schema>` – do not duplicate interfaces
- All props must be typed with explicit interfaces

### Components
- Default to Server Component; add `"use client"` only when necessary (state, events, browser APIs)
- Push `"use client"` as deep as possible – never at layout level
- No component over 150 lines without splitting

### Hooks
- Hooks return an object `{}`, never a tuple
- Fetch hooks: always include loading + error state + cleanup (`cancelled` flag or `AbortController`)
- Separate query hooks (`useFeature`) from mutation hooks (`useFeatureMutations`)

### Data Fetching
- Server Component: use `fetch()` with `next: { revalidate }`
- Client Component: use `axiosClient` from `src/configs/axios-client.ts` — never raw `axios`
- All API calls go through `features/<feature>/services/feature-api.ts`

### State
- `useMemo` for derived state (filter, sort, paginate)
- `useCallback` ONLY when the child component is wrapped in `React.memo()`
- Context only for truly global state (theme, sidebar, auth)

### Error Handling
- Never leave `catch {}` empty
- Toast errors with specific Vietnamese messages per HTTP status
- Map server 400 validation errors to form fields using `setError`
- Wrap sections with `<ErrorBoundary>` for render crash protection

### Forms & Validation
- Zod schema in `features/<feature>/types/<feature>.schema.ts`
- React Hook Form + `zodResolver`
- Button submit must have `disabled={isSubmitting}` and show loading state

### Styling
- TailwindCSS 4 utility classes; use `tailwind-merge` for conditional classes
- No inline styles for values that have a Tailwind equivalent

### Git
- Branch: `feature/`, `fix/`, `chore/`, `refactor/`
- Commit: Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.)
- No `console.log` in production code (allowed only inside `NODE_ENV === "development"` guards)

---

## What NOT to Do

- Do NOT suggest adding libraries not in `/docs/dependencies.md` without flagging it
- Do NOT use `any` type
- Do NOT hardcode API URLs — use `process.env.NEXT_PUBLIC_API_URL`
- Do NOT add `"use client"` to page.tsx or layout.tsx
- Do NOT write duplicate TypeScript interfaces that mirror Zod schemas
- Do NOT leave async operations without try/catch
- Do NOT use `key={index}` in list rendering
- Do NOT import `axios` directly — always use `@/configs/axios-client`

---

## Before Suggesting Code

Confirm:
- [ ] Does this follow the folder structure in CODING_RULES.md Section 1?
- [ ] Is Server vs Client Component used correctly (Section 3)?
- [ ] Does the hook follow the pattern in Section 4–5?
- [ ] Are all 4 UI states handled: loading, error, empty, data (Section 8)?
- [ ] Is there proper error handling (Section 22)?
- [ ] Is accessibility baseline met (Section 23)?
