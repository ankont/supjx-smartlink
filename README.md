# SmartLink for Joomla

SmartLink is a Joomla field system for storing and rendering typed links as one structured value instead of scattering logic across separate URL, file, image, popup, and preview fields.

It ships as a package with:

- `Fields - SmartLink`
- `Editor Button - SmartLink`
- `System - SmartLink Assets`

The field stores a JSON payload. The renderer turns that payload into final HTML with the correct link, media, preview, embed, or inline-view behavior.

## What SmartLink Is

SmartLink is not a plain URL field.

It stores:

- what the target is
- how it should behave
- how it should look
- whether it should embed or preview content
- whether the linked page should appear inline, in a popup, or as a simple link

Typical use cases:

- external link
- internal Joomla page
- article/category/contact/tag/menu link
- email / phone / anchor
- file download
- image or video link
- gallery
- inline `View on Page`
- popup preview
- toggle-open embedded content

In practice, it is meant to replace multiple separate fields such as:

- URL field
- file field
- image link field
- video/embed field
- article/category selector field
- popup / preview configuration fields

## Supported Kinds

Simple links:

- `external_url`
- `relative_url`
- `anchor`
- `email`
- `phone`

Joomla items:

- `com_content_article`
- `com_content_category`
- `menu_item`
- `com_tags_tag`
- `com_contact_contact`
- `user_profile`
- `advanced_route`  
  UI label: `Joomla Path`

Media:

- `media_file`
- `image`
- `video`
- `gallery`

## Supported Actions

SmartLink supports these action modes:

- `no_action`
- `link_open`
- `link_download`
- `preview_modal`
- `toggle_view`

Not every action is available for every kind. The builder restricts actions by kind.

Examples:

- `email` and `phone` only expose the actions that make sense for them
- `media_file` supports download behavior
- page-like/internal kinds can use popup or inline/toggle viewer behavior

## Stored Data Structure

The field value is a single JSON object.

Typical payload:

```json
{
  "kind": "com_content_article",
  "value": "11",
  "action": "link_open",
  "label": "",
  "title": "",
  "target": "",
  "rel": "",
  "css_class": "",
  "icon_class": "",
  "download_filename": "",
  "source_type": "",
  "popup_scope": "component",
  "preview_image": "",
  "image_override": "",
  "preview_alt": "",
  "thumbnail_empty_class": "",
  "thumbnail_position": "",
  "thumbnail_ratio": "",
  "thumbnail_fit": "",
  "thumbnail_size": "",
  "selection_summary": "",
  "show_icon": true,
  "show_image": false,
  "show_text": true,
  "display_inside": false,
  "click_individual_parts": false,
  "click_icon": false,
  "click_text": false,
  "click_image": false,
  "click_view": false,
  "structure": "inline",
  "view_position": "after",
  "show_summary": false,
  "show_type_label": false,
  "figure_caption_text": false,
  "video": {},
  "gallery": {}
}
```

Canonical payload properties you can rely on:

- `kind`
- `value`
- `action`
- `label`
- `title`
- `target`
- `rel`
- `css_class`
- `icon_class`
- `download_filename`
- `source_type`
- `popup_scope`
- `preview_image`
- `image_override`
- `preview_alt`
- `thumbnail_empty_class`
- `thumbnail_position`
- `thumbnail_ratio`
- `thumbnail_fit`
- `thumbnail_size`
- `selection_summary`
- `show_icon`
- `show_image`
- `show_text`
- `display_inside`
- `click_individual_parts`
- `click_icon`
- `click_text`
- `click_image`
- `click_view`
- `structure`
- `view_position`
- `show_summary`
- `show_type_label`
- `figure_caption_text`
- `video`
- `gallery`

The builder/editor also uses helper properties during import/reopen:

- `selection_label`
- `selection_href`
- `selection_image`
- `selection_image_alt`

These are useful for editor state and normalization, but the main contract is still the typed payload above.

## Rendering Model

Recommended render path:

