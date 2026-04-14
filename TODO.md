# SmartLink TODO

Practical working list for the current SmartLink roadmap.

Use this file for:
- confirmed next features
- QA / audit passes
- ideas discussed but not yet committed
- incoming bugfix notes

Priority guide:
- `P1` = important / should be tackled soon
- `P2` = important but not first
- `P3` = later / optional / more exploratory

## Bugs / Behavior Fixes

- [ ] [P1] Preview embedded page links should not navigate
  - Links inside `View on Page` content in the preview are currently clickable.
  - The preview should stay sandboxed/non-navigating even when embedded content contains links.

- [ ] [P1] Preview placeholder should not show visible view area when `View on Page` is off
  - In several kinds, the default preview placeholder still reserves/displays a `View on Page` area even when the toggle is off.
  - This is especially wrong for `toggle_view`, where `View on Page` is supposed to mean the initial visible state.
  - The preview should reflect the actual initial visible state, not the mere capability of rendering a view.

- [ ] [P2] Builder UI localization pass
  - Remove remaining hardcoded English strings from the builder/editor UI.
  - Make the SmartLink builder respect Joomla language packs consistently.
  - Mixed-language admin UI should be treated as a bug, not as a cosmetic detail.

## Core Features / Model

- [ ] [P3] Metadata mode
  - Add a clear output/storage mode such as `Minimal / Smart / Verbose`.
  - Define exactly what changes in emitted markup and metadata.

- [ ] [P1] Thumbnail inheritance model
  - Introduce a clear chain: `global defaults -> field definition -> per-link override`.
  - In the field definition, add `Inherit` for thumbnail layout properties such as `Position / Ratio / Fit / Size`.
  - In the field builder, thumbnail layout toggle should be meaningful:
    - `off` = write nothing for thumbnail layout overrides in JSON; field definition values are used when creating HTML
    - `on` = allow explicit values plus `Inherit`, just as in the field definition and editor-button builder
  - JSON / HTML semantics:
    - `Inherit` = do not emit a specific CSS class; fall back to the default global SmartLink class behavior
    - explicit value = emit the corresponding CSS class

- [ ] [P3] Pretty HTML output option
  - Consider a general output formatting option such as compact vs indented HTML.
  - This is about readability of emitted markup, not behavior.

- [ ] [P2] TinyMCE quick edit UX
  - Add a faster edit entry point for existing SmartLinks.
  - Likely first pass: `double click` or a context action.

## Builder / Admin UX Cleanup

- [ ] [P1] Thumbnail override UI cleanup
  - Reduce visual clutter in the builder UI, especially for field usage.
  - Add a local show/hide control for thumbnail layout options (`Position / Ratio / Fit / Size`).
  - Keep `Image to show` and `Alternative text` always visible.
  - Revisit whether the same local show/hide should also be used in the editor-button `Advanced` tab for consistency.

- [ ] [P2] Advanced tab layout cleanup
  - Reorder advanced fields for a cleaner visual grouping.
  - Preferred order discussed:
    - `Structure | Popup image override | Icon class | CSS class`
    - `Title | Open in | Rel | Page display`
  - Revisit conditional visibility:
    - `Open in` and `Rel` probably should not be shown for popup/toggle behaviors.
    - `Page display` should appear only where it is meaningful.
  - Make `Linked Part` behave like a full-row expandable control, not just another small toggle chip.
  - Keep the outer `Linked Part` box visually stable whether collapsed or expanded.
  - When expanded, its child toggles (`Thumbnail / Icon / Text / View on Page`) should be shown in a clearer dedicated row.

- [ ] [P3] Optional field-definition thumbnail toggle
  - This is only for reducing visual clutter in the field definition screen.
  - `off` should mean: all field-definition thumbnail layout values are effectively `Inherit`.
  - `on` should reveal the field-definition thumbnail layout selects (`Position / Ratio / Fit / Size`).
  - This toggle should not introduce a new inheritance level or different storage semantics.
  - It is optional UI sugar, not a core part of the runtime contract.

- [ ] [P2] Admin builder typography fit
  - Make the SmartLink field builder inherit Joomla admin typography more closely.
  - At minimum, align `font-family`, `font-size`, and general text feel with the surrounding admin form UI.
  - This is mainly about reducing the "foreign widget" feeling inside field edit screens.

- [ ] [P2] Icon class assist / live preview
  - Keep icon selection class-first: the user types or edits the icon class directly.
  - Add visual feedback so the typed class immediately shows the resulting icon.
  - Consider lightweight suggestions/search help, but do not replace the class input with a heavy visual picker.
  - The same behavior should work in both field builder and editor-button builder.

- [ ] [P2] Media picker for image overrides
  - Replace the plain `Image to show` textbox with a proper image-selection flow.
  - Use a Joomla-style media dialog for manual thumbnail / preview image overrides.
  - Support at least: choose image, clear image, and preserve direct URL/manual fallback where needed.
  - This should apply to thumbnail/image override use cases, not only one specific kind.
  - Keep the UI compact; avoid turning thumbnail overrides into another cluttered subform.

- [ ] [P2] Media source row cleanup
  - Make media/image/gallery source selection more compact in the builder UI.
  - Prefer a clearer single-row layout for source type, selected value, and action buttons.

## QA / Audit

- [ ] [P1] Toggle / view-on-page regression pass
  - Re-test `toggle_view`, popup, inline display, and iframe rehydration.
  - Include preview, TinyMCE editor area, and frontend output.

- [ ] [P2] Media audit pass
  - Review `video`, `gallery`, and `view-on-page` combinations systematically.
  - Check render, reopen/import, TinyMCE persistence, preview, and frontend output.

- [ ] [P1] Gallery subsystem pass
  - Re-evaluate gallery as its own subsystem, not just another media kind.
  - Review picker UX, source model, emitted HTML, preview behavior, reopen/import, and frontend rendering.
  - Investigate whether gallery should support mixed-source items in one collection (e.g. local + web).
  - Revisit whether the current gallery HTML contract is actually good enough or needs redesign.

## Ideas / Later

- [ ] [P3] Structure model review
  - Re-evaluate whether the current structure model is enough for the useful presentation patterns we want.
  - Keep this separate from behavior logic.
  - Prefer reviewing whether a few better-defined structure patterns are needed, not a free-form HTML templating system.

- [ ] [P3] Right-click menu in TinyMCE
  - Discussed, but not selected as the next UX step yet.

- [ ] [P3] Omit default thumbnail modifier classes
  - Consider omitting thumbnail modifier classes when output matches the agreed baseline.
  - This depends on the final inheritance/defaults model and should not be implemented ad hoc.

- [ ] [P3] Extend `Bare content only` beyond articles
  - Currently article-only on purpose.
  - Revisit only if there is a component-specific extraction strategy.

- [ ] [P3] Smarter document thumbnails
  - PDF / document-specific empty states or generated previews.
  - Not a current priority.

- [ ] [P3] Mixed-source gallery UX
  - Investigate how gallery items from different sources should be added in practice.
  - Compare at least two UI directions:
    - `Add from web` alongside `Choose`
    - or a controlled `Add URL` flow tied to the media selection dialog
  - Do not implement this before the broader gallery pass is understood.

## Notes

- Keep this file short and operational.
- Move finished items out or mark them clearly when done.
- Avoid adding speculative work to `Open Features` before it is agreed.
