---
name: Empty-string filter params vs Zod enums
description: Optional enum query filters in react-vite + api-zod stacks reject an empty-string default.
---

When a frontend filter dropdown defaults to `useState('')` (an "All" option) and is passed directly as a query param to a generated hook (e.g. `useListSensors({ sensorType: filterType })`), the generated Zod query-params schema validates it against the OpenAPI enum and rejects `""` with a 400.

**Why:** `""` is not a member of the enum, so `safeParse` fails before the route handler runs, even though the intent was "no filter."

**How to apply:** Only include the param when it has a truthy value, e.g. `filterType ? { sensorType: filterType } : undefined`. Check every filter dropdown built this way (status, riskLevel, sensorType, etc.) — some pages in the same codebase may already do this correctly while others don't.
