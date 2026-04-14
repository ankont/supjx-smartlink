# Changelog

All notable changes to this project should be documented in this file.

The format is based loosely on Keep a Changelog.

## [Unreleased]

### Changed
- Ongoing builder UX, localization, output, and media/gallery improvements tracked in `TODO.md`.

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
