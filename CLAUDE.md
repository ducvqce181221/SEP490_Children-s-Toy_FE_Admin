# 🤖 CLAUDE – Project Instructions

> **MANDATORY**: Read `CODING_RULES.md` in full before making ANY code change.
> File location: `./CODING_RULES.md`

---

## Project Context

- **Project**: SEP490 – Children's Toy Admin FE
- **Stack**: Next.js 16 · React 19 · TypeScript 5 · TailwindCSS 4 · Axios · App Router
- **Monorepo**: No – single FE admin app
- **Language**: Code in TypeScript/TSX; comments and UI text in Vietnamese

---

## Mandatory First Steps

1. **Read `CODING_RULES.md`** completely before any implementation
2. Identify which feature the task belongs to: `src/features/<feature>/`
3. Check `/docs/dependencies.md` before proposing any new package
4. Ask for clarification if requirements conflict with rules in `CODING_RULES.md`

---

## Critical Rules (Summary)

Full details are in `CODING_RULES.md`. These summaries are for quick reference only.

### Architecture
| Decision | Rule |
|---|---|
| New feature code | `src/features/<feature>/{components,hooks,services,types}/` |
| Shared UI | `src/components/` |
| Shared hooks | `src/hooks/` |
| Global state | `src/context/` — only for theme, sidebar, auth |
| Path alias | `@/` maps to `src/` |

### Component Rules
- **Default: Server Component** (no directive needed)
- **Client Component**: add `"use client"` at line 1, only when using state/events/browser APIs
- Never add `"use client"` to `layout.tsx` or `page.tsx` unless the entire page needs it
- Max ~150 lines per component before splitting

### TypeScript
- `strict: true` is enabled — never disable, never use `any`
- Use `z.infer<typeof Schema>` instead of writing duplicate interfaces
- All component props must have explicit TypeScript interface

### Hooks
```ts
// ✅ Return object, not tuple
return { data, isLoading, error, create, update, delete };

// ✅ Always include cleanup in useEffect fetch
useEffect(() => {
  let cancelled = false;
  fetchData().then(d => { if (!cancelled) setData(d); });
  return () => { cancelled = true; };
}, []);
```

### Error Handling
- Never empty `catch {}` — always toast + conditional logging
- Map server 400 errors to form fields with `setError`
- Handle all HTTP statuses per Section 22 of CODING_RULES.md

### Forms
- Zod schema → `features/<feature>/types/<feature>.schema.ts`
- React Hook Form + zodResolver
- `disabled={isSubmitting}` + visual loading state on submit button

### Performance
- `useMemo` for derived/computed values
- `useCallback` ONLY when paired with `React.memo()` on the child
- `dynamic()` import for heavy components (charts, calendar, map)

---

## Anti-patterns to Avoid

```ts
// ❌ These will be rejected in code review
import axios from "axios";           // use @/configs/axios-client
const x: any = {};                   // use proper type
catch {}                              // always handle errors
key={index}                          // use key={item.id}
useCallback(fn, [])                  // only with React.memo child
```

---

## Pre-implementation Checklist

- [ ] Read CODING_RULES.md (especially relevant sections)
- [ ] File goes in correct folder per Section 1
- [ ] Server vs Client Component decided correctly per Section 3
- [ ] Hook follows patterns in Sections 4-5
- [ ] All 4 UI states handled: loading, error, empty, data (Section 8)
- [ ] Proper error handling and toast notifications (Section 22)
- [ ] Accessibility baseline met (Section 23)
- [ ] No new package without checking `/docs/dependencies.md` (Section 24)
