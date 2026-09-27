# Environment Edit

## Imported Environments

Use **Dodaj environment** in the Environment section to import a self-contained GLB 2.0, up to 30 MB and 1 million rendered triangles. Prefer fewer than 200,000 triangles and 1K-2K textures. Export in metres, Y up, with textures embedded. FBX, OBJ, BLEND, separate GLTF resources, HDR and EXR are not accepted by this environment importer. Convert geometry to GLB in Blender or the source application first; HDR/EXR images are lighting maps, not garden geometry.

The replacement checkbox replaces only the built-in backdrop, retaining furniture and other imported models. Turn it off to overlay onto the existing garden. Import centers the model horizontally and grounds its lowest point at Y=0 without changing its size. Select the imported environment to edit its position, Y rotation and uniform scale using the standard inspector and transform tools; it moves as a whole, not as editable individual walls. Undo/redo and removal use the normal scene history. Imported animations are not played.

Local IndexedDB retains the model on this device; Save Project embeds it in the `.forma.json` file for another browser/device. The import is local, not an upload to GitHub or a server. Existing custom models plus the new environment must total no more than 48 MB so that the base64 project remains within the project-file import limit. GLB scene export also includes the imported model.

The header pencil button switches between furniture editing and environment editing for Customer Garden and Customer Garden Premium.

Select an element on the canvas or in the inspector. Move and rotate with the gizmo, or enter displacement in metres, rotation in degrees and uniform scale. Visibility and Restore Element are independent per element. Undo/redo includes environment changes.

Editable semantic groups: house, garden room (including doorstep), screened tank, patio, deck, lawn, planting bed, driveway, fence, low planting, car and lighting. Plants remain instanced and move as one planting group. This is an object-level editor, not a vertex/wall-opening CAD tool. Plot boundary and road are fixed survey references; moving the fence does not change the legal/estimated parcel boundary.

Edits are saved as `environmentEdits` in local storage and exported project JSON. Missing edits preserve the original layout. Imported values are validated and clamped. GLB exports contain the transformed, visible geometry. Moving surfaces updates furniture elevation. After an environment edit, furniture placement uses current building/tank bounds rather than the original blockers. Environment elements may overlap intentionally during concept design; there is no building-code or structural validation.

Verification: `node tests/environment-edit.mjs` (Chrome), `node tests/premium-check.mjs`, `npm run build`.