1. store the JSON payload in the field
2. let `Fields - SmartLink` render it

At runtime, SmartLink resolves the payload into richer data such as:

- final `href`
- resolved title/label
- summary
- image
- image alt
- multi-item lists for tags/gallery

So there are two layers:

- stored payload = author intent and configuration
- resolved data = runtime information used for HTML output

Typical output markup uses classes such as:

- `.smartlink`
- `.smartlink-wrapper`
- `.smartlink-view`
- `.smartlink-thumb`
- `.smartlink-icon`
- `.smartlink-part`

Depending on the payload, SmartLink may render:

- an anchor
- a static span
- a button-like action element that behaves visually like a link
- an inline viewer wrapper
- media/file/gallery output

## Preview, Embed, and Inline View Logic

SmartLink supports more than plain links.

Examples:

- image output
- local or provider video embeds
- gallery rendering
- file open/download behavior
- page preview in popup
- inline `View on Page`
- `toggle_view` open/close behavior

For iframe-based views, SmartLink persists wrapper-level metadata and can rehydrate missing iframes when an editor strips them. This is especially relevant for TinyMCE/editor safety.

## Page Display Modes

For internal page-like targets, SmartLink supports page display modes.

General modes:

- `Only component`
- `With site layout`

Article-only mode:

- `Bare content only`

Important distinction:

- `Only component` means routed page output with `tmpl=component`
- `With site layout` means normal routed page output
- `Bare content only` is a best-effort article-content extraction mode on top of component rendering

`Bare content only` is intentionally limited to articles because content extraction becomes too fragile across arbitrary components, layouts, and template overrides.

## Styling Model

SmartLink can use its own built-in frontend/content CSS or template-specific class mappings.

Key ideas:

- built-in SmartLink styles can be enabled globally
- thumbnail classes can be mapped to template-specific classes
- action buttons can use a dedicated class
- the editor preview and TinyMCE iframe load SmartLink content assets explicitly

This keeps the output configurable without changing the stored payload structure.

## Editor Integration

The editor button opens the same SmartLink builder used by the field.

It supports:

- creating new SmartLink markup
- reopening and editing existing SmartLinks
- preserving typed state across kind changes
- import/reopen of existing rendered markup
- iframe rehydration support for editor-safe persistence

The editor integration and the field builder share the same payload contract.

## Repository Layout

- `package/`  
  Joomla package source
- `package/plugins/fields/smartlink/`  
  `Fields - SmartLink`
- `package/plugins/editors-xtd/smartlink/`  
  `Editor Button - SmartLink`
- `package/plugins/system/smartlinkassets/`  
  `System - SmartLink Assets`
- `build/build.ps1`  
  build script
- `build/output/`  
  generated installable ZIPs

## Build

Run:

```bat
build.bat
```

or:

```powershell
powershell -ExecutionPolicy Bypass -File .\build\build.ps1
```

This creates:

- `build/output/pkg_smartlink_vX.Y.Z.zip`

The package ZIP contains:

- `pkg_smartlink.xml`
- `language/`
- `packages/plg_fields_smartlink.zip`
- `packages/plg_editors_xtd_smartlink.zip`
- `packages/plg_system_smartlinkassets.zip`

## Installation

1. Build the package.
2. In Joomla Administrator go to `System -> Install -> Extensions`.
3. Upload `build/output/pkg_smartlink_v<version>.zip`.
4. Ensure these plugins are enabled:
   - `Fields - SmartLink`
   - `Editor Button - SmartLink`
   - `System - SmartLink Assets`
5. Create a custom field of type `SmartLink`.

## Versioning

Keep these manifests on the same version:

- `package/pkg_smartlink.xml`
- `package/plugins/fields/smartlink/smartlink.xml`
- `package/plugins/editors-xtd/smartlink/smartlink.xml`
- `package/plugins/system/smartlinkassets/smartlinkassets.xml`

The build script reads the package version from `package/pkg_smartlink.xml` and names the final archive:

- `pkg_smartlink_v<version>.zip`
