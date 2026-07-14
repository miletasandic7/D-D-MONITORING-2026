---
name: Drizzle array IN-clause gotcha
description: Postgres ANY(array) filters need inArray(), not a raw sql template with a JS array — raw template produces broken SQL.
---

When filtering rows by a set of IDs with Drizzle ORM against Postgres, do not write `sql`\`column = ANY(${idsArray})\`` — the tagged-template parameter binding turns the array into multiple positional params (`$1, $2, $3`) rather than a single array literal, producing invalid SQL like `ANY(($1, $2, $3))`.

**Why:** This was hit while porting a ported app's "list incidents with their attributes" endpoint — a two-query fetch (detections, then their attributes `WHERE detection_id = ANY(ids)`) failed at runtime with a Postgres syntax error, even though it type-checked fine.

**How to apply:** Use `inArray(column, idsArray)` from `drizzle-orm` for this pattern instead of hand-rolling `sql` with an array parameter.
