# Environment Edit

The header pencil button switches between furniture editing and environment editing for Customer Garden and Customer Garden Premium.

Select an element on the canvas or in the inspector. Move and rotate with the gizmo, or enter displacement in metres, rotation in degrees and uniform scale. Visibility and Restore Element are independent per element. Undo/redo includes environment changes.

Editable semantic groups: house, garden room (including doorstep), screened tank, patio, deck, lawn, planting bed, driveway, fence, low planting, car and lighting. Plants remain instanced and move as one planting group. This is an object-level editor, not a vertex/wall-opening CAD tool. Plot boundary and road are fixed survey references; moving the fence does not change the legal/estimated parcel boundary.

Edits are saved as `environmentEdits` in local storage and exported project JSON. Missing edits preserve the original layout. Imported values are validated and clamped. GLB exports contain the transformed, visible geometry. Moving surfaces updates furniture elevation. After an environment edit, furniture placement uses current building/tank bounds rather than the original blockers. Environment elements may overlap intentionally during concept design; there is no building-code or structural validation.

Verification: `node tests/environment-edit.mjs` (Chrome), `node tests/premium-check.mjs`, `npm run build`.
