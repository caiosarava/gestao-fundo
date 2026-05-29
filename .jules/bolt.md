## 2025-05-29 - Google Sheets API Caching & Request Deduplication
**Learning:** Google Sheets API calls can be significantly slowed down by network latency and concurrency. Implementing a simple in-memory cache with TTL and tracking "in-flight" requests prevents redundant calls and improves responsiveness.
**Action:** Use a `Map` to store cached promises for active requests and a separate `Map` for results with a TTL.

## 2025-05-29 - Single-pass Data Aggregation
**Learning:** Even with small datasets, reducing the number of iterations over large arrays (like filter/reduce chains) in API routes reduces CPU overhead and GC pressure.
**Action:** Prefer a single `for...of` loop over multiple `filter().reduce()` calls for aggregating data into multiple categories.
