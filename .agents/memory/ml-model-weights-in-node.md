---
name: Deploying trained sklearn models in a Node/esbuild backend
description: Why we hand-port MLP forward passes to TS instead of using ONNX runtime, and how to get generated weight files past the build.
---

For a Node/esbuild backend, avoid `onnxruntime-node` (or any native-binding ML runtime) if the build config externalizes native deps for bundling — it won't bundle cleanly. Instead, train small models with scikit-learn, export the learned weights (coefficients, intercepts, scaler mean/scale) as plain JSON, then hand-write the forward pass (matmul + bias + activation) in TypeScript. This is exact, not an approximation, for simple MLPs/linear models.

**Why:** `onnxruntime-node`/native ML runtimes are typically added to esbuild's `external` list in these projects, so the model file never actually ends up bundled/reachable at runtime — it fails silently or errors only at import time in production.

**How to apply:** Export weights as `.ts` files with `export const x = {...} as const`, not `.json` — many project `tsconfig.base.json` setups don't enable `resolveJsonModule`, and JSON assets can get lost in esbuild's dist copy step. Put the exported weights + hand-written inference module in their own shared `lib/*` package if more than one workspace package (e.g. a backend service and a seed script) needs the same trained model/data.
