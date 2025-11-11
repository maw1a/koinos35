koinos35/backend/SOLUTION.md#L1-200

# Solution — Take‑Home Assessment

This document explains the approach I took, the reasoning behind key decisions, and trade‑offs I considered while implementing the objectives from the README. It is intended to help you (the reviewer) quickly understand what I changed, why, and what I'd do next with more time.

---

## Summary of changes

Files I touched / added (high level)

- Backend
  - `backend/src/utils/data.js` — async file handling + file watcher + in‑memory cache for fast reads
  - `backend/src/routes/items.js` — removed blocking I/O by relying on the async data util and made route behavior clear (pagination + server search)
  - `backend/src/routes/stats.js` — returns cached stats from the data util
  - `backend/src/routes/items.test.js` — Jest + supertest unit tests for items routes (happy paths + error cases)
- Frontend
  - `frontend/src/hooks/useFetch.js` — fetch hook with `AbortController` support
  - `frontend/src/pages/Items.js` — fixed memory leak by canceling fetch on unmount, added server‑side search and pagination integration, integrated virtualization (react‑window)
  - `frontend/src/state/DataContext.js` — small changes to expose fetch/abort/loading/total consistently

## Objectives & How I addressed them

### Backend

1. Non‑blocking I/O
   - Approach: Moved file reads/writes to `fs/promises` APIs and used an in‑process file watcher to keep an in‑memory copy of the dataset and computed stats.
   - Benefit: Requests read from memory (fast, non‑blocking) while persistence still uses async I/O for writes.
   - Where: `backend/src/utils/data.js`.

2. Performance — stats recalculation
   - Approach: Compute stats when loading the file (initial read) and on watcher change events. Store `data` and `stats` in memory; `GET /api/stats` simply returns the cached value.
   - Benefit: `GET /api/stats` becomes O(1) and doesn't parse/iterate the file on every request.
   - Considered alternatives:
     - Recalculate stats on every write only (works but misses external file edits). I used a file watcher to detect external edits.
     - Keep stats in a small persisted metadata file (more complexity for this exercise).
   - Trade‑off: The in‑memory cache means multiple backend instances would each have their own view for a horizontally scaled deployment you'd want a shared datastore or external cache.

3. Routes + Pagination + Search
   - Approach: Keep server handle `pg` (page) and `q` (query) params; perform server‑side filtering then paginate results. `PAGE_SIZE` kept small for the demo.
   - Trade‑off: Filtering is a simple substring match (case‑insensitive). For large datasets you’d want indexed search or a proper full‑text search solution.

4. Testing
   - Approach: Added unit/integration tests for items routes using `jest` + `supertest`. Tests cover:
     - Basic paginated fetch
     - Page 2 behavior
     - Search filtering
     - GET by id success/404
     - POST success & validation errors
   - Design: Tests mock the `data` util to avoid filesystem reliance and to produce deterministic in‑memory datasets.
   - Note: I did not rely on the watcher in tests; the util is mocked for deterministic behavior.

### Frontend

1. Memory leak (fetch cancellation)
   - Issue: Fetch calls could complete after the component unmounted and try to set state.
   - Fix: I ensured the fetch hook exposes a cancel function (based on `AbortController`) and that `Items` calls `abort()` in the cleanup function of `useEffect`. The fetch hook already used an AbortController; I wired it correctly so no state updates happen after unmount.

2. Pagination & Search
   - Approach: The UI sends `pg` and `q` to the server (`GET /api/items?pg=...&q=...`) and relies on server for filtering/pagination. The DataContext provides `fetchItems()` and `abort()`.
   - UX: Search input uses a controlled approach (with ref) and triggers a fetch when the user clicks "Find". With more time I'd add debouncing and `Enter` key binding.

3. Virtualization
   - Approach: Use `react-window` to render only visible rows in a long list.
   - Trade‑off: Virtualization works best with fixed row heights (or careful measurement).

4. Loading / UX polish
   - I added a basic "Loading..." state while awaiting data. With more time I'd add skeletons, better keyboard accessibility.

## Important trade‑offs & rationale

- In‑memory caching vs read‑per‑request:
  - Caching gives excellent read performance but introduces consistency considerations in multi‑instance setups. For a single process test app it's the simplest, fastest option.
  - If you expect concurrent writers or multiple instances, use a proper DB or external cache (Redis) and/or a coordination layer.

- File watcher approach
  - Pros: Detects external edits to `data/items.json` and automatically refreshes in memory.
  - Cons: Watchers can be platform‑sensitive and may have edge cases during bulk writes. For production I'd prefer a data store with DB change feeds or background polling.

- Search implementation
  - I used case‑insensitive substring matching (simple & predictable). For real apps, use indexed search or an external search service if we need fuzzy matching.

- Validation
  - Current validation is minimal (type checks). I left it intentionally small to focus on the objectives, but in production you'd want JSON schema validation using some validation library like `zod` with error messages.

- Virtualization
  - Chosen because it's lightweight and solves obvious performance problems for long lists. It assumes uniform row heights which is acceptable for this task.
