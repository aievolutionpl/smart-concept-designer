# Customer Garden Premium

Open `http://127.0.0.1:5173/?project=customer-garden-premium`.
The original Customer Garden and the premium proposal use separate local-storage keys.

The proposal contains two wicker loungers, an L-shaped sectional, a smoked-glass table, three stools, a timber/stainless plunge tub with steps, the existing Cube Plus sauna and two planters. The existing buildings, boundary and low planting are retained.

The five new models are approximate reconstructions from the supplied photographs, not photogrammetry or manufacturer CAD. Dimensions are estimates in metres. Reference photos are not asserted to be CC0. Cube Plus remains the previously supplied model.

Reusable GLBs and a metadata catalog are in `public/models/premium/`. Procedural source is `src/premium-furniture.js`. The editor uses the same source models with meshes merged by material. Texture maps are 256px repeatable procedural wicker, linen and wood; no high-resolution photo is mapped onto geometry.

Verification: `node tests/premium-check.mjs` (installed Chrome required), `npm run build`.
The browser test checks scene loading, add/remove, undo/redo, mobile rendering and storage isolation, generates GLBs and saves screenshots plus the project JSON in `test-results/`.
Measured full-scene geometry: 369116 triangles, 202 draw calls. These counts are not a frame-rate guarantee; performance depends on device and shadow settings. Low-power devices can use the existing Eco quality setting.
