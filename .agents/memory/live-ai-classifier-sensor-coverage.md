---
name: Live per-zone AI classifiers need full feature coverage per entity
description: A live inference loop over per-zone/per-entity sensor data silently scores nothing if any zone lacks one of the model's required input types.
---

When wiring a trained classifier into a live per-zone (or per-entity) scan loop, verify every zone/entity actually has *all* the sensor types the model needs before assuming the loop works. A narrative-driven seed script (each zone themed around one hazard type: gas, vibration, proximity, camera) will naturally leave most zones missing 2-3 of the 4 required sensor types, so the loop's "zonesScored" silently stays 0 with no error — it just skips zones lacking full coverage.

**Why:** This failure mode produces no exceptions or logs; the API returns 200 with an empty/zero result, which looks like "working but nothing detected" rather than "not actually running."

**How to apply:** After adding a live per-entity AI scoring loop, explicitly audit the seed data for full feature coverage across every entity, not just spot-check one. Add any missing sensor types (with a plausible reading series) to every zone/entity rather than only the ones already narratively suited to it.
