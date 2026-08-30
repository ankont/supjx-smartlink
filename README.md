# SmartLink for Joomla

SmartLink is a Joomla field system for storing and rendering typed links as one structured value instead of scattering logic across separate URL, file, image, popup, and preview fields.

It ships as a package with:

- `Fields - SmartLink`
- `Editor Button - SmartLink`
- `System - SmartLink Assets`

The field stores JSON internally, exposes a normalized runtime contract to templates, and can render generic HTML with the correct link, media, preview, embed, or inline-view behavior.

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

The field value remains JSON, but schema v2 treats it only as an internal persistence format. Templates should not decode `rawvalue`.

Typical payload:

```json
{
  "version": 2,
  "target": {
    "kind": "com_content_article",
    "value": "11",
    "source_type": ""
  },
  "snapshot": {
    "display_name": "Example article",
    "href": "/example-article",
    "image": "images/example.jpg",
    "image_alt": "Example",
    "summary": "Cached picker metadata"
  },
  "overrides": {
    "behavior": {
      "action": "link_open"
    },
    "content": {
      "show_icon": true,
      "show_image": false,
      "show_text": true,
      "display_inside": false
    },
    "structure": {
      "structure": "inline",
      "view_position": "after"
    }
  }
}
```

`target` is the selected destination, `snapshot` is cached picker metadata used only when live resolution is unavailable, and `overrides` contains author-controlled presentation intent. Hidden presentation controls are not stored as overrides.

## Rendering Model

At runtime the field plugin exposes a normalized contract:

```php
$smartlink = $field->smartlink;

$href = $smartlink['resolved']['href'];
$text = $smartlink['presentation']['visible_text'];
$showImage = $smartlink['presentation']['show_image'];
```

The contract has three non-overlapping levels:

- `payload`: canonical stored intent only (`target`, fallback `snapshot`, explicit `overrides`)
- `resolved`: live target/content facts (`href`, `title`, `display_name`, `summary`, `image`, `media`, `items`)
- `presentation`: final effective behavior and presentation after field defaults and author overrides are merged

Custom templates should trust `resolved` for target facts and `presentation` for rendering decisions. They do not need to know whether an effective value came from a field default or an author override.

Visible text uses one shared precedence chain:

1. explicit author text
2. field-level default text or pattern
3. resolved `display_name`

Supported field-default variables are `{filename}`, `{full_filename}`, `{bare_filename}`, `{selection_label}`, `{resolved_title}`, and `{type}`. The HTML `title` attribute remains separate as `presentation.html_title`.

Gallery is a standalone resolved asset. Its items contain media facts and navigation metadata only, never nested SmartLink actions. `presentation.gallery.mode` selects `grid`, `viewer`, or `viewer_with_strip`; grid rows are derived from item count and `columns`.

The authoring Preview first uses the generic renderer and then requests the same server-side contract. A site can customize it by creating:

```text
templates/<site-template>/html/plg_fields_smartlink/preview.php
```

The layout receives `$displayData['smartlink']` and `$displayData['context']`. Plugins can also register a `PreviewAdapterInterface` implementation through `onSmartlinkRegisterPreviewAdapters`; returning `null` passes rendering to the next adapter.

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
