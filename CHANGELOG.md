# Changelog

All notable changes to this project should be documented in this file.

The format is based loosely on Keep a Changelog.

## [Unreleased]

## [2.1.0] - 2026-09-28

### Added
- Added optional SmartBrowser integration for Joomla content, menu, user, and media selection in both site and administrator authoring.

### Changed
- Kept SmartLink's gallery and tag selection management while using SmartBrowser as their resource browser.
- Removed unavailable core picker buttons from frontend authoring when SmartBrowser is not installed.

## [2.0.4] - 2026-09-04

### Fixed
- Added the active Joomla CSRF token to core picker requests so frontend modal proxies accept them.

## [2.0.3] - 2026-09-04

### Fixed
- Made picker URLs application- and installation-root-aware, allowing Joomla's supported frontend modal proxies to retain the frontend user context.

## [2.0.2] - 2026-09-04

### Fixed
- Enabled the SmartLink editor button in frontend editing forms instead of restricting registration to the Administrator application.

## [2.0.1] - 2026-08-30

### Added
- Added normalized `mime_type`, `extension`, `is_file`, and `downloadable` facts to resolved targets and gallery items.
- Added centralized media capability resolution with resolver hints, local file MIME inspection, and a standard extension-to-MIME fallback for direct file URLs.

### Changed
- Direct media resolvers now explicitly distinguish downloadable files from provider pages; templates no longer need extension guessing or format-specific booleans.

## [2.0.0] - 2026-08-30

### Added
- Added the normalized `$field->smartlink` contract with separate stored `payload`, runtime `resolved` facts, and effective `presentation` state.
- Added central text resolution with author override, configurable field default/pattern, and resolved display-name fallback.
- Added a server-backed authoring Preview adapter registry, a Joomla template override at `html/plg_fields_smartlink/preview.php`, and the generic SmartLink renderer as fallback.
- Added independent author-visible controls for Thumbnail, Icon, Text, and View on Page.
- Added a canonical gallery asset model with `grid`, `viewer`, and `viewer_with_strip` presentation modes.
- Added automated contract, schema, text, gallery, renderer, and preview-adapter tests.

### Changed
- Custom fields now store schema v2 JSON organized as `target`, `snapshot`, and explicit `overrides`; raw JSON is no longer the template API.
- Resolvers now return target/content facts only; they no longer construct media/gallery HTML.
- Gallery rows are derived from item count and columns. The old `rows`, `grid_enabled`, and item-level `link_behavior` properties were removed.
- Gallery items retain their own local/external/provider source type but no longer own nested SmartLink actions.
- Presentation profiles are now strictly `All | None | Customize`; the temporary Template-aligned profile was removed.
- Removed the unused `LayoutRenderer`, `template_name`, and dormant article/category layout files in favor of the Preview adapter mechanism.

### Breaking
- Existing test field values must be opened and saved again to be stored as schema v2.
- Template-managed layouts should consume `$field->smartlink` instead of decoding `$field->rawvalue`.

## [1.14.2] - 2026-08-29

### Added
- Added per-field Presentation Controls modes for All, None, or a customized selection of author-visible feature groups.
- Added configurable author controls for behavior, content parts, labels, image overrides, link attributes, thumbnails, structure, linked parts, galleries, video, and downloads.

### Changed
- Custom field payloads now remove presentation properties that the field definition does not expose to authors, while retaining destination and resolver data for template layouts.
- Kept the editor-button SmartLink builder on the full generic authoring interface.
- Added Preview to the configurable author controls and hide the General/Advanced tabs whenever no Advanced controls are available.
- Added a Template-aligned preset that exposes source selection and Preview without editable presentation controls.

## [1.13.1] - 2026-04-15

### Changed
- Refined source picker prefixes so clear-hover no longer washes out thumbnails too aggressively.
- Continued the gallery builder cleanup with more compact item rows and icon-only add/clear/remove controls.

## [1.13.0] - 2026-04-15

### Changed
- Started the gallery redesign by removing the old shared source-mode model from the builder and moving gallery authoring toward mixed-source item collection editing.
- Restricted gallery actions in the builder to the currently supported inline/toggle gallery contract instead of exposing the old per-item open-link behavior.

## [1.12.3] - 2026-04-14

### Changed
- Reverted icon suggestions to the stable native input suggestion path while keeping inline icon preview and reset behavior.

## [1.12.2] - 2026-04-14

### Fixed
- Fixed the custom icon suggestion dropdown markup so it no longer relies on an invalid interactive-label structure.

## [1.12.1] - 2026-04-14

### Fixed
- Fixed builder icon suggestions visibility so the custom suggestion list opens reliably while the icon field is focused.
- Limited the clear/reset affordance on icon and image prefixes to explicit overrides instead of showing it in default-state previews.

## [1.12.0] - 2026-04-14

### Added
- Added inline icon suggestions with icon previews based on curated defaults plus the configured SmartLink icon stylesheet.
- Added compact media-picker buttons to image override inputs in the builder.

### Changed
- Made icon and image prefixes clickable reset controls so explicit overrides can be cleared directly from the field.
- Kept thumbnail prefixes visible even without explicit values and changed their preview fit behavior to show the whole image inside the square.

## [1.11.1] - 2026-04-14

### Fixed
- Fixed frontend field-builder localization by loading SmartLink language strings explicitly in the field runtime path.
- Added safer JSON config encoding for builder UI strings.

## [1.11.0] - 2026-04-12

### Changed
- Improved builder typography so the UI and preview inherit admin typography more closely.
- Moved builder and picker runtime UI text to localized `ui_strings`.
- Replaced hardcoded English config labels/options in the field and editor plugin configuration screens with language keys.

### Added
- Added and refreshed English and Greek language strings for builder UI and plugin configuration.
