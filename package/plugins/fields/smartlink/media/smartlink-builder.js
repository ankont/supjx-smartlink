(() => {
  const DEFAULT_ICON_STYLESHEET_URL = "/media/system/css/joomla-fontawesome.min.css";
  const DEFAULT_CONTENT_STYLESHEET_URL = "/media/plg_fields_smartlink/smartlink-content.css";
  const DEFAULT_CONTENT_SCRIPT_URL = "/media/plg_fields_smartlink/smartlink-content.js";
  const ACTIONS = ["no_action", "link_open", "link_download", "preview_modal", "toggle_view"];
  const LEGACY_DEFAULT_ACTIONS = ["no_action", "link_open", "link_download", "preview_modal"];
  const CURATED_ICON_SUGGESTIONS = [
    "fa-solid fa-link",
    "fa-solid fa-arrow-up-right-from-square",
    "fa-solid fa-thumbtack",
    "fa-solid fa-envelope",
    "fa-solid fa-phone",
    "fa-solid fa-sitemap",
    "fa-solid fa-tags",
    "fa-solid fa-video",
    "fa-solid fa-route",
    "fa-solid fa-user",
    "fa-solid fa-image",
    "fa-solid fa-images",
    "fa-solid fa-file-lines",
    "fa-solid fa-folder-open",
    "fa-solid fa-circle-info",
    "fa-solid fa-circle-question",
    "fa-solid fa-globe",
    "fa-solid fa-book",
    "fa-solid fa-book-open",
    "fa-solid fa-download",
    "fa-solid fa-play",
    "fa-solid fa-photo-film",
    "fa-solid fa-share-nodes",
    "fa-regular fa-newspaper",
    "fa-regular fa-folder-open",
    "fa-regular fa-user",
    "fa-regular fa-file-lines",
    "fa-regular fa-image",
    "fa-regular fa-images",
    "fa-brands fa-youtube",
    "fa-brands fa-vimeo",
    "fa-brands fa-facebook",
    "fa-brands fa-instagram",
    "fa-brands fa-x-twitter",
    "fa-brands fa-linkedin"
  ];
  const ICON_STYLE_GROUPS = [
    ["fa-solid"],
    ["fa-regular"],
    ["fa-brands"],
    ["fa-light"],
    ["fa-thin"],
    ["fa-duotone"],
    ["fa-sharp", "fa-solid"],
    ["fa-sharp", "fa-regular"],
    ["fa-sharp", "fa-light"],
    ["fa-sharp", "fa-thin"],
    ["fa-sharp-duotone"]
  ];
  const ICON_STYLE_TOKENS = new Set([
    "fa",
    "fas",
    "far",
    "fab",
    "fal",
    "fat",
    "fad",
    ...ICON_STYLE_GROUPS.flat()
  ]);
  const ICON_SUGGESTION_CACHE = new Map();
  const DEFAULT_UI_STRINGS = {
    group_simple_links: "Simple Links",
    group_joomla_items: "Joomla Items",
    group_media: "Media",
    group_advanced: "Advanced",
    structure_inline: "Inline",
    structure_block: "Block",
    structure_figure: "Figure",
    view_position_before: "Before link",
    view_position_after: "After link",
    thumbnail_empty_mode_empty: "Empty",
    thumbnail_empty_mode_generic: "Generic",
    thumbnail_empty_mode_specific: "Specific",
    thumbnail_ratio_auto: "Auto",
    thumbnail_ratio_1_1: "1:1",
    thumbnail_ratio_4_3: "4:3",
    thumbnail_ratio_16_9: "16:9",
    thumbnail_position_inline: "Inline",
    thumbnail_position_top: "Top",
    thumbnail_position_bottom: "Bottom",
    thumbnail_position_left: "Left",
    thumbnail_position_right: "Right",
    thumbnail_fit_cover: "Cover",
    thumbnail_fit_contain: "Contain",
    thumbnail_fit_fill: "Fill",
    thumbnail_fit_none: "None",
    thumbnail_fit_scale_down: "Scale down",
    thumbnail_size_sm: "Small",
    thumbnail_size_md: "Medium",
    thumbnail_size_lg: "Large",
    keep_defaults: "Keep defaults",
    kind_external_url: "External Link",
    kind_anchor: "Anchor",
    kind_email: "Email",
    kind_phone: "Phone",
    kind_article: "Article",
    kind_category: "Category",
    kind_menu_item: "Menu Item",
    kind_tags: "Tags",
    kind_contact: "Contact",
    kind_media_file: "Media File",
    kind_image: "Image",
    kind_video: "Video",
    kind_gallery: "Gallery",
    kind_relative_url: "Relative Link",
    kind_user_profile: "User Profile",
    kind_joomla_path: "Joomla Path",
    action_no_action: "No action",
    action_open_link: "Open link",
    action_open_in_popup: "Open in popup",
    action_toggle_view: "Toggle view on page",
    action_jump_to_anchor: "Jump to anchor",
    action_open_email_link: "Open email link",
    action_open_phone_link: "Open phone link",
    action_open_file: "Open file",
    action_download_file: "Download file",
    action_open_image: "Open image",
    action_open_video: "Open video",
    action_open_items: "Open items",
    action_open_items_in_popup: "Open items in popup",
    source_media_library: "Media Library",
    source_web_address: "Web address",
    source_youtube_vimeo: "YouTube or Vimeo",
    source_direct_web_address: "Direct web address",
    page_display_only_component: "Only component",
    page_display_bare_content_only: "Bare content only",
    page_display_with_site_layout: "With site layout",
    warning_use_relative_link: "This does not look like a normal site URL. Maybe use Relative Link instead.",
    warning_use_external_link: "This looks like an external address. Use External Link instead.",
    warning_unsafe_scheme: "This address uses an unsafe scheme and will be rejected.",
    warning_invalid_email: "This does not look like a valid email address.",
    warning_invalid_phone: "This does not look like a valid phone number.",
    warning_use_video_provider: "Use a YouTube or Vimeo link here.",
    info_https_added: "https:// was added automatically for this external link.",
    info_domain_removed: "Site domain was removed and kept as a relative link.",
    info_leading_slash_added: "A leading / was added automatically for this relative link.",
    summary_n_items_selected_one: "{count} item selected",
    summary_n_items_selected_other: "{count} items selected",
    summary_n_tags_selected_one: "{count} tag selected",
    summary_n_tags_selected_other: "{count} tags selected",
    summary_no_items_selected: "No items selected yet.",
    summary_no_tags_selected: "No tags selected yet.",
    summary_nothing_selected: "Nothing selected yet.",
    summary_no_value: "No value set yet.",
    summary_selected_item_number: "Selected item #{value}",
    summary_selected_item: "Selected item",
    summary_selected_tags: "Selected tags",
    summary_selected_file: "Selected file",
    value_label_web_address: "Web address",
    value_label_relative_link: "Relative link",
    value_label_anchor_id: "Anchor ID",
    value_label_email_address: "Email address",
    value_label_phone_number: "Phone number",
    value_label_joomla_path: "Joomla path",
    value_label_user_reference: "User reference",
    value_label_youtube_vimeo_link: "YouTube or Vimeo link",
    value_label_path: "{kind} path",
    value_label_value: "Value",
    value_placeholder_external: "https://example.com/page",
    value_placeholder_relative: "/my-page",
    value_placeholder_anchor: "section-id",
    value_placeholder_email: "name@example.com",
    value_placeholder_phone: "+30 210 1234567",
    value_placeholder_joomla_path: "index.php?option=com_content&view=article&id=12",
    value_placeholder_user_reference: "42",
    value_placeholder_youtube: "https://youtu.be/...",
    value_placeholder_file: "https://example.com/file",
    value_placeholder_value: "Enter a value",
    hint_anchor_suggestions: "Suggestions are collected from the current editor content.",
    hint_download_filename: "download",
    section_source: "Source",
    section_behavior: "Behavior",
    section_content: "Content",
    section_advanced: "Advanced",
    section_preview: "Preview",
    field_where_items_from: "Where are the items from?",
    field_where_kind_from: "Where is the {kind} from?",
    field_when_clicked: "When clicked",
    field_download_filename_optional: "Download filename (optional)",
    field_text_to_display: "Text to display",
    field_image_to_show: "Image to show",
    field_alternative_text: "Alternative text",
    field_override_defaults: "Override defaults",
    field_position: "Position",
    field_ratio: "Ratio",
    field_fit: "Fit",
    field_size: "Size",
    field_empty_class: "Empty Class",
    field_structure: "Structure",
    field_popup_image_override: "Popup image override",
    field_icon_class: "Icon class",
    field_css_class: "CSS class",
    field_title: "Title",
    field_open_in: "Open in",
    field_rel: "Rel",
    field_page_display: "Page display",
    field_view_on_page_position: "View on Page position",
    field_poster_image: "Poster image",
    field_columns: "Columns",
    field_gap: "Gap",
    field_how_items_fit: "How the items fit",
    field_item_title: "Item title",
    button_choose_image: "Choose image",
    subsection_thumbnail_overrides: "Thumbnail Overrides",
    video_show_controls: "Show controls",
    video_autoplay: "Start playing automatically",
    video_repeat: "Repeat",
    video_start_muted: "Start muted",
    placeholder_optional_override: "Optional override",
    placeholder_optional_popup_image: "Optional popup image",
    placeholder_optional: "Optional",
    toggle_thumbnail: "Thumbnail",
    toggle_icon: "Icon",
    toggle_text: "Text",
    toggle_view_on_page: "View on Page",
    toggle_show_summary: "Show summary",
    toggle_show_type_label: "Show type label",
    toggle_use_figure_caption: "Use figure caption for text",
    toggle_linked_parts: "Linked Parts",
    tooltip_popup_preview_forced: "Enabled automatically for popup preview.",
    tooltip_view_required: "Required for this click behavior.",
    tooltip_linked_parts: "Link only the selected parts instead of linking the whole item.",
    warning_enable_content_part: "Enable at least one of icon, image or text.",
    preview_placeholder_link_text: "Link text",
    preview_placeholder_anchor_point: "Anchor point",
    preview_placeholder_email_address: "E-mail address",
    preview_placeholder_phone_number: "Phone number",
    preview_placeholder_joomla_path: "Joomla path",
    preview_placeholder_file_name: "File name",
    preview_placeholder_image_title: "Image title",
    preview_placeholder_video_title: "Video title",
    preview_placeholder_gallery: "Gallery",
    preview_placeholder_tags: "Tags",
    preview_placeholder_summary: "Summary preview",
    preview_placeholder_no_content: "No content to preview",
    tab_general: "General",
    tab_advanced: "Advanced",
    dialog_preview_action_title: "Preview action",
    dialog_loading_url: "Loading URL:",
    dialog_preview_default_title: "Preview",
    dialog_builder_title: "SmartLink Builder",
    dialog_close: "Close",
    dialog_clear: "Clear",
    dialog_cancel: "Cancel",
    dialog_insert: "Insert",
    dialog_prompt_json: "Paste a SmartLink JSON payload.",
    rail_switch_section: "Click to switch section.",
    aria_sections: "SmartLink sections",
    preview_frame_title: "SmartLink preview",
    picker_dialog_title_default: "Joomla Picker",
    picker_selected_items: "Selected items",
    picker_add_selected: "Add selected",
    picker_close: "Close",
    picker_paste_selected_value: "Paste the selected value",
    picker_one_item_per_line: "One item per line: type|src|label|poster",
    picker_apply: "Apply",
    picker_cancel: "Cancel",
    picker_no_items_selected: "No items selected yet.",
    picker_no_tags_selected: "No tags selected yet.",
    picker_remove: "Remove {label}",
    gallery_fallback_video: "Video",
    gallery_fallback_item: "Item",
    gallery_add_item: "Add item",
    gallery_add_from_media_library: "Add from Media Library",
    gallery_remove: "Remove",
    gallery_fit_fill_space: "Fill the space",
    gallery_fit_show_whole: "Show the whole item",
    gallery_fit_stretch: "Stretch to fit",
    gallery_fit_stretch_width: "Stretch to full width",
    gallery_fit_stretch_height: "Stretch to full height",
    generic_item: "Item"
  };
  let ACTIVE_UI_STRINGS = { ...DEFAULT_UI_STRINGS };
  const GROUPS = [
    ["simple_links", "group_simple_links", ["external_url", "anchor", "email", "phone"]],
    ["joomla_items", "group_joomla_items", ["com_content_article", "com_content_category", "menu_item", "com_tags_tag", "com_contact_contact"]],
    ["media", "group_media", ["media_file", "image", "video", "gallery"]],
    ["advanced", "group_advanced", ["relative_url", "user_profile", "advanced_route"]]
  ];
  const STRUCTURES = [
    ["inline", "structure_inline"],
    ["block", "structure_block"],
    ["figure", "structure_figure"]
  ];
  const VIEW_POSITIONS = [
    ["before", "view_position_before"],
    ["after", "view_position_after"]
  ];
  const THUMBNAIL_EMPTY_MODES = [
    ["empty", "thumbnail_empty_mode_empty"],
    ["generic", "thumbnail_empty_mode_generic"],
    ["specific", "thumbnail_empty_mode_specific"]
  ];
  const THUMBNAIL_RATIOS = [
    ["auto", "thumbnail_ratio_auto"],
    ["1-1", "thumbnail_ratio_1_1"],
    ["4-3", "thumbnail_ratio_4_3"],
    ["16-9", "thumbnail_ratio_16_9"]
  ];
  const THUMBNAIL_POSITIONS = [
    ["inline", "thumbnail_position_inline"],
    ["top", "thumbnail_position_top"],
    ["bottom", "thumbnail_position_bottom"],
    ["left", "thumbnail_position_left"],
    ["right", "thumbnail_position_right"]
  ];
  const THUMBNAIL_FITS = [
    ["cover", "thumbnail_fit_cover"],
    ["contain", "thumbnail_fit_contain"],
    ["fill", "thumbnail_fit_fill"],
    ["none", "thumbnail_fit_none"],
    ["scale-down", "thumbnail_fit_scale_down"]
  ];
  const THUMBNAIL_SIZES = [
    ["sm", "thumbnail_size_sm"],
    ["md", "thumbnail_size_md"],
    ["lg", "thumbnail_size_lg"]
  ];
  const GLOBAL_THUMBNAIL_DEFAULTS = {
    position: "inline",
    ratio: "auto",
    fit: "cover",
    size: "md"
  };
  const DEFAULT_LINK_BUTTON_CLASS = "smartlink-actionbtn";
  const DEFAULT_THUMBNAIL_EMPTY_CLASS = "smartlink-image-empty";
  const DEFAULT_THUMBNAIL_CLASS_MAPPINGS = {
    position: {
      inline: "smartlink-thumb--inline",
      top: "smartlink-thumb--top",
      bottom: "smartlink-thumb--bottom",
      left: "smartlink-thumb--left",
      right: "smartlink-thumb--right"
    },
    ratio: {
      auto: "smartlink-thumb--ratio-auto",
      "1-1": "smartlink-thumb--ratio-1-1",
      "4-3": "smartlink-thumb--ratio-4-3",
      "16-9": "smartlink-thumb--ratio-16-9"
    },
    fit: {
      cover: "smartlink-thumb--fit-cover",
      contain: "smartlink-thumb--fit-contain",
      fill: "smartlink-thumb--fit-fill",
      none: "smartlink-thumb--fit-none",
      "scale-down": "smartlink-thumb--fit-scale-down"
    },
    size: {
      sm: "smartlink-thumb--sm",
      md: "smartlink-thumb--md",
      lg: "smartlink-thumb--lg"
    }
  };
  const STRUCTURED_CONTENT_KINDS = ["com_content_article", "com_content_category"];
  const BARE_LAYOUT_KINDS = ["com_content_article", "com_content_category", "menu_item", "com_tags_tag", "com_contact_contact", "user_profile", "advanced_route", "relative_url"];
  const METADATA_REQUIRED = ["com_content_article", "com_content_category", "menu_item", "com_tags_tag", "com_contact_contact", "relative_url", "user_profile", "advanced_route", "gallery"];
  const KINDS = {
    external_url: { l: "kind_external_url", g: "simple_links", m: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_link"], ["preview_modal", "action_open_in_popup"], ["toggle_view", "action_toggle_view"]] },
    anchor: { l: "kind_anchor", g: "simple_links", m: true, d: [["no_action", "action_no_action"], ["link_open", "action_jump_to_anchor"]] },
    email: { l: "kind_email", g: "simple_links", m: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_email_link"]] },
    phone: { l: "kind_phone", g: "simple_links", m: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_phone_link"]] },
    com_content_article: { l: "kind_article", g: "joomla_items", p: true, r: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_link"], ["preview_modal", "action_open_in_popup"], ["toggle_view", "action_toggle_view"]] },
    com_content_category: { l: "kind_category", g: "joomla_items", p: true, r: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_link"], ["preview_modal", "action_open_in_popup"], ["toggle_view", "action_toggle_view"]] },
    menu_item: { l: "kind_menu_item", g: "joomla_items", p: true, r: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_link"], ["toggle_view", "action_toggle_view"]] },
    com_tags_tag: { l: "kind_tags", g: "joomla_items", p: true, r: true, x: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_link"], ["toggle_view", "action_toggle_view"]] },
    com_contact_contact: { l: "kind_contact", g: "joomla_items", p: true, r: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_link"], ["preview_modal", "action_open_in_popup"], ["toggle_view", "action_toggle_view"]] },
    media_file: { l: "kind_media_file", g: "media", p: true, m: true, s: [["local", "source_media_library"], ["external", "source_web_address"]], d: [["no_action", "action_no_action"], ["link_open", "action_open_file"], ["link_download", "action_download_file"], ["preview_modal", "action_open_in_popup"], ["toggle_view", "action_toggle_view"]] },
    image: { l: "kind_image", g: "media", p: true, m: true, s: [["local", "source_media_library"], ["external", "source_web_address"]], d: [["no_action", "action_no_action"], ["link_open", "action_open_image"], ["preview_modal", "action_open_in_popup"], ["toggle_view", "action_toggle_view"]] },
    video: { l: "kind_video", g: "media", p: true, m: true, s: [["local", "source_media_library"], ["provider", "source_youtube_vimeo"], ["external", "source_direct_web_address"]], d: [["no_action", "action_no_action"], ["link_open", "action_open_video"], ["preview_modal", "action_open_in_popup"], ["toggle_view", "action_toggle_view"]] },
    gallery: { l: "kind_gallery", g: "media", p: true, m: true, r: true, x: true, s: [["local", "source_media_library"], ["external", "source_web_address"], ["provider", "source_youtube_vimeo"]], d: [["no_action", "action_no_action"], ["link_open", "action_open_items"], ["preview_modal", "action_open_items_in_popup"], ["toggle_view", "action_toggle_view"]] },
    relative_url: { l: "kind_relative_url", g: "advanced", m: true, r: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_link"], ["preview_modal", "action_open_in_popup"], ["toggle_view", "action_toggle_view"]] },
    user_profile: { l: "kind_user_profile", g: "advanced", m: true, r: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_link"], ["toggle_view", "action_toggle_view"]] },
    advanced_route: { l: "kind_joomla_path", g: "advanced", m: true, r: true, d: [["no_action", "action_no_action"], ["link_open", "action_open_link"], ["toggle_view", "action_toggle_view"]] }
  };
  const PREVIEW_FRAME_RESET_CSS = `
html {
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
}

html,
body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #1f2937;
}

body {
  min-height: 100vh;
  padding: 8px 10px;
}

figure {
  margin: 0;
}

img,
video {
  max-width: 100%;
  height: auto;
}
  `;
  const PREVIEW_FRAME_SMARTLINK_CSS = `
.smartlink-preview-root {
  display: block;
  text-align: left;
}

.smartlink-preview-root::after {
  content: "";
  display: block;
  clear: both;
}

.smartlink-preview-root > * {
  max-width: 100%;
}

.smartlink-preview-root--inline .smartlink-preview-placeholder-message,
.smartlink-preview-root--figure .smartlink-preview-placeholder-message {
  display: grid;
  justify-items: start;
  text-align: left;
}

.smartlink-preview-root--block .smartlink-preview-placeholder-message {
  display: grid;
  justify-items: center;
  text-align: center;
}

.smartlink-preview-root a {
  color: #0d6efd;
  text-decoration: underline;
  text-underline-offset: 0.14em;
}

.smartlink-preview-root .smartlink-view iframe {
  pointer-events: none;
}

.smartlink-preview-placeholder__text {
  display: inline;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #60758c;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.smartlink-preview-placeholder-message {
  color: #64748b;
}

.smartlink-preview-root .smartlink-thumb--empty > span {
  display: block;
}

.smartlink-preview-root .smartlink-thumb.smartlink-thumb--empty:not(.smartlink-thumb--top):not(.smartlink-thumb--bottom):not(.smartlink-thumb--left):not(.smartlink-thumb--right),
.smartlink-preview-root .smartlink-thumb--inline.smartlink-thumb--empty {
  inline-size: auto;
}

.smartlink-preview-root .smartlink-thumb--empty > .smartlink-image-empty {
  display: inline-block;
  inline-size: var(--smartlink-thumb-size);
  min-inline-size: var(--smartlink-thumb-size);
  min-block-size: 6.5rem;
}

.smartlink-preview-root .smartlink-thumb--empty.smartlink-thumb--sm > .smartlink-image-empty {
  min-block-size: 4.5rem;
}

.smartlink-preview-root .smartlink-thumb--empty.smartlink-thumb--md > .smartlink-image-empty {
  min-block-size: 6.5rem;
}

.smartlink-preview-root .smartlink-thumb--empty.smartlink-thumb--lg > .smartlink-image-empty {
  min-block-size: 8.75rem;
}

.smartlink-preview-root .smartlink-thumb--ratio-1-1.smartlink-thumb--empty > .smartlink-image-empty {
  aspect-ratio: 1 / 1;
  min-block-size: 0;
}

.smartlink-preview-root .smartlink-thumb--ratio-4-3.smartlink-thumb--empty > .smartlink-image-empty {
  aspect-ratio: 4 / 3;
  min-block-size: 0;
}

.smartlink-preview-root .smartlink-thumb--ratio-16-9.smartlink-thumb--empty > .smartlink-image-empty {
  aspect-ratio: 16 / 9;
  min-block-size: 0;
}

.smartlink-preview-placeholder__view {
  position: relative;
  display: block;
  width: min(100%, 760px);
  min-height: 160px;
  overflow: hidden;
  border: 1px dashed #b8c6d5;
  border-radius: 10px;
  background: #f8fafc;
}

.smartlink-preview-placeholder__view--frame::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, #e5ebf2 0, #e5ebf2 26px, transparent 26px),
    linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0)),
    linear-gradient(135deg, #dfe8f1 0%, #eef3f8 100%);
}

.smartlink-preview-placeholder__view--image {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0)),
    linear-gradient(135deg, #dfe8f1 0%, #eef3f8 100%);
}

.smartlink-preview-placeholder__view--gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 10px;
}

.smartlink-preview-placeholder__gallery-item {
  min-height: 58px;
  border: 1px dashed #b8c6d5;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0)),
    linear-gradient(135deg, #dfe8f1 0%, #eef3f8 100%);
}
  `;
  function previewFrameFallbackCss(context = {}) {
    const cssValue = (value, fallback) => {
      const cleaned = String(value || "").trim().replace(/[<>]/g, "");
      return cleaned || fallback;
    };

    return `
body {
  font-family: ${cssValue(context.font_family, 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif')};
  font-size: ${cssValue(context.font_size, "16px")};
  line-height: ${cssValue(context.line_height, "1.6")};
  color: ${cssValue(context.text_color, "#1f2937")};
}

a {
  color: #0d6efd;
  text-decoration: underline;
  text-underline-offset: 0.14em;
}
  `;
  }

  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function escapeStyleText(value) {
    return String(value || "").replace(/<\/style/gi, "<\\/style");
  }

  function parseJSON(raw, fallback) {
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function list(value, fallback = []) {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
      return value.split(/\s*,\s*/).filter(Boolean);
    }

    return fallback.slice();
  }

  function basename(value) {
    const parts = String(value || "").split(/[\\/]/);
    return parts[parts.length - 1] || "";
  }

  function normaliseJoomlaMediaValue(value) {
    const raw = String(value || "").trim();

    if (!raw) {
      return "";
    }

    const marker = "#joomlaImage://";
    const markerIndex = raw.indexOf(marker);

    if (markerIndex >= 0) {
      return raw.slice(0, markerIndex).trim();
    }

    return raw;
  }

  function hostOf(value) {
    try {
      return new URL(String(value || ""), window.location.origin).host.toLowerCase();
    } catch (error) {
      return "";
    }
  }

  function isProviderUrl(value) {
    const host = hostOf(value);
    return host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com");
  }

  function isUnsafeUrl(value) {
    return /^(javascript|data|vbscript):/i.test(String(value || "").trim());
  }

  function hasUrlScheme(value) {
    return /^[a-z][a-z0-9+.-]*:/i.test(String(value || "").trim());
  }

  function looksRelativePath(value) {
    return /^(\/|\.\/|\.\.\/|index\.php\?)/i.test(String(value || "").trim());
  }

  function looksHostLike(value) {
    const trimmed = String(value || "").trim().replace(/^\/\//, "");
    if (!trimmed || /\s/.test(trimmed)) {
      return false;
    }

    return /^localhost(?::\d+)?(?:\/|$)/i.test(trimmed)
      || /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/|$)/.test(trimmed)
      || /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?::\d+)?(?:\/|$)/i.test(trimmed);
  }

  function siteRootUrl() {
    try {
      return new URL(siteBasePath(), window.location.origin).toString();
    } catch (error) {
      return `${window.location.origin}/`;
    }
  }

  function isCurrentSiteHostname(hostname) {
    const current = String(window.location.hostname || "").toLowerCase();
    const host = String(hostname || "").toLowerCase();

    if (!host || !current) {
      return false;
    }

    if (host === current) {
      return true;
    }

    return host === `www.${current}` || current === `www.${host}`;
  }

  function toRelativeIfCurrentSite(rawValue) {
    try {
      const url = new URL(String(rawValue || "").trim(), siteRootUrl());
      if (!/^https?:$/i.test(url.protocol) || !isCurrentSiteHostname(url.hostname)) {
        return "";
      }
      const relative = `${url.pathname}${url.search}${url.hash}` || "/";
      return relative.startsWith("/") ? relative : `/${relative}`;
    } catch (error) {
      return "";
    }
  }

  function normaliseExternalUrl(value) {
    const raw = String(value || "").trim();

    if (!raw) {
      return { value: "", prefixed: false, internalLike: false };
    }

    if (isUnsafeUrl(raw) || hasUrlScheme(raw)) {
      return { value: raw, prefixed: false, internalLike: false };
    }

    const normalised = raw
      .replace(/^\/\//, "")
      .replace(/^(\.\/|\.\.\/)+/, "")
      .replace(/^[/?#]+/, "")
      .replace(/^\/+/, "");
    const looksNormalSiteUrl = looksHostLike(normalised);

    return {
      value: `https://${normalised}`,
      prefixed: true,
      internalLike: !looksNormalSiteUrl
    };
  }

  function normaliseRelativeLink(value) {
    const raw = String(value || "").trim();

    if (!raw) {
      return { value: "", converted: false, externalLike: false, rooted: false };
    }

    if (isUnsafeUrl(raw)) {
      return { value: raw, converted: false, externalLike: false, rooted: false };
    }

    if (hasUrlScheme(raw) || raw.startsWith("//") || looksHostLike(raw)) {
      const absoluteCandidate = hasUrlScheme(raw)
        ? raw
        : raw.startsWith("//")
          ? `${window.location.protocol}${raw}`
          : `https://${raw.replace(/^\/\//, "")}`;
      const relative = toRelativeIfCurrentSite(absoluteCandidate);

      if (relative) {
        return { value: relative, converted: true, externalLike: false, rooted: false };
      }

      return { value: raw, converted: false, externalLike: true, rooted: false };
    }

    if (/^(\/|\.\/|\.\.\/|index\.php\?|\?|#)/i.test(raw)) {
      return { value: raw, converted: false, externalLike: false, rooted: false };
    }

    return { value: `/${raw.replace(/^\/+/, "")}`, converted: false, externalLike: false, rooted: true };
  }

  function normaliseRelativeHref(value) {
    const raw = String(value || "").trim();

    if (!raw) {
      return "";
    }

    if (/^(\/|\.\/|\.\.\/|index\.php\?|\?|#)/i.test(raw)) {
      return raw;
    }

    return `/${raw.replace(/^\/+/, "")}`;
  }

  function normaliseAnchorCandidate(value) {
    const candidate = String(value || "").trim().replace(/^#/, "");

    if (!candidate || /\s/.test(candidate) || candidate.length > 120) {
      return "";
    }

    return candidate;
  }

  function extractAnchorsFromHtml(html) {
    if (!html) {
      return [];
    }

    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    const values = [];

    template.content.querySelectorAll("[id]").forEach((node) => {
      values.push(node.getAttribute("id") || "");
    });

    template.content.querySelectorAll("a[name]").forEach((node) => {
      values.push(node.getAttribute("name") || "");
    });

    return values;
  }

  function collectAnchorSuggestions(config) {
    const suggestions = new Set();
    const push = (value) => {
      const candidate = normaliseAnchorCandidate(value);
      if (candidate) {
        suggestions.add(candidate);
      }
    };

    list(config.anchor_suggestions, []).forEach(push);

    const editorTextarea = document.querySelector("textarea#jform_articletext, textarea[name='jform[articletext]']");
    if (editorTextarea?.value) {
      extractAnchorsFromHtml(editorTextarea.value).forEach(push);
    }

    try {
      const editorIframe = document.querySelector("iframe#jform_articletext_ifr");
      const iframeHtml = editorIframe?.contentDocument?.body?.innerHTML || "";
      if (iframeHtml) {
        extractAnchorsFromHtml(iframeHtml).forEach(push);
      }
    } catch (error) {
    }

    return Array.from(suggestions).slice(0, 80);
  }

  function looksLikeVideo(value) {
    return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(String(value || "").trim()) || isProviderUrl(value);
  }

  function isStructuredContentKind(kind) {
    return STRUCTURED_CONTENT_KINDS.includes(kind);
  }

  function booleanValue(value, fallback = false) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalised = value.trim().toLowerCase();
      if (["1", "true", "yes", "on"].includes(normalised)) {
        return true;
      }
      if (["0", "false", "no", "off", ""].includes(normalised)) {
        return false;
      }
    }

    return fallback;
  }

  function normaliseOptionValue(value, options, fallback) {
    const requested = String(value || "").trim();
    return options.some((option) => option[0] === requested) ? requested : fallback;
  }

  function normaliseThumbnailEmptyMode(value) {
    return normaliseOptionValue(value, THUMBNAIL_EMPTY_MODES, "generic");
  }

  function normaliseThumbnailRatio(value) {
    return normaliseOptionValue(value, THUMBNAIL_RATIOS, "auto");
  }

  function normaliseOptionalThumbnailRatio(value) {
    const requested = String(value || "").trim();
    return requested === "" || requested === "inherit" ? "" : normaliseThumbnailRatio(requested);
  }

  function normaliseThumbnailPosition(value) {
    return normaliseOptionValue(value, THUMBNAIL_POSITIONS, "inline");
  }

  function normaliseOptionalThumbnailPosition(value) {
    const requested = String(value || "").trim();
    return requested === "" || requested === "inherit" ? "" : normaliseThumbnailPosition(requested);
  }

  function normaliseThumbnailFit(value) {
    return normaliseOptionValue(value, THUMBNAIL_FITS, "cover");
  }

  function normaliseOptionalThumbnailFit(value) {
    const requested = String(value || "").trim();
    return requested === "" || requested === "inherit" ? "" : normaliseThumbnailFit(requested);
  }

  function normaliseThumbnailSize(value) {
    return normaliseOptionValue(value, THUMBNAIL_SIZES, "md");
  }

  function normaliseOptionalThumbnailSize(value) {
    const requested = String(value || "").trim();
    return requested === "" || requested === "inherit" ? "" : normaliseThumbnailSize(requested);
  }

  function normaliseConfiguredThumbnailPosition(value) {
    const requested = String(value || "").trim();
    return requested === "inherit" ? "inherit" : normaliseThumbnailPosition(requested);
  }

  function normaliseConfiguredThumbnailRatio(value) {
    const requested = String(value || "").trim();
    return requested === "inherit" ? "inherit" : normaliseThumbnailRatio(requested);
  }

  function normaliseConfiguredThumbnailFit(value) {
    const requested = String(value || "").trim();
    return requested === "inherit" ? "inherit" : normaliseThumbnailFit(requested);
  }

  function normaliseConfiguredThumbnailSize(value) {
    const requested = String(value || "").trim();
    return requested === "inherit" ? "inherit" : normaliseThumbnailSize(requested);
  }

  function normaliseThumbnailEmptyClass(value) {
    return String(value || "").trim() || DEFAULT_THUMBNAIL_EMPTY_CLASS;
  }

  function withInheritOption(options) {
    return [["", "keep_defaults"], ...options];
  }

  function hasThumbnailLayoutOverride(source = {}) {
    return booleanValue(
      source.thumbnail_override,
      Boolean(
        normaliseOptionalThumbnailPosition(source.thumbnail_position)
        || normaliseOptionalThumbnailRatio(source.thumbnail_ratio)
        || normaliseOptionalThumbnailFit(source.thumbnail_fit)
        || normaliseOptionalThumbnailSize(source.thumbnail_size)
      )
    );
  }

  function useSmartlinkStyles(config) {
    const value = config?.use_smartlink_styles;

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    const raw = String(value ?? "").trim().toLowerCase();

    if (!raw) {
      return true;
    }

    return !["0", "false", "no", "off"].includes(raw);
  }

  function splitClassNames(value) {
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function linkButtonClassNames(configOrState = {}) {
    const source = configOrState && typeof configOrState === "object" ? configOrState : {};
    if (useSmartlinkStyles(source)) {
      return [DEFAULT_LINK_BUTTON_CLASS];
    }

    const raw = Object.prototype.hasOwnProperty.call(source, "link_button_class")
      ? String(source.link_button_class || "").trim()
      : DEFAULT_LINK_BUTTON_CLASS;

    return splitClassNames(raw || DEFAULT_LINK_BUTTON_CLASS);
  }

  function thumbnailClassMappings(configOrState = {}) {
    const source = configOrState && typeof configOrState === "object" && configOrState._thumbnail_class_mappings
      ? configOrState._thumbnail_class_mappings
      : configOrState;
    const useDefaults = useSmartlinkStyles(configOrState);
    const read = (key, fallback) => {
      if (useDefaults) {
        return fallback;
      }

      if (source && Object.prototype.hasOwnProperty.call(source, key)) {
        return String(source[key] || "").trim();
      }

      return fallback;
    };

    return {
      position: {
        inline: read("thumbnail_position_class_inline", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.position.inline),
        top: read("thumbnail_position_class_top", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.position.top),
        bottom: read("thumbnail_position_class_bottom", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.position.bottom),
        left: read("thumbnail_position_class_left", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.position.left),
        right: read("thumbnail_position_class_right", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.position.right)
      },
      ratio: {
        auto: read("thumbnail_ratio_class_auto", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.ratio.auto),
        "1-1": read("thumbnail_ratio_class_1_1", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.ratio["1-1"]),
        "4-3": read("thumbnail_ratio_class_4_3", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.ratio["4-3"]),
        "16-9": read("thumbnail_ratio_class_16_9", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.ratio["16-9"])
      },
      fit: {
        cover: read("thumbnail_fit_class_cover", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.fit.cover),
        contain: read("thumbnail_fit_class_contain", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.fit.contain),
        fill: read("thumbnail_fit_class_fill", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.fit.fill),
        none: read("thumbnail_fit_class_none", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.fit.none),
        "scale-down": read("thumbnail_fit_class_scale_down", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.fit["scale-down"])
      },
      size: {
        sm: read("thumbnail_size_class_sm", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.size.sm),
        md: read("thumbnail_size_class_md", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.size.md),
        lg: read("thumbnail_size_class_lg", DEFAULT_THUMBNAIL_CLASS_MAPPINGS.size.lg)
      }
    };
  }

  function mappedThumbnailClasses(configOrState, group, value) {
    const mappings = thumbnailClassMappings(configOrState);
    return splitClassNames(mappings[group]?.[value] || "");
  }

  function kindCapabilities(kind) {
    const base = {
      icon: { mode: "available", default: false },
      image: { mode: "available", default: false },
      text: { mode: "available", default: true },
      displayInside: { mode: "available", default: false },
      summary: false,
      typeLabel: false,
      imageOverride: true,
      popupScope: supportsBareLayout(kind)
    };

    switch (kind) {
      case "com_content_article":
      case "com_content_category":
        return {
          ...base,
          image: { mode: "available", default: false },
          summary: true,
          typeLabel: true,
          imageOverride: true
        };
      case "com_contact_contact":
        return {
          ...base,
          image: { mode: "available", default: false },
          summary: true,
          typeLabel: true,
          imageOverride: true
        };
      case "anchor":
      case "email":
      case "phone":
        return {
          ...base,
          displayInside: { mode: "fixed_off", default: false }
        };
      case "menu_item":
      case "com_tags_tag":
      case "user_profile":
      case "advanced_route":
      case "external_url":
      case "relative_url":
        return base;
      case "media_file":
        return {
          ...base,
          icon: { mode: "available", default: true },
          displayInside: { mode: "available", default: false },
          text: { mode: "available", default: true },
          typeLabel: true,
          imageOverride: true
        };
      case "image":
        return {
          ...base,
          image: { mode: "available", default: true },
          icon: { mode: "available", default: false },
          text: { mode: "available", default: false },
          displayInside: { mode: "available", default: true },
          imageOverride: true
        };
      case "video":
        return {
          ...base,
          image: { mode: "available", default: false },
          icon: { mode: "available", default: false },
          text: { mode: "available", default: false },
          displayInside: { mode: "available", default: false },
          typeLabel: true,
          imageOverride: true
        };
      case "gallery":
        return {
          ...base,
          icon: { mode: "hidden", default: false },
          image: { mode: "fixed", default: true },
          text: { mode: "hidden", default: false },
          displayInside: { mode: "fixed", default: true },
          imageOverride: false
        };
      default:
        return base;
    }
  }

  function resolveToggleCapability(kind, key) {
    return kindCapabilities(kind)[key] || { mode: "hidden", default: false };
  }

  function resolveToggleState(kind, key, value) {
    const capability = resolveToggleCapability(kind, key);

    if (capability.mode === "fixed") {
      return true;
    }

    if (capability.mode === "hidden" || capability.mode === "fixed_off") {
      return false;
    }

    return booleanValue(value, capability.default);
  }

  function isToggleVisible(kind, key) {
    return resolveToggleCapability(kind, key).mode !== "hidden";
  }

  function isToggleFixed(kind, key) {
    const mode = resolveToggleCapability(kind, key).mode;
    return mode === "fixed" || mode === "fixed_off";
  }

  function isToggleDisabled(kind, key) {
    return resolveToggleCapability(kind, key).mode !== "available";
  }

  function normaliseStructure(value) {
    const requested = String(value || "").trim();
    return STRUCTURES.some((option) => option[0] === requested) ? requested : "inline";
  }

  function normaliseViewPosition(value) {
    const requested = String(value || "").trim();
    return VIEW_POSITIONS.some((option) => option[0] === requested) ? requested : "after";
  }

  function allowsDisplayInside(kind) {
    return isToggleVisible(kind, "displayInside");
  }

  function allowsSummary(kind) {
    return Boolean(kindCapabilities(kind).summary);
  }

  function allowsTypeLabel(kind) {
    return Boolean(kindCapabilities(kind).typeLabel);
  }

  function allowsImageOverride(kind) {
    return Boolean(kindCapabilities(kind).imageOverride);
  }

  function canClickViewOnPage(kind) {
    return kind === "image";
  }

  function clickStateKey(part) {
    switch (part) {
      case "icon":
        return "click_icon";
      case "text":
        return "click_text";
      case "thumbnail":
        return "click_image";
      case "view":
        return "click_view";
      default:
        return "";
    }
  }

  function isClickPartVisible(state, part) {
    switch (part) {
      case "icon":
        return Boolean(state.show_icon);
      case "text":
        return Boolean(state.show_text) && state.kind !== "gallery";
      case "thumbnail":
        return Boolean(state.show_image);
      case "view":
        return Boolean(state.display_inside) && canClickViewOnPage(state.kind);
      default:
        return false;
    }
  }

  function clickParts(state) {
    return ["icon", "text", "thumbnail", "view"].filter((part) => isClickPartVisible(state, part));
  }

  function defaultClickPart(state) {
    for (const part of ["text", "thumbnail", "icon", "view"]) {
      if (isClickPartVisible(state, part)) {
        return part;
      }
    }

    return "";
  }

  function clickPartCount(state) {
    return clickParts(state).reduce((count, part) => count + (state[clickStateKey(part)] ? 1 : 0), 0);
  }

  function isClickPartLocked(state, part) {
    return Boolean(state.click_individual_parts) && state[clickStateKey(part)] && clickPartCount(state) <= 1;
  }

  function normaliseClickState(state) {
    if (state.action === "no_action") {
      state.click_individual_parts = false;
      state.click_icon = false;
      state.click_text = false;
      state.click_image = false;
      state.click_view = false;

      return state;
    }

    if (state.action === "toggle_view") {
      state.click_view = false;
    }

    state.click_individual_parts = booleanValue(state.click_individual_parts);
    state.click_icon = state.click_individual_parts && isClickPartVisible(state, "icon") ? booleanValue(state.click_icon) : false;
    state.click_text = state.click_individual_parts && isClickPartVisible(state, "text") ? booleanValue(state.click_text) : false;
    state.click_image = state.click_individual_parts && isClickPartVisible(state, "thumbnail") ? booleanValue(state.click_image) : false;
    state.click_view = state.click_individual_parts && isClickPartVisible(state, "view") ? booleanValue(state.click_view) : false;

    if (!state.click_individual_parts) {
      return state;
    }

    if (!clickParts(state).length) {
      state.click_individual_parts = false;
      state.click_icon = false;
      state.click_text = false;
      state.click_image = false;
      state.click_view = false;

      return state;
    }

    if (!state.click_icon && !state.click_text && !state.click_image && !state.click_view) {
      const fallback = defaultClickPart(state);

      if (fallback) {
        state[clickStateKey(fallback)] = true;
      }
    }

    return state;
  }

  function isStaticAction(action) {
    return action === "no_action";
  }

  function wrapperTagForAction(action, fallbackTag = "span") {
    if (action === "toggle_view") {
      return "button";
    }

    return isStaticAction(action) ? fallbackTag : "a";
  }

  function defaultIconClass(kind) {
    switch (kind) {
      case "anchor":
        return "fa-solid fa-thumbtack";
      case "email":
        return "fa-solid fa-envelope";
      case "phone":
        return "fa-solid fa-phone";
      case "com_content_article":
        return "fa-regular fa-newspaper";
      case "com_content_category":
        return "fa-regular fa-folder-open";
      case "menu_item":
        return "fa-solid fa-sitemap";
      case "com_tags_tag":
        return "fa-solid fa-tags";
      case "com_contact_contact":
      case "user_profile":
        return "fa-regular fa-user";
      case "media_file":
        return "fa-regular fa-file-lines";
      case "image":
        return "fa-regular fa-image";
      case "video":
        return "fa-solid fa-video";
      case "gallery":
        return "fa-regular fa-images";
      case "advanced_route":
        return "fa-solid fa-route";
      case "external_url":
        return "fa-solid fa-arrow-up-right-from-square";
      case "relative_url":
        return "fa-solid fa-link";
      default:
        return "fa-solid fa-link";
    }
  }

  function iconClassName(value, kind = "") {
    return String(value || "").trim() || defaultIconClass(kind);
  }

  function iconStylesheetUrls(config) {
    return Array.from(new Set(
      [String(config?.icon_stylesheet_url || DEFAULT_ICON_STYLESHEET_URL).trim()]
        .map((href) => absolutePreviewAssetUrl(href, siteRootUrl()))
        .filter(Boolean)
    ));
  }

  function ensureBuilderStylesheet(href, marker, onLoad = null) {
    const absoluteHref = absolutePreviewAssetUrl(href, siteRootUrl());

    if (!absoluteHref || !document.head) {
      return;
    }

    const existing = document.head.querySelector(`link[rel="stylesheet"][${marker}]`);

    if (existing) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = absoluteHref;
    link.setAttribute(marker, absoluteHref);

    if (typeof onLoad === "function") {
      link.addEventListener("load", () => onLoad(absoluteHref), { once: true });
    }

    document.head.appendChild(link);
  }

  function ensureBuilderIconStylesheet(config, onLoad = null) {
    iconStylesheetUrls(config).forEach((href) => {
      ensureBuilderStylesheet(href, "data-smartlink-builder-icon-stylesheet", onLoad);
    });
  }

  function extractIconSuggestionFromSelector(selector) {
    const text = String(selector || "").trim();

    if (!text || !/::?before\b/i.test(text)) {
      return "";
    }

    const classes = Array.from(text.matchAll(/\.([_a-zA-Z][-_a-zA-Z0-9]*)/g), (match) => String(match[1] || "").trim())
      .filter((value) => value.startsWith("fa-"));

    if (!classes.length) {
      return "";
    }

    const iconToken = classes.find((token) => !ICON_STYLE_TOKENS.has(token));

    if (!iconToken) {
      return "";
    }

    const styleGroup = ICON_STYLE_GROUPS.find((group) => group.every((token) => classes.includes(token))) || ["fa-solid"];

    return `${styleGroup.join(" ")} ${iconToken}`.trim();
  }

  function collectIconSuggestionsFromRules(rules, suggestions) {
    Array.from(rules || []).forEach((rule) => {
      if (!rule) {
        return;
      }

      if (rule.selectorText) {
        String(rule.selectorText)
          .split(",")
          .map((selector) => extractIconSuggestionFromSelector(selector))
          .filter(Boolean)
          .forEach((value) => suggestions.add(value));
      }

      if (rule.cssRules?.length) {
        collectIconSuggestionsFromRules(rule.cssRules, suggestions);
      } else if (rule.styleSheet?.cssRules?.length) {
        collectIconSuggestionsFromRules(rule.styleSheet.cssRules, suggestions);
      }
    });
  }

  function resolveIconSuggestions(config) {
    const urls = iconStylesheetUrls(config);
    const cacheKey = urls.join("|") || "__default__";

    if (ICON_SUGGESTION_CACHE.has(cacheKey)) {
      return ICON_SUGGESTION_CACHE.get(cacheKey).slice();
    }

    const curated = Array.from(new Set(CURATED_ICON_SUGGESTIONS));
    const suggestions = new Set(curated);
    const targets = new Set(urls);

    Array.from(document.styleSheets || []).forEach((sheet) => {
      let href = "";

      try {
        href = absolutePreviewAssetUrl(sheet?.href || "", siteRootUrl());
      } catch (error) {
        href = "";
      }

      if (!href || !targets.has(href)) {
        return;
      }

      try {
        collectIconSuggestionsFromRules(sheet.cssRules || [], suggestions);
      } catch (error) {
      }
    });

    const ordered = [
      ...curated,
      ...Array.from(suggestions).filter((value) => !curated.includes(value)).sort((a, b) => a.localeCompare(b))
    ];

    ICON_SUGGESTION_CACHE.set(cacheKey, ordered);

    return ordered.slice();
  }

  function imagePreviewUrl(value) {
    const normalised = normaliseJoomlaMediaValue(value);

    if (!normalised) {
      return "";
    }

    return previewUrl(normalised);
  }

  function imageFieldPreview(state, fieldName) {
    if (fieldName === "image_override") {
      return imagePreviewUrl(state.image_override || imageSource({ ...state, image_override: "" }));
    }

    if (fieldName === "preview_image") {
      return imagePreviewUrl(state.preview_image || state.selection_image || imageSource({ ...state, image_override: "" }));
    }

    if (fieldName === "video_poster") {
      return imagePreviewUrl(state.video?.poster || state.selection_image || state.preview_image || "");
    }

    return "";
  }

  function filterIconSuggestions(config, query) {
    const normalisedQuery = String(query || "").trim().toLowerCase();
    const suggestions = resolveIconSuggestions(config);

    if (!normalisedQuery) {
      return suggestions.slice(0, 12);
    }

    const direct = [];
    const contains = [];

    suggestions.forEach((suggestion) => {
      const lower = suggestion.toLowerCase();
      if (lower.startsWith(normalisedQuery)) {
        direct.push(suggestion);
      } else if (lower.includes(normalisedQuery)) {
        contains.push(suggestion);
      }
    });

    return direct.concat(contains).slice(0, 12);
  }

  function inputId(config, suffix) {
    const base = String(config?.instance_id || "smartlink").replace(/[^a-z0-9_-]+/gi, "-");
    return `${base}-${suffix}`;
  }

  function filterIconSuggestions(query, suggestions, activeValue = "", limit = 12) {
    const needle = String(query || "").trim().toLowerCase();
    const active = String(activeValue || "").trim();
    const values = Array.isArray(suggestions) ? suggestions.slice() : [];

    if (!needle) {
      return values
        .filter((value) => String(value || "").trim() !== active)
        .slice(0, limit);
    }

    const scored = values
      .map((value) => {
        const text = String(value || "").trim();
        const lower = text.toLowerCase();
        let score = 999;

        if (!text || text === active) {
          return null;
        }

        if (lower === needle) {
          score = 0;
        } else if (lower.startsWith(needle)) {
          score = 1;
        } else if (lower.includes(` ${needle}`)) {
          score = 2;
        } else if (lower.includes(needle)) {
          score = 3;
        } else {
          return null;
        }

        return { text, score };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || a.text.localeCompare(b.text))
      .slice(0, limit);

    return scored.map((entry) => entry.text);
  }

  function supportsBareLayout(kind) {
    return BARE_LAYOUT_KINDS.includes(String(kind || ""));
  }

  function supportsContentOnlyLayout(kind) {
    return String(kind || "") === "com_content_article";
  }

  function normalisePopupScope(kind, value) {
    if (!supportsBareLayout(kind)) {
      return "";
    }

    const allowed = supportsContentOnlyLayout(kind)
      ? ["component", "content", "page"]
      : ["component", "page"];

    return allowed.includes(value) ? value : "component";
  }

  function contentPopupScopes(kind) {
    if (!supportsBareLayout(kind)) {
      return [];
    }

    return [
      ["component", ui("page_display_only_component")],
      ...(supportsContentOnlyLayout(kind) ? [["content", ui("page_display_bare_content_only")]] : []),
      ["page", ui("page_display_with_site_layout")]
    ];
  }

  function applyPopupScopeToHref(href, payload) {
    const value = String(href || "").trim();

    if (!value || !supportsBareLayout(payload.kind) || (payload.action !== "preview_modal" && payload.action !== "toggle_view" && !payload.display_inside)) {
      return value || "#";
    }

    const scope = String(payload.popup_scope || "component").trim() || "component";
    try {
      const url = new URL(value, siteRootUrl());

      if (scope === "component" || scope === "content") {
        url.searchParams.set("tmpl", "component");
      } else if (url.searchParams.get("tmpl") === "component") {
        url.searchParams.delete("tmpl");
      }

      if (scope === "content") {
        url.searchParams.set("smartlink", "content");
      } else if (url.searchParams.get("smartlink") === "content") {
        url.searchParams.delete("smartlink");
      }

      if (/^(?:https?:)?\/\//i.test(value)) {
        return url.toString();
      }

      return `${url.pathname}${url.search}${url.hash}` || "#";
    } catch (error) {
      let next = value
        .replace(/([?&])tmpl=component(?=(&|#|$))/gi, "$1")
        .replace(/([?&])smartlink=content(?=(&|#|$))/gi, "$1")
        .replace(/[?&]$/, "")
        .replace(/\?&/, "?");

      if (scope === "component" || scope === "content") {
        next = `${next}${next.includes("?") ? "&" : "?"}tmpl=component`;
      }

      if (scope === "content") {
        next = `${next}${next.includes("?") ? "&" : "?"}smartlink=content`;
      }

      return next || "#";
    }
  }

  function ui(key, fallback = "") {
    return String(ACTIVE_UI_STRINGS[key] ?? DEFAULT_UI_STRINGS[key] ?? fallback ?? key);
  }

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function uiFormat(key, replacements = {}, fallback = "") {
    let text = ui(key, fallback);

    Object.entries(replacements || {}).forEach(([token, value]) => {
      text = text.replace(new RegExp(`\\{${escapeRegExp(token)}\\}`, "g"), String(value ?? ""));
    });

    return text;
  }

  function uiOptionLabel(option) {
    return ui(option?.[1], option?.[1] || "");
  }

  function applyUiStrings(config = {}) {
    const strings = config?.ui_strings && typeof config.ui_strings === "object"
      ? config.ui_strings
      : {};

    ACTIVE_UI_STRINGS = {
      ...DEFAULT_UI_STRINGS,
      ...strings
    };
    config.ui_strings = ACTIVE_UI_STRINGS;

    return config;
  }

  function shouldDeferViewMedia(payload) {
    return payload.action === "toggle_view" && !payload.display_inside;
  }

  function mediaSourceAttributes(payload, src, tag = "iframe") {
    const value = String(src || "").trim();

    if (!value) {
      return "";
    }

    if (shouldDeferViewMedia(payload)) {
      return `data-src="${esc(value)}"`;
    }

    if (tag === "img") {
      return `src="${esc(value)}" loading="lazy"`;
    }

    return `src="${esc(value)}"`;
  }

  function iframeViewContainerExtra(src, allowFullscreen = false, extra = {}) {
    const attrs = { ...(extra || {}) };
    const value = String(src || "").trim();

    if (!value) {
      return attrs;
    }

    attrs["data-src"] = value;
    attrs["data-embed"] = "iframe";

    if (allowFullscreen) {
      attrs["data-allowfullscreen"] = "1";
    }

    return attrs;
  }

  function rootRelativeIndexHref(query) {
    const value = String(query || "").trim().replace(/^\/+/, "");

    if (!value) {
      return "#";
    }

    return `${siteBasePath()}${value}`;
  }

  function structuredContentHref(payload) {
    const id = encodeURIComponent(String(payload.value || "").trim());

    if (!id) {
      return "#";
    }

    const href = payload.kind === "com_content_category"
      ? rootRelativeIndexHref(`index.php?option=com_content&view=category&id=${id}`)
      : rootRelativeIndexHref(`index.php?option=com_content&view=article&id=${id}`);

    return applyPopupScopeToHref(href, payload);
  }

  function meta(kind) {
    const current = KINDS[kind];

    if (!current) {
      return { l: kind, g: "advanced", m: true, d: [["link_open", ui("action_open_link")]] };
    }

    return {
      ...current,
      l: ui(current.l, current.l),
      d: Array.isArray(current.d)
        ? current.d.map((entry) => [entry[0], ui(entry[1], entry[1])])
        : [],
      s: Array.isArray(current.s)
        ? current.s.map((entry) => [entry[0], ui(entry[1], entry[1])])
        : []
    };
  }

  function kindTypeLabel(kind) {
    return meta(kind).l || ui("generic_item");
  }

  function normaliseContentState(state) {
    state.show_icon = resolveToggleState(state.kind, "icon", state.show_icon);
    state.show_image = resolveToggleState(state.kind, "image", state.show_image);
    state.show_text = resolveToggleState(state.kind, "text", state.show_text);
    state.display_inside = resolveToggleState(state.kind, "displayInside", state.display_inside);
    state.thumbnail_override = hasThumbnailLayoutOverride(state);
    state.structure = normaliseStructure(state.structure);
    state.view_position = normaliseViewPosition(state.view_position);
    const richStructure = state.structure !== "inline";
    state.show_summary = richStructure && allowsSummary(state.kind) ? booleanValue(state.show_summary) : false;
    state.show_type_label = richStructure && allowsTypeLabel(state.kind) ? booleanValue(state.show_type_label) : false;
    state.figure_caption_text = state.structure === "figure" ? booleanValue(state.figure_caption_text) : false;

    if (!allowsImageOverride(state.kind)) {
      state.image_override = "";
    }

    if (state.kind === "gallery") {
      state.show_icon = false;
      state.show_image = true;
      state.show_text = false;
    }

    if (state.action === "preview_modal") {
      state.display_inside = false;
    }

    if (state.action === "toggle_view" && resolveToggleCapability(state.kind, "displayInside").mode !== "hidden") {
      state.click_view = false;
    }

    if ((!state.display_inside || state.action === "toggle_view") && !state.show_icon && !state.show_image && !state.show_text) {
      const fallbackKeys = state.kind === "image" ? ["image", "text", "icon"] : ["text", "image", "icon"];

      for (const key of fallbackKeys) {
        if (isToggleVisible(state.kind, key)) {
          state[`show_${key}`] = true;
          break;
        }
      }
    }

    return normaliseClickState(state);
  }

  function effectiveAllowedActions(config) {
    const allowed = list(config.allowed_actions, ACTIONS);

    if (!allowed.includes("toggle_view")) {
      const looksLegacyDefault = allowed.length === LEGACY_DEFAULT_ACTIONS.length
        && LEGACY_DEFAULT_ACTIONS.every((action) => allowed.includes(action));

      if (looksLegacyDefault) {
        return [...allowed, "toggle_view"];
      }
    }

    return allowed;
  }

  function modes(config, kind) {
    const allowed = effectiveAllowedActions(config);
    const available = (meta(kind).d || []).filter((mode) => allowed.includes(mode[0]));

    return available.length ? available : [[allowed[0] || "link_open", "Open link"]];
  }

  function defaultAction(config, kind) {
    const available = modes(config, kind);
    if (available.some((mode) => mode[0] === config.default_action)) {
      return config.default_action;
    }

    return available[0][0];
  }

  function defaultSource(kind, requested = "") {
    const sources = meta(kind).s || [];
    if (!sources.length) {
      return "";
    }

    if (sources.some((source) => source[0] === requested)) {
      return requested;
    }

    return sources[0][0];
  }

  function normaliseImplicitFieldValues(state) {
    const label = String(state.label || "").trim();
    const labelDefault = String(labelHint(state) || "").trim();

    if (label && labelDefault && label === labelDefault) {
      state.label = "";
    }

    const iconClass = String(state.icon_class || "").trim();
    if (iconClass && iconClass === defaultIconClass(state.kind)) {
      state.icon_class = "";
    }

    const downloadFilename = String(state.download_filename || "").trim();
    const downloadDefault = String(downloadFilenameHint(state) || "").trim();
    if (downloadFilename && downloadDefault && downloadFilename === downloadDefault) {
      state.download_filename = "";
    }

    const previewAlt = String(state.preview_alt || "").trim();
    const previewAltDefault = String(altHint(state) || "").trim();
    if (previewAlt && previewAltDefault && previewAlt === previewAltDefault) {
      state.preview_alt = "";
    }

    const thumbEmptyClass = String(state.thumbnail_empty_class || "").trim();
    const thumbEmptyDefault = String(defaultThumbnailEmptyClass(state) || "").trim();
    if (state._thumbnail_defaults?.empty_mode !== "specific") {
      state.thumbnail_empty_class = "";
    } else if (thumbEmptyClass && thumbEmptyDefault && thumbEmptyClass === thumbEmptyDefault) {
      state.thumbnail_empty_class = "";
    }

    state.thumbnail_override = hasThumbnailLayoutOverride(state);
    state.thumbnail_position = normaliseOptionalThumbnailPosition(state.thumbnail_position);
    state.thumbnail_ratio = normaliseOptionalThumbnailRatio(state.thumbnail_ratio);
    state.thumbnail_fit = normaliseOptionalThumbnailFit(state.thumbnail_fit);
    state.thumbnail_size = normaliseOptionalThumbnailSize(state.thumbnail_size);

    return state;
  }

  function thumbnailDefaults(config) {
    const positionRaw = normaliseConfiguredThumbnailPosition(config.thumbnail_position);
    const ratioRaw = normaliseConfiguredThumbnailRatio(config.thumbnail_ratio);
    const fitRaw = normaliseConfiguredThumbnailFit(config.thumbnail_fit);
    const sizeRaw = normaliseConfiguredThumbnailSize(config.thumbnail_size);

    return {
      empty_mode: normaliseThumbnailEmptyMode(config.thumbnail_empty_mode),
      empty_class: normaliseThumbnailEmptyClass(config.thumbnail_empty_class),
      position_raw: positionRaw,
      ratio_raw: ratioRaw,
      fit_raw: fitRaw,
      size_raw: sizeRaw,
      position: positionRaw === "inherit" ? GLOBAL_THUMBNAIL_DEFAULTS.position : positionRaw,
      ratio: ratioRaw === "inherit" ? GLOBAL_THUMBNAIL_DEFAULTS.ratio : ratioRaw,
      fit: fitRaw === "inherit" ? GLOBAL_THUMBNAIL_DEFAULTS.fit : fitRaw,
      size: sizeRaw === "inherit" ? GLOBAL_THUMBNAIL_DEFAULTS.size : sizeRaw
    };
  }

  function defaultThumbnailEmptyClass(stateOrConfig) {
    const source = stateOrConfig && stateOrConfig._thumbnail_defaults
      ? stateOrConfig._thumbnail_defaults
      : thumbnailDefaults(stateOrConfig || {});

    return normaliseThumbnailEmptyClass(source.empty_class);
  }

  function effectiveThumbnailSettings(configOrState, payloadLike = null) {
    const defaults = payloadLike
      ? thumbnailDefaults(configOrState || {})
      : (configOrState?._thumbnail_defaults || thumbnailDefaults(configOrState || {}));
    const payload = payloadLike || configOrState || {};
    const mode = normaliseThumbnailEmptyMode(defaults.empty_mode);
    const allowSpecificOverride = mode === "specific";
    const override = hasThumbnailLayoutOverride(payload);
    const positionOverride = normaliseOptionalThumbnailPosition(payload.thumbnail_position);
    const ratioOverride = normaliseOptionalThumbnailRatio(payload.thumbnail_ratio);
    const fitOverride = normaliseOptionalThumbnailFit(payload.thumbnail_fit);
    const sizeOverride = normaliseOptionalThumbnailSize(payload.thumbnail_size);

    return {
      mode,
      emptyClass: allowSpecificOverride
        ? normaliseThumbnailEmptyClass(payload.thumbnail_empty_class || defaults.empty_class)
        : normaliseThumbnailEmptyClass(defaults.empty_class),
      override,
      position: override ? (positionOverride || GLOBAL_THUMBNAIL_DEFAULTS.position) : defaults.position,
      ratio: override ? (ratioOverride || GLOBAL_THUMBNAIL_DEFAULTS.ratio) : defaults.ratio,
      fit: override ? (fitOverride || GLOBAL_THUMBNAIL_DEFAULTS.fit) : defaults.fit,
      size: override ? (sizeOverride || GLOBAL_THUMBNAIL_DEFAULTS.size) : defaults.size,
      emitPosition: override ? positionOverride !== "" : defaults.position !== GLOBAL_THUMBNAIL_DEFAULTS.position,
      emitRatio: override ? ratioOverride !== "" : defaults.ratio !== GLOBAL_THUMBNAIL_DEFAULTS.ratio,
      emitFit: override ? fitOverride !== "" : defaults.fit !== GLOBAL_THUMBNAIL_DEFAULTS.fit,
      emitSize: override ? sizeOverride !== "" : defaults.size !== GLOBAL_THUMBNAIL_DEFAULTS.size
    };
  }

  function thumbnailClassNames(configOrState, settings, empty = false) {
    return [
      "smartlink-thumb",
      ...(settings.emitSize ? mappedThumbnailClasses(configOrState, "size", settings.size) : []),
      ...(settings.emitPosition ? mappedThumbnailClasses(configOrState, "position", settings.position) : []),
      ...(settings.emitRatio ? mappedThumbnailClasses(configOrState, "ratio", settings.ratio) : []),
      ...(settings.emitFit ? mappedThumbnailClasses(configOrState, "fit", settings.fit) : []),
      empty ? "smartlink-thumb--empty" : ""
    ].filter(Boolean);
  }

  function thumbnailMarkup(configOrState, payloadLike = null, explicitText = "") {
    const payload = payloadLike || configOrState || {};
    const settings = payloadLike
      ? effectiveThumbnailSettings(configOrState, payload)
      : effectiveThumbnailSettings(configOrState);
    const text = explicitText || primaryText(payload);
    const src = imageSource(payload);
    const classes = thumbnailClassNames(configOrState, settings, !src);
    if (src) {
      return `<span class="${esc(classes.join(" "))}"><img src="${esc(src)}" alt="${esc(imageAlt(payload, text))}" loading="lazy"></span>`;
    }

    if (settings.mode === "empty") {
      return `<span class="${esc(classes.join(" "))}"></span>`;
    }

    return `<span class="${esc(classes.join(" "))}"><span class="${esc(settings.emptyClass)}" aria-hidden="true"></span></span>`;
  }

  function captureCommonPreferences(state) {
    return {
      show_icon: Boolean(state.show_icon),
      show_image: Boolean(state.show_image),
      show_text: Boolean(state.show_text),
      display_inside: Boolean(state.display_inside),
      click_individual_parts: Boolean(state.click_individual_parts),
      click_icon: Boolean(state.click_icon),
      click_text: Boolean(state.click_text),
      click_image: Boolean(state.click_image),
      click_view: Boolean(state.click_view),
      structure: normaliseStructure(state.structure),
      view_position: normaliseViewPosition(state.view_position),
      show_summary: Boolean(state.show_summary),
      show_type_label: Boolean(state.show_type_label),
      figure_caption_text: Boolean(state.figure_caption_text)
    };
  }

  function applyCommonPreferences(state, prefs = {}) {
    if (!prefs || typeof prefs !== "object") {
      return state;
    }

    state.show_icon = booleanValue(prefs.show_icon, state.show_icon);
    state.show_image = booleanValue(prefs.show_image, state.show_image);
    state.show_text = booleanValue(prefs.show_text, state.show_text);
    state.display_inside = booleanValue(prefs.display_inside, state.display_inside);
    state.click_individual_parts = booleanValue(prefs.click_individual_parts, state.click_individual_parts);
    state.click_icon = booleanValue(prefs.click_icon, state.click_icon);
    state.click_text = booleanValue(prefs.click_text, state.click_text);
    state.click_image = booleanValue(prefs.click_image, state.click_image);
    state.click_view = booleanValue(prefs.click_view, state.click_view);
    state.structure = normaliseStructure(prefs.structure || state.structure);
    state.view_position = normaliseViewPosition(prefs.view_position || state.view_position);
    state.show_summary = booleanValue(prefs.show_summary, state.show_summary);
    state.show_type_label = booleanValue(prefs.show_type_label, state.show_type_label);
    state.figure_caption_text = booleanValue(prefs.figure_caption_text, state.figure_caption_text);

    return state;
  }

  function syncCommonPreferences(state, kind = state.kind) {
    const prefs = state._common_preferences && typeof state._common_preferences === "object"
      ? state._common_preferences
      : {};

    if (resolveToggleCapability(kind, "icon").mode === "available") {
      prefs.show_icon = Boolean(state.show_icon);
      prefs.click_icon = Boolean(state.click_icon);
    }

    if (resolveToggleCapability(kind, "image").mode === "available") {
      prefs.show_image = Boolean(state.show_image);
      prefs.click_image = Boolean(state.click_image);
    }

    if (resolveToggleCapability(kind, "text").mode === "available" && kind !== "gallery") {
      prefs.show_text = Boolean(state.show_text);
      prefs.click_text = Boolean(state.click_text);
    }

    if (resolveToggleCapability(kind, "displayInside").mode === "available") {
      prefs.display_inside = Boolean(state.display_inside);
      prefs.click_view = Boolean(state.click_view);
      prefs.view_position = normaliseViewPosition(state.view_position);
    }

    prefs.click_individual_parts = Boolean(state.click_individual_parts);
    prefs.structure = normaliseStructure(state.structure);

    if (allowsSummary(kind)) {
      prefs.show_summary = Boolean(state.show_summary);
    }

    if (allowsTypeLabel(kind)) {
      prefs.show_type_label = Boolean(state.show_type_label);
    }

    prefs.figure_caption_text = Boolean(state.figure_caption_text);
    state._common_preferences = prefs;

    return prefs;
  }

  function normaliseValue(kind, value) {
    if (kind === "gallery") {
      return Array.isArray(value) ? value.filter((item) => item && item.src) : [];
    }

    if (kind === "com_tags_tag") {
      return Array.isArray(value) ? value.map((item) => String(item || "")).filter(Boolean) : list(value, []);
    }

    return typeof value === "string" ? value : "";
  }

  function makeState(config, seed = {}) {
    const allowedKinds = list(config.allowed_kinds, GROUPS.flatMap((group) => group[2]));
    const kind = allowedKinds.includes(seed.kind) ? seed.kind : (config.default_kind || allowedKinds[0] || "external_url");
    const state = {
      kind,
      value: normaliseValue(kind, seed.value),
      action: modes(config, kind).some((mode) => mode[0] === seed.action) ? seed.action : defaultAction(config, kind),
      label: String(seed.label || ""),
      selection_label: String(seed.selection_label || ""),
      selection_items: Array.isArray(seed.selection_items) ? seed.selection_items.filter((item) => item && item.id) : [],
      title: String(seed.title || ""),
      target: String(seed.target || ""),
      rel: String(seed.rel || ""),
      css_class: String(seed.css_class || ""),
      icon_class: String(seed.icon_class || ""),
      download_filename: String(seed.download_filename || ""),
      source_type: defaultSource(kind, String(seed.source_type || "")),
      popup_scope: normalisePopupScope(kind, String(seed.popup_scope || "")),
      preview_image: String(seed.preview_image || ""),
      image_override: String(seed.image_override || ""),
      selection_href: String(seed.selection_href || ""),
      selection_image: String(seed.selection_image || ""),
      selection_image_alt: String(seed.selection_image_alt || ""),
      preview_alt: String(seed.preview_alt || ""),
      thumbnail_empty_class: String(seed.thumbnail_empty_class || ""),
      thumbnail_override: hasThumbnailLayoutOverride(seed),
      thumbnail_position: String(seed.thumbnail_position || ""),
      thumbnail_ratio: String(seed.thumbnail_ratio || ""),
      thumbnail_fit: String(seed.thumbnail_fit || ""),
      thumbnail_size: String(seed.thumbnail_size || ""),
      selection_summary: String(seed.selection_summary || ""),
      show_icon: resolveToggleState(kind, "icon", seed.show_icon),
      show_image: resolveToggleState(kind, "image", seed.show_image),
      show_text: resolveToggleState(kind, "text", seed.show_text),
      display_inside: resolveToggleState(kind, "displayInside", seed.display_inside),
      click_individual_parts: booleanValue(seed.click_individual_parts),
      click_icon: booleanValue(seed.click_icon),
      click_text: booleanValue(seed.click_text),
      click_image: booleanValue(seed.click_image),
      click_view: booleanValue(seed.click_view),
      structure: normaliseStructure(seed.structure || config.default_structure || ""),
      view_position: normaliseViewPosition(seed.view_position || ""),
      show_summary: allowsSummary(kind) ? booleanValue(seed.show_summary) : false,
      show_type_label: allowsTypeLabel(kind) ? booleanValue(seed.show_type_label) : false,
      figure_caption_text: booleanValue(seed.figure_caption_text),
      _externalAutoPrefixed: false,
      _externalInternalHint: false,
      _relativeExternalHint: false,
      _relativeAutoConverted: false,
      _relativeAutoRooted: false,
      _anchorSuggestions: collectAnchorSuggestions(config),
      video: {
        controls: seed.video?.controls !== false,
        autoplay: Boolean(seed.video?.autoplay),
        loop: Boolean(seed.video?.loop),
        muted: Boolean(seed.video?.muted),
        poster: String(seed.video?.poster || "")
      },
      gallery: {
        layout: "grid",
        columns: Number(seed.gallery?.columns || 3),
        gap: Number(seed.gallery?.gap || 16),
        link_behavior: seed.gallery?.link_behavior || "open",
        image_size_mode: seed.gallery?.image_size_mode || "cover"
      },
      _thumbnail_defaults: thumbnailDefaults(config),
      _thumbnail_class_mappings: thumbnailClassMappings(config),
      _carry_seed: null,
      _derived_from_seed: false,
      _common_preferences: {},
      _view: "main"
    };

    normaliseImplicitFieldValues(normaliseContentState(state));
    state._common_preferences = captureCommonPreferences(state);
    rememberCarrySeed(state);

    return state;
  }

  function cloneStateValue(value) {
    if (value === undefined) {
      return undefined;
    }

    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch (error) {
      }
    }

    return JSON.parse(JSON.stringify(value));
  }

  function kindStateSnapshot(state) {
    const snapshot = {};

    Object.keys(state || {}).forEach((key) => {
      if (["_thumbnail_defaults", "_thumbnail_class_mappings", "_common_preferences", "_carry_seed", "_derived_from_seed"].includes(key)) {
        return;
      }

      snapshot[key] = cloneStateValue(state[key]);
    });

    return snapshot;
  }

  function hasMeaningfulCarryState(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return false;
    }

    if (hasPersistableValue(snapshot)) {
      return true;
    }

    return Boolean(
      String(snapshot.label || "").trim()
      || String(snapshot.selection_label || "").trim()
      || String(snapshot.selection_summary || "").trim()
      || String(snapshot.image_override || "").trim()
      || String(snapshot.selection_image || "").trim()
      || String(snapshot.selection_image_alt || "").trim()
      || String(snapshot.preview_image || "").trim()
      || String(snapshot.preview_alt || "").trim()
      || String(snapshot.download_filename || "").trim()
      || String(snapshot.title || "").trim()
      || String(snapshot.target || "").trim()
      || String(snapshot.rel || "").trim()
      || String(snapshot.css_class || "").trim()
      || String(snapshot.icon_class || "").trim()
    );
  }

  function rememberCarrySeed(state, force = false) {
    if (!state || typeof state !== "object") {
      return;
    }

    if (!force && state._derived_from_seed) {
      return;
    }

    const snapshot = kindStateSnapshot(state);

    if (force || hasMeaningfulCarryState(snapshot)) {
      state._carry_seed = snapshot;
    }
  }

  function markCanonicalState(state, force = false) {
    if (!state || typeof state !== "object") {
      return;
    }

    state._derived_from_seed = false;
    rememberCarrySeed(state, force);
  }

  function replaceState(state, next) {
    Object.keys(state).forEach((key) => {
      delete state[key];
    });

    Object.assign(state, next);
    state._thumbnail_defaults = next._thumbnail_defaults || thumbnailDefaults({});
    state._thumbnail_class_mappings = next._thumbnail_class_mappings || thumbnailClassMappings({});
    state._common_preferences = captureCommonPreferences(state);
    normaliseImplicitFieldValues(normaliseContentState(state));
  }

  function restoreCanonicalKindState(state, config, snapshot, prefs = {}) {
    const next = makeState(config, snapshot || {});
    next._view = "main";
    next._derived_from_seed = false;
    applyCommonPreferences(next, prefs);
    replaceState(state, next);
  }

  function isUrlCarryKind(kind) {
    return ["external_url", "relative_url", "advanced_route"].includes(kind);
  }

  function isResolvedLinkCarryKind(kind) {
    return ["com_content_article", "com_content_category", "menu_item", "com_tags_tag", "com_contact_contact", "user_profile"].includes(kind);
  }

  function isSingleMediaCarryKind(kind) {
    return ["media_file", "image", "video"].includes(kind);
  }

  function matchesCarryUrlExtension(value, extensions) {
    const raw = String(value || "").trim();

    if (!raw) {
      return false;
    }

    return new RegExp(`\\.(${extensions.join("|")})(?:[?#].*)?$`, "i").test(raw);
  }

  function isCarryImageLikeUrl(value) {
    return matchesCarryUrlExtension(value, ["avif", "bmp", "gif", "ico", "jpe?g", "png", "svg", "webp"]);
  }

  function isCarryVideoLikeUrl(value) {
    return matchesCarryUrlExtension(value, ["mp4", "m4v", "mov", "ogv", "ogg", "webm"]);
  }

  function isCarryFileLikeUrl(value) {
    return matchesCarryUrlExtension(value, [
      "pdf", "zip", "rar", "7z", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
      "csv", "txt", "rtf", "odt", "ods", "odp", "epub", "mp3", "wav"
    ]);
  }

  function isCarryMediaLikeUrl(value) {
    return isCarryImageLikeUrl(value) || isCarryVideoLikeUrl(value) || isCarryFileLikeUrl(value);
  }

  function supportsSourceType(kind, sourceType) {
    const requested = String(sourceType || "").trim();

    if (!requested) {
      return false;
    }

    return (meta(kind).s || []).some((source) => source[0] === requested);
  }

  function carryHrefFromState(state) {
    const kind = String(state?.kind || "").trim();

    if (!kind || ["gallery", "email", "phone"].includes(kind)) {
      return "";
    }

    const href = String(effectiveHref(state) || "").trim();
    return href && href !== "#" ? href : "";
  }

  function relativeCarryValue(rawHref) {
    const raw = String(rawHref || "").trim();

    if (!raw || isUnsafeUrl(raw) || /^(mailto:|tel:)/i.test(raw)) {
      return "";
    }

    if (/^(\/|\.\/|\.\.\/|index\.php\?|\?|#)/i.test(raw)) {
      return normaliseRelativeHref(raw);
    }

    return toRelativeIfCurrentSite(raw);
  }

  function advancedRouteCarryValue(rawHref) {
    const relative = relativeCarryValue(rawHref);

    if (!relative || relative.startsWith("#")) {
      return "";
    }

    return relative;
  }

  function externalCarryValue(rawHref) {
    const raw = String(rawHref || "").trim();

    if (!raw || isUnsafeUrl(raw) || /^(mailto:|tel:|#)/i.test(raw)) {
      return "";
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    if (raw.startsWith("//")) {
      return `${window.location.protocol}${raw}`;
    }

    try {
      return new URL(raw, siteRootUrl()).toString();
    } catch (error) {
      return "";
    }
  }

  function inferCarryKindFromHref(rawHref) {
    const raw = String(rawHref || "").trim();

    if (!raw || isUnsafeUrl(raw) || /^(mailto:|tel:|#)/i.test(raw)) {
      return null;
    }

    try {
      const url = new URL(raw, siteRootUrl());

      if (!/^https?:$/i.test(url.protocol) || !isCurrentSiteHostname(url.hostname)) {
        return null;
      }

      const option = String(url.searchParams.get("option") || "");
      const view = String(url.searchParams.get("view") || "");
      const id = String(url.searchParams.get("id") || "");

      if (option === "com_content" && view === "article" && id) {
        return { kind: "com_content_article", value: id };
      }

      if (option === "com_content" && view === "category" && id) {
        return { kind: "com_content_category", value: id };
      }

      if (option === "com_contact" && view === "contact" && id) {
        return { kind: "com_contact_contact", value: id };
      }

      if (option === "com_tags" && view === "tag") {
        const ids = url.searchParams.getAll("id[]").filter(Boolean);

        if (ids.length) {
          return { kind: "com_tags_tag", value: ids };
        }

        if (id) {
          return { kind: "com_tags_tag", value: [id] };
        }
      }

      if (option === "com_users" && view === "profile" && id) {
        return { kind: "user_profile", value: id };
      }

      const itemId = String(url.searchParams.get("Itemid") || "");
      if (itemId) {
        return { kind: "menu_item", value: itemId };
      }
    } catch (error) {
    }

    return null;
  }

  function mediaSourceTypeForCarry(targetKind, href) {
    if (!isSingleMediaCarryKind(targetKind)) {
      return "";
    }

    if (targetKind === "video" && isProviderUrl(href) && supportsSourceType(targetKind, "provider")) {
      return "provider";
    }

    return supportsSourceType(targetKind, "external") ? "external" : "";
  }

  function canCarryUrlToMediaKind(currentKind, targetKind, href) {
    if (!isSingleMediaCarryKind(targetKind) || !href) {
      return false;
    }

    if (currentKind === "external_url") {
      return true;
    }

    if (!["relative_url", "advanced_route"].includes(currentKind)) {
      return false;
    }

    if (targetKind === "image") {
      return isCarryImageLikeUrl(href);
    }

    if (targetKind === "video") {
      return isProviderUrl(href) || isCarryVideoLikeUrl(href);
    }

    return isCarryMediaLikeUrl(href);
  }

  function carrySelectionFields(carry, state, targetKind) {
    if (String(state.selection_label || "").trim()) {
      carry.selection_label = String(state.selection_label || "");
    }

    if (targetKind !== "image" && String(state.selection_image || "").trim()) {
      carry.selection_image = String(state.selection_image || "");
    }

    if (targetKind !== "image" && String(state.selection_image_alt || "").trim()) {
      carry.selection_image_alt = String(state.selection_image_alt || "");
    }

    if (allowsSummary(targetKind) && String(state.selection_summary || "").trim()) {
      carry.selection_summary = String(state.selection_summary || "");
    }
  }

  function carryExplicitPresentationFields(carry, state, targetKind, options = {}) {
    const includeText = options.includeText !== false;
    const includeImage = options.includeImage !== false;
    const includeSummary = options.includeSummary === true;

    if (includeText) {
      const explicitLabel = String(state.label || "").trim();
      const carriedLabel = explicitLabel || String(state.selection_label || "").trim();

      if (carriedLabel) {
        carry.label = carriedLabel;
      }
    }

    if (includeImage && allowsImageOverride(targetKind)) {
      const explicitImage = String(state.image_override || "").trim();
      const carriedImage = explicitImage || String(state.selection_image || "").trim();

      if (carriedImage) {
        carry.image_override = carriedImage;
      }

      const explicitAlt = String(state.preview_alt || "").trim();
      const carriedAlt = explicitAlt || String(state.selection_image_alt || "").trim();

      if (carriedAlt) {
        carry.preview_alt = carriedAlt;
      }
    }

    if (includeSummary && allowsSummary(targetKind) && String(state.selection_summary || "").trim()) {
      carry.selection_summary = String(state.selection_summary || "");
    }
  }

  function buildCrossKindCarry(state, config, targetKind) {
    const currentKind = String(state?.kind || "").trim();
    const carry = {};

    if (!currentKind || !targetKind || currentKind === targetKind) {
      return carry;
    }

    if (modes(config, targetKind).some((mode) => mode[0] === state.action)) {
      carry.action = state.action;
    }

    if (String(state.icon_class || "").trim()) {
      carry.icon_class = state.icon_class;
    }

    if (String(state.download_filename || "").trim() && modes(config, targetKind).some((mode) => mode[0] === "link_download")) {
      carry.download_filename = state.download_filename;
    }

    if (allowsImageOverride(targetKind)) {
      if (String(state.image_override || "").trim()) {
        carry.image_override = state.image_override;
      }

      if (String(state.preview_image || "").trim()) {
        carry.preview_image = state.preview_image;
      }

      if (String(state.preview_alt || "").trim()) {
        carry.preview_alt = state.preview_alt;
      }

      if (String(state.thumbnail_empty_class || "").trim()) {
        carry.thumbnail_empty_class = state.thumbnail_empty_class;
      }

      if (Boolean(state.thumbnail_override)) {
        carry.thumbnail_override = true;

        if (String(state.thumbnail_position || "").trim()) {
          carry.thumbnail_position = state.thumbnail_position;
        }

        if (String(state.thumbnail_ratio || "").trim()) {
          carry.thumbnail_ratio = state.thumbnail_ratio;
        }

        if (String(state.thumbnail_fit || "").trim()) {
          carry.thumbnail_fit = state.thumbnail_fit;
        }

        if (String(state.thumbnail_size || "").trim()) {
          carry.thumbnail_size = state.thumbnail_size;
        }
      }
    }

    const href = carryHrefFromState(state);

    if (targetKind === "relative_url") {
      const value = currentKind === "anchor"
        ? relativeCarryValue(effectiveHref(state))
        : relativeCarryValue(href);

      if (value) {
        carry.value = normaliseValue(targetKind, value);
        carryExplicitPresentationFields(carry, state, targetKind, { includeSummary: true });
      }

      return carry;
    }

    if (targetKind === "advanced_route") {
      const value = advancedRouteCarryValue(href);

      if (value) {
        carry.value = normaliseValue(targetKind, value);
        carryExplicitPresentationFields(carry, state, targetKind, { includeSummary: true });
      }

      return carry;
    }

    if (targetKind === "external_url") {
      const value = externalCarryValue(href);

      if (value) {
        carry.value = normaliseValue(targetKind, value);
        carryExplicitPresentationFields(carry, state, targetKind, { includeSummary: true });
      }

      return carry;
    }

    if (isSingleMediaCarryKind(currentKind) && isSingleMediaCarryKind(targetKind)) {
      const requestedSourceType = String(state.source_type || "").trim();

      if (requestedSourceType && !supportsSourceType(targetKind, requestedSourceType)) {
        return carry;
      }

      const sourceType = requestedSourceType && supportsSourceType(targetKind, requestedSourceType)
        ? requestedSourceType
        : "";

      if (sourceType) {
        carry.source_type = sourceType;
      }

      carry.value = normaliseValue(targetKind, state.value);
      carry.selection_label = String(state.selection_label || "");
      carry.selection_image = String(state.selection_image || "");
      carry.selection_image_alt = String(state.selection_image_alt || "");
      carry.selection_summary = String(state.selection_summary || "");

      if (targetKind === "video" && currentKind === "video" && state.video && typeof state.video === "object") {
        carry.video = cloneStateValue(state.video);
      }

      return carry;
    }

    if (isSingleMediaCarryKind(targetKind) && canCarryUrlToMediaKind(currentKind, targetKind, href)) {
      const sourceType = mediaSourceTypeForCarry(targetKind, href);

      if (!sourceType) {
        return carry;
      }

      carry.source_type = sourceType;
      carry.value = normaliseValue(targetKind, href);
      carryExplicitPresentationFields(carry, state, targetKind, {
        includeImage: targetKind !== "image",
        includeSummary: true
      });
      return carry;
    }

    if (isResolvedLinkCarryKind(targetKind) && ["external_url", "relative_url", "advanced_route"].includes(currentKind)) {
      const inferred = inferCarryKindFromHref(href);

      if (inferred && inferred.kind === targetKind) {
        carry.value = normaliseValue(targetKind, inferred.value);
      }
    }

    return carry;
  }

  function applyCrossKindCarry(state, carry = {}) {
    if (!carry || typeof carry !== "object") {
      return;
    }

    Object.entries(carry).forEach(([key, value]) => {
      state[key] = cloneStateValue(value);
    });
  }

  function resetKind(state, config, kind) {
    if (!kind || kind === state.kind) {
      return;
    }

    const prefs = state._common_preferences && typeof state._common_preferences === "object"
      ? state._common_preferences
      : {};
    const carrySource = state._carry_seed && typeof state._carry_seed === "object"
      ? state._carry_seed
      : kindStateSnapshot(state);
    const carrySeed = cloneStateValue(carrySource);

    if (carrySource && carrySource.kind === kind && hasMeaningfulCarryState(carrySource)) {
      restoreCanonicalKindState(state, config, carrySource, prefs);
      return;
    }

    const carry = buildCrossKindCarry(carrySource, config, kind);

    state.kind = kind;
    state.value = normaliseValue(kind, kind === "gallery" ? [] : "");
    state.action = defaultAction(config, kind);
    state.selection_label = "";
    state.selection_items = [];
    state.selection_summary = "";
    state.selection_href = "";
    state.source_type = defaultSource(kind);
    state.popup_scope = normalisePopupScope(kind, "");
    state.icon_class = "";
    state.download_filename = "";
    state.preview_image = "";
    state.image_override = "";
    state.selection_image = "";
    state.selection_image_alt = "";
    state.preview_alt = "";
    state.thumbnail_empty_class = "";
    state.thumbnail_override = false;
    state.thumbnail_position = "";
    state.thumbnail_ratio = "";
    state.thumbnail_fit = "";
    state.thumbnail_size = "";
    state.show_icon = resolveToggleState(kind, "icon");
    state.show_image = resolveToggleState(kind, "image");
    state.show_text = resolveToggleState(kind, "text");
    state.display_inside = resolveToggleState(kind, "displayInside");
    state.click_individual_parts = false;
    state.click_icon = false;
    state.click_text = false;
    state.click_image = false;
    state.click_view = false;
    state.structure = normaliseStructure(config.default_structure || "");
    state.view_position = "after";
    state.show_summary = false;
    state.show_type_label = false;
    state.figure_caption_text = false;
    state._externalAutoPrefixed = false;
    state._externalInternalHint = false;
    state._relativeExternalHint = false;
    state._relativeAutoConverted = false;
    state._relativeAutoRooted = false;
    if (kind === "anchor") {
      state._anchorSuggestions = collectAnchorSuggestions(config);
    }
    state._view = "main";
    state._thumbnail_defaults = thumbnailDefaults(config);
    state._thumbnail_class_mappings = thumbnailClassMappings(config);
    state._carry_seed = carrySeed;
    state._derived_from_seed = true;
    applyCommonPreferences(state, prefs);
    applyCrossKindCarry(state, carry);
    normaliseImplicitFieldValues(normaliseContentState(state));
  }

  function clearCurrentState(state, config) {
    if (!state || !config) {
      return;
    }

    const next = makeState(config, { kind: state.kind });
    next._view = state._view === "advanced" ? "advanced" : "main";
    markCanonicalState(next, true);
    replaceState(state, next);
  }

  function metadataNeeded(config, payload) {
    return list(config.metadata_required_kinds, METADATA_REQUIRED).includes(payload.kind)
      || payload.action !== "link_open"
      || Boolean(payload.display_inside)
      || Boolean(payload.click_individual_parts)
      || Boolean(payload.click_icon)
      || Boolean(payload.click_text)
      || Boolean(payload.click_image)
      || Boolean(payload.click_view)
      || (payload.structure || "inline") !== "inline"
      || Boolean(payload.show_icon)
      || Boolean(payload.show_image && !["image", "gallery"].includes(payload.kind))
      || Boolean(payload.show_summary)
      || Boolean(payload.show_type_label)
      || Boolean(payload.figure_caption_text)
      || Boolean(payload.thumbnail_empty_class)
      || Boolean(payload.thumbnail_position)
      || Boolean(payload.thumbnail_ratio)
      || Boolean(payload.thumbnail_fit)
      || Boolean(payload.thumbnail_size);
  }

  function emittedSmartlinkKind(kind) {
    switch (kind) {
      case "external_url":
        return "external";
      case "relative_url":
        return "relative";
      case "anchor":
        return "anchor";
      case "email":
        return "email";
      case "phone":
        return "phone";
      case "com_content_article":
        return "article";
      case "com_content_category":
        return "category";
      case "menu_item":
        return "menu";
      case "com_tags_tag":
        return "tag";
      case "com_contact_contact":
        return "contact";
      case "media_file":
        return "file";
      case "image":
        return "image";
      case "video":
        return "video";
      case "gallery":
        return "gallery";
      case "user_profile":
        return "user";
      case "advanced_route":
        return "route";
      default:
        return "";
    }
  }

  function emittedSmartlinkValue(payload) {
    if (payload.kind === "com_tags_tag") {
      return (Array.isArray(payload.value) ? payload.value : list(payload.value, []))
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .join(",");
    }

    return String(payload.value || "").trim();
  }

  function metadataAttr(config, payload) {
    const emittedKind = emittedSmartlinkKind(payload.kind);

    if (emittedKind && (!["external_url", "relative_url", "anchor", "email", "phone", "media_file", "image", "video"].includes(payload.kind) || metadataNeeded(config, payload))) {
      const value = emittedSmartlinkValue(payload);
      const attrs = [`data-kind="${esc(emittedKind)}"`];

      if (value !== "") {
        attrs.push(`data-value="${esc(value)}"`);
      }

      return ` ${attrs.join(" ")}`;
    }

    return "";
  }

  function galleryItemAttr(item, key, value) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "";
    }

    return ` data-${esc(key)}="${esc(String(value).trim())}"`;
  }

  function galleryInlineItemAttrs(item) {
    const type = (item.type || "image") === "video" ? "video" : "image";
    const src = normaliseJoomlaMediaValue(item.src || "");

    if (type !== "video") {
      return "";
    }

    return [
      `data-item="${esc(type)}"`,
      galleryItemAttr(item, "src", src)
    ].filter(Boolean).join(" ");
  }

  function normaliseHtmlOutputMode(value) {
    return String(value || "").trim().toLowerCase() === "pretty" ? "pretty" : "compact";
  }

  function escapePrettyText(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapePrettyAttribute(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function prettyPrintMarkup(markup) {
    const source = String(markup || "").trim();

    if (!source) {
      return "";
    }

    const template = document.createElement("template");
    template.innerHTML = source;
    const booleanAttributes = new Set([
      "allowfullscreen", "hidden", "disabled", "checked", "selected", "readonly", "multiple", "autofocus", "required"
    ]);
    const voidTags = new Set(["img", "source", "br", "hr"]);

    const serializeAttributes = (element) => Array.from(element.attributes || [])
      .map((attribute) => {
        const name = String(attribute.name || "");
        const value = String(attribute.value ?? "");

        if (value === "" && booleanAttributes.has(name.toLowerCase())) {
          return name;
        }

        return `${name}="${escapePrettyAttribute(value)}"`;
      })
      .join(" ");

    const serialize = (node, depth = 0) => {
      if (!node) {
        return "";
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const raw = String(node.textContent || "");
        const trimmed = raw.replace(/\s+/g, " ").trim();

        if (!trimmed) {
          return "";
        }

        return `${"  ".repeat(depth)}${escapePrettyText(trimmed)}`;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
      }

      const element = node;
      const tagName = element.tagName.toLowerCase();
      const indent = "  ".repeat(depth);
      const attrs = serializeAttributes(element);
      const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;

      if (voidTags.has(tagName)) {
        return `${indent}${openTag}`;
      }

      const childNodes = Array.from(element.childNodes || []);
      const childStrings = childNodes
        .map((child) => serialize(child, depth + 1))
        .filter(Boolean);

      if (!childStrings.length) {
        return `${indent}${openTag}</${tagName}>`;
      }

      const hasElementChildren = childNodes.some((child) => child.nodeType === Node.ELEMENT_NODE);

      if (!hasElementChildren) {
        return `${indent}${openTag}${childStrings.map((entry) => entry.trim()).join(" ")}</${tagName}>`;
      }

      return `${indent}${openTag}\n${childStrings.join("\n")}\n${indent}</${tagName}>`;
    };

    return Array.from(template.content.childNodes || [])
      .map((node) => serialize(node, 0))
      .filter(Boolean)
      .join("\n");
  }

  function applyHtmlOutputMode(config, markup) {
    return normaliseHtmlOutputMode(config?.html_output_mode) === "pretty"
      ? prettyPrintMarkup(markup)
      : markup;
  }

  function ajaxMetadataUrl(kind, value) {
    const params = new URLSearchParams();
    params.set("option", "com_ajax");
    params.set("plugin", "smartlink");
    params.set("group", "fields");
    params.set("format", "json");
    params.set("kind", String(kind || ""));
    params.set("value", Array.isArray(value) ? value.join(",") : String(value || ""));
    return `${siteBasePath()}index.php?${params.toString()}`;
  }

  function unwrapAjaxMetadata(response) {
    const data = response && typeof response === "object" && Object.prototype.hasOwnProperty.call(response, "data")
      ? response.data
      : response;

    if (Array.isArray(data)) {
      return data.find((item) => item && typeof item === "object") || {};
    }

    return data && typeof data === "object" ? data : {};
  }

  function fetchSelectionMetadata(kind, value) {
    if (!value || !list(METADATA_REQUIRED, []).includes(kind) || !window.fetch) {
      return Promise.resolve({});
    }

    return window.fetch(ajaxMetadataUrl(kind, value), {
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((response) => unwrapAjaxMetadata(response))
      .catch(() => ({}));
  }

  function kindNeedsResolvedHref(kind) {
    return [
      "com_content_article",
      "com_content_category",
      "menu_item",
      "com_contact_contact",
      "com_tags_tag",
      "relative_url",
      "user_profile",
      "advanced_route"
    ].includes(String(kind || "").trim());
  }

  function stateHasValue(state) {
    if (state.kind === "gallery" || state.kind === "com_tags_tag") {
      return Array.isArray(state.value) && state.value.length > 0;
    }

    return String(state.value || "").trim() !== "";
  }

  function applySelectionMetadata(state, metadata = {}) {
    if (!metadata || typeof metadata !== "object") {
      return false;
    }

    const nextLabel = String(metadata.label || "").trim();
    const nextHref = String(metadata.href || "").trim();
    const nextSummary = String(metadata.summary || "").trim();
    const nextImage = String(metadata.image || "").trim();
    const nextImageAlt = String(metadata.image_alt || "").trim();
    const nextItems = Array.isArray(metadata.items)
      ? metadata.items
        .filter((item) => item && item.id)
        .map((item) => ({ id: String(item.id || ""), label: String(item.label || "") }))
      : [];
    let changed = false;

    if (nextLabel) {
      const currentLabel = String(state.label || "").trim();
      const currentSelection = String(state.selection_label || "").trim();
      const importedText = currentLabel || currentSelection;

      if (currentLabel && importedText === nextLabel) {
        state.label = "";
        changed = true;
      }

      if (state.selection_label !== nextLabel) {
        state.selection_label = nextLabel;
        changed = true;
      }
    }

    if (nextHref && state.selection_href !== nextHref) {
      state.selection_href = nextHref;
      changed = true;
    }

    if (!state.selection_summary && nextSummary) {
      state.selection_summary = nextSummary;
      changed = true;
    }

    if (!state.selection_image && nextImage) {
      state.selection_image = nextImage;
      changed = true;
    }

    if (!state.selection_image_alt && nextImageAlt) {
      state.selection_image_alt = nextImageAlt;
      changed = true;
    }

    if (nextItems.length) {
      const currentItems = Array.isArray(state.selection_items) ? state.selection_items : [];
      const sameItems = currentItems.length === nextItems.length
        && currentItems.every((item, index) => item.id === nextItems[index].id && item.label === nextItems[index].label);

      if (!sameItems) {
        state.selection_items = nextItems;
        changed = true;
      }
    }

    normaliseImplicitFieldValues(state);

    return changed;
  }

  function ensureResolvedSelectionHref(state) {
    if (!kindNeedsResolvedHref(state.kind) || !stateHasValue(state) || String(state.selection_href || "").trim()) {
      return Promise.resolve();
    }

    return fetchSelectionMetadata(state.kind, state.value)
      .then((metadata) => {
        if (applySelectionMetadata(state, metadata)) {
          normaliseImplicitFieldValues(state);
        }
      })
      .catch(() => {});
  }

  function hydrateSelectionState(state, repaint) {
    const snapshot = Array.isArray(state.value) ? state.value.join(",") : String(state.value || "");

    if (!snapshot) {
      return;
    }

    fetchSelectionMetadata(state.kind, state.value).then((metadata) => {
      const current = Array.isArray(state.value) ? state.value.join(",") : String(state.value || "");

      if (current !== snapshot) {
        return;
      }

      if (applySelectionMetadata(state, metadata)) {
        markCanonicalState(state);
        repaint();
      }
    });
  }

  function effectiveHref(payload) {
    const selectionHref = String(payload.selection_href || "").trim();

    if (payload.kind === "gallery") {
      return payload.value[0]?.src || "#";
    }

    switch (payload.kind) {
      case "anchor":
        return String(payload.value || "").charAt(0) === "#" ? String(payload.value || "") : `#${String(payload.value || "")}`;
      case "relative_url":
        return selectionHref ? applyPopupScopeToHref(selectionHref, payload) : applyPopupScopeToHref(normaliseRelativeHref(payload.value) || "#", payload);
      case "email":
        return String(payload.value || "").startsWith("mailto:") ? String(payload.value || "") : `mailto:${String(payload.value || "").trim()}`;
      case "phone":
        return String(payload.value || "").startsWith("tel:") ? String(payload.value || "") : `tel:${String(payload.value || "").trim()}`;
      case "com_content_article":
      case "com_content_category":
        return selectionHref ? applyPopupScopeToHref(selectionHref, payload) : structuredContentHref(payload);
      case "menu_item":
        return selectionHref ? applyPopupScopeToHref(selectionHref, payload) : applyPopupScopeToHref(payload.value ? rootRelativeIndexHref(`index.php?Itemid=${encodeURIComponent(String(payload.value || ""))}`) : "#", payload);
      case "com_contact_contact":
        return selectionHref ? applyPopupScopeToHref(selectionHref, payload) : applyPopupScopeToHref(payload.value ? rootRelativeIndexHref(`index.php?option=com_contact&view=contact&id=${encodeURIComponent(String(payload.value || ""))}`) : "#", payload);
      case "com_tags_tag": {
        if (selectionHref) {
          return applyPopupScopeToHref(selectionHref, payload);
        }

        const ids = Array.isArray(payload.value) ? payload.value : list(payload.value, []);

        if (!ids.length) {
          return "#";
        }

        const params = new URLSearchParams();
        params.set("option", "com_tags");
        params.set("view", "tag");
        ids.forEach((id) => params.append("id[]", String(id)));

        return applyPopupScopeToHref(rootRelativeIndexHref(`index.php?${params.toString()}`), payload);
      }
      case "user_profile":
        return selectionHref ? applyPopupScopeToHref(selectionHref, payload) : applyPopupScopeToHref(payload.value ? rootRelativeIndexHref(`index.php?option=com_users&view=profile&id=${encodeURIComponent(String(payload.value || ""))}`) : "#", payload);
      case "advanced_route":
        return selectionHref ? applyPopupScopeToHref(selectionHref, payload) : applyPopupScopeToHref(String(payload.value || "").trim() || "#", payload);
      default:
        return payload.value || "#";
    }
  }

  function friendlyValueText(payload) {
    const value = String(payload.value || "").trim();

    switch (payload.kind) {
      case "external_url":
        return value.replace(/^https?:\/\//i, "");
      case "anchor":
        return value.replace(/^#/, "");
      case "email":
        return value.replace(/^mailto:/i, "");
      case "phone":
        return value.replace(/^tel:/i, "");
      default:
        return value;
    }
  }

  function sync(root, state) {
    const actionField = root.querySelector(".js-action");
    const labelField = root.querySelector(".js-label");
    const titleField = root.querySelector(".js-title");
    const targetField = root.querySelector(".js-target");
    const relField = root.querySelector(".js-rel");
    const cssField = root.querySelector(".js-css");
    const iconClassField = root.querySelector(".js-icon-class");
    const downloadField = root.querySelector(".js-download");
    const popupScopeField = root.querySelector(".js-popup-scope");
    const previewImageField = root.querySelector(".js-preview-image");
    const imageOverrideField = root.querySelector(".js-image-override");
    const previewAltField = root.querySelector(".js-preview-alt");
    const thumbnailEmptyClassField = root.querySelector(".js-thumbnail-empty-class");
    const thumbnailOverrideField = root.querySelector(".js-thumbnail-override");
    const thumbnailPositionField = root.querySelector(".js-thumbnail-position");
    const thumbnailRatioField = root.querySelector(".js-thumbnail-ratio");
    const thumbnailFitField = root.querySelector(".js-thumbnail-fit");
    const thumbnailSizeField = root.querySelector(".js-thumbnail-size");
    const showIconField = root.querySelector(".js-show-icon");
    const showImageField = root.querySelector(".js-show-image");
    const showTextField = root.querySelector(".js-show-text");
    const displayInsideField = root.querySelector(".js-display-inside");
    const clickIndividualField = root.querySelector(".js-click-individual-parts");
    const clickIconField = root.querySelector(".js-click-icon");
    const clickTextField = root.querySelector(".js-click-text");
    const clickImageField = root.querySelector(".js-click-image");
    const clickViewField = root.querySelector(".js-click-view");
    const structureField = root.querySelector(".js-structure");
    const viewPositionField = root.querySelector(".js-view-position");
    const showSummaryField = root.querySelector(".js-show-summary");
    const showTypeLabelField = root.querySelector(".js-show-type-label");
    const figureCaptionTextField = root.querySelector(".js-figure-caption-text");
    const videoControlsField = root.querySelector(".js-video-controls");
    const videoAutoplayField = root.querySelector(".js-video-autoplay");
    const videoLoopField = root.querySelector(".js-video-loop");
    const videoMutedField = root.querySelector(".js-video-muted");
    const videoPosterField = root.querySelector(".js-video-poster");

    if (actionField) {
      state.action = actionField.value || state.action;
    }

    if (labelField) {
      state.label = labelField.value || "";
    }

    if (titleField) {
      state.title = titleField.value || "";
    }

    if (targetField) {
      state.target = targetField.value || "";
    }

    if (relField) {
      state.rel = relField.value || "";
    }

    if (cssField) {
      state.css_class = cssField.value || "";
    }

    if (iconClassField) {
      state.icon_class = iconClassField.value || "";
    }

    if (downloadField) {
      state.download_filename = downloadField.value || "";
    }

    state.popup_scope = normalisePopupScope(state.kind, popupScopeField ? (popupScopeField.value || "") : state.popup_scope);
    state.show_icon = showIconField ? Boolean(showIconField.checked) : state.show_icon;
    state.show_image = showImageField ? Boolean(showImageField.checked) : state.show_image;
    state.show_text = showTextField ? Boolean(showTextField.checked) : state.show_text;
    state.display_inside = displayInsideField ? Boolean(displayInsideField.checked) : state.display_inside;
    state.click_individual_parts = clickIndividualField ? Boolean(clickIndividualField.checked) : state.click_individual_parts;
    state.click_icon = clickIconField ? Boolean(clickIconField.checked) : state.click_icon;
    state.click_text = clickTextField ? Boolean(clickTextField.checked) : state.click_text;
    state.click_image = clickImageField ? Boolean(clickImageField.checked) : state.click_image;
    state.click_view = clickViewField ? Boolean(clickViewField.checked) : state.click_view;
    state.structure = structureField ? normaliseStructure(structureField.value || "") : state.structure;
    state.view_position = viewPositionField ? normaliseViewPosition(viewPositionField.value || "") : state.view_position;
    state.show_summary = showSummaryField ? Boolean(showSummaryField.checked) : state.show_summary;
    state.show_type_label = showTypeLabelField ? Boolean(showTypeLabelField.checked) : state.show_type_label;
    state.figure_caption_text = figureCaptionTextField ? Boolean(figureCaptionTextField.checked) : state.figure_caption_text;

    if (previewImageField) {
      state.preview_image = previewImageField.value || "";
    }

    if (imageOverrideField) {
      state.image_override = imageOverrideField.value || "";
    }

    if (previewAltField) {
      state.preview_alt = previewAltField.value || "";
    }

    if (thumbnailEmptyClassField) {
      state.thumbnail_empty_class = thumbnailEmptyClassField.value || "";
    }

    if (thumbnailOverrideField) {
      state.thumbnail_override = Boolean(thumbnailOverrideField.checked);
    }

    if (thumbnailPositionField) {
      state.thumbnail_position = thumbnailPositionField.value || "";
    }

    if (thumbnailRatioField) {
      state.thumbnail_ratio = thumbnailRatioField.value || "";
    }

    if (thumbnailFitField) {
      state.thumbnail_fit = thumbnailFitField.value || "";
    }

    if (thumbnailSizeField) {
      state.thumbnail_size = thumbnailSizeField.value || "";
    }

    if (videoControlsField || videoAutoplayField || videoLoopField || videoMutedField || videoPosterField) {
      state.video = {
        controls: videoControlsField ? Boolean(videoControlsField.checked) : state.video.controls,
        autoplay: videoAutoplayField ? Boolean(videoAutoplayField.checked) : state.video.autoplay,
        loop: videoLoopField ? Boolean(videoLoopField.checked) : state.video.loop,
        muted: videoMutedField ? Boolean(videoMutedField.checked) : state.video.muted,
        poster: videoPosterField ? (videoPosterField.value || "") : state.video.poster
      };
    }

    if (state.kind === "gallery") {
      state.gallery = {
        layout: "grid",
        columns: Number(root.querySelector(".js-gallery-columns")?.value || 3),
        gap: Number(root.querySelector(".js-gallery-gap")?.value || 16),
        link_behavior: root.querySelector(".js-gallery-link")?.value || "open",
        image_size_mode: root.querySelector(".js-gallery-size")?.value || "cover"
      };
      const galleryActions = modes(root._smartlinkConfig || {}, state.kind);
      if (!galleryActions.some((mode) => mode[0] === state.action)) {
        state.action = galleryActions[0][0];
      }
      syncCommonPreferences(state);
      normaliseImplicitFieldValues(normaliseContentState(state));
      return;
    }

    const hidden = root.querySelector(".js-hidden-value");
    const valueField = root.querySelector(".js-value");

    if (valueField) {
      if (state.kind === "external_url") {
        const rawValue = valueField.value || "";
        const normalised = normaliseExternalUrl(rawValue);
        state.value = normalised.value;
        state._externalAutoPrefixed = normalised.prefixed;
        state._externalInternalHint = normalised.internalLike;
        if (valueField.value !== normalised.value) {
          valueField.value = normalised.value;
        }
      } else if (state.kind === "relative_url") {
        const rawValue = valueField.value || "";
        const normalised = normaliseRelativeLink(rawValue);
        state.value = normalised.value;
        state._relativeAutoConverted = normalised.converted;
        state._relativeExternalHint = normalised.externalLike;
        state._relativeAutoRooted = normalised.rooted;
        if (valueField.value !== normalised.value) {
          valueField.value = normalised.value;
        }
      } else if (state.kind === "anchor") {
        state.value = String(valueField.value || "").replace(/^#/, "").trim();
      } else {
        state.value = valueField.value || "";
      }
    } else if (hidden) {
      state.value = state.kind === "com_tags_tag" ? list(hidden.value, []) : (hidden.value || "");
    }

    const availableActions = modes(root._smartlinkConfig || {}, state.kind);
    if (!availableActions.some((mode) => mode[0] === state.action)) {
      state.action = availableActions[0][0];
    }

    syncCommonPreferences(state);
    normaliseImplicitFieldValues(normaliseContentState(state));
  }

  function payloadFrom(state) {
    const payload = {
      kind: state.kind,
      value: state.kind === "gallery" ? (Array.isArray(state.value) ? state.value : []) : (state.kind === "com_tags_tag" ? (Array.isArray(state.value) ? state.value : []) : String(state.value || "")),
      action: state.action,
      label: state.label,
      selection_label: state.selection_label,
      title: state.title,
      target: state.target,
      rel: state.rel,
      css_class: state.css_class,
      icon_class: state.icon_class,
      download_filename: state.download_filename,
      source_type: state.source_type,
      popup_scope: state.popup_scope,
      preview_image: state.preview_image,
      image_override: state.image_override,
      selection_href: state.selection_href,
      selection_image: state.selection_image,
      selection_image_alt: state.selection_image_alt,
      preview_alt: state.preview_alt,
      thumbnail_empty_class: state.thumbnail_empty_class,
      selection_summary: state.selection_summary,
      show_icon: Boolean(state.show_icon),
      show_image: Boolean(state.show_image),
      show_text: Boolean(state.show_text),
      display_inside: Boolean(state.display_inside),
      click_individual_parts: Boolean(state.click_individual_parts),
      click_icon: Boolean(state.click_icon),
      click_text: Boolean(state.click_text),
      click_image: Boolean(state.click_image),
      click_view: Boolean(state.click_view),
      structure: normaliseStructure(state.structure),
      view_position: normaliseViewPosition(state.view_position),
      show_summary: Boolean(state.show_summary),
      show_type_label: Boolean(state.show_type_label),
      figure_caption_text: Boolean(state.figure_caption_text),
      video: state.video,
      gallery: state.gallery
    };

    if (state.thumbnail_override) {
      payload.thumbnail_override = true;

      if (state.thumbnail_position) {
        payload.thumbnail_position = state.thumbnail_position;
      }

      if (state.thumbnail_ratio) {
        payload.thumbnail_ratio = state.thumbnail_ratio;
      }

      if (state.thumbnail_fit) {
        payload.thumbnail_fit = state.thumbnail_fit;
      }

      if (state.thumbnail_size) {
        payload.thumbnail_size = state.thumbnail_size;
      }
    }

    return payload;
  }

  function linkMarkup(config, payload, body, extra = {}) {
    const tag = extra.tag || wrapperTagForAction(payload.action);
    const attrs = [];
    const className = [
      payload.css_class || "",
      tag === "a" && payload.action === "preview_modal" ? "js-smartlink-preview" : "",
      ...(tag === "button" ? linkButtonClassNames(config) : []),
      ...(extra.classes || [])
    ]
      .filter(Boolean)
      .join(" ");

    if (className) {
      attrs.push(`class="${esc(className)}"`);
    }

    if (tag === "a") {
      attrs.unshift(`href="${esc(extra.href || effectiveHref(payload))}"`);
    }

    if (tag === "button") {
      attrs.push(`type="button"`);
    }

    if (payload.title) {
      attrs.push(`title="${esc(payload.title)}"`);
    }

    if (tag === "a" && payload.target) {
      attrs.push(`target="${esc(payload.target)}"`);
    }

    let rel = payload.rel || "";

    if (tag === "a" && payload.target === "_blank") {
      rel = `${rel} noopener noreferrer`.trim();
    }

    if (tag === "a" && rel) {
      attrs.push(`rel="${esc(Array.from(new Set(rel.split(/\s+/).filter(Boolean))).join(" "))}"`);
    }

    if (tag === "a" && payload.action === "link_download") {
      attrs.push(`download="${esc(payload.download_filename || "download")}"`);
    }

    if (tag === "a" && payload.action === "preview_modal") {
      attrs.push(`data-preview="1"`);

      if (payload.preview_image && !isStructuredContentKind(payload.kind)) {
        attrs.push(`data-preview-image="${esc(payload.preview_image)}"`);
      }

      if (payload.preview_alt && !isStructuredContentKind(payload.kind)) {
        attrs.push(`data-preview-alt="${esc(payload.preview_alt)}"`);
      }
    }

    if (tag === "button" && payload.action === "toggle_view") {
      const toggleId = String(payload._toggle_id || "").trim();
      attrs.push(`data-toggle-view="1"`);
      attrs.push(`aria-expanded="${payload.display_inside ? "true" : "false"}"`);

      if (toggleId) {
        attrs.push(`aria-controls="${esc(toggleId)}"`);
      }
    }

    Object.entries(extra.attrs || {}).forEach(([name, value]) => {
      if (value !== "") {
        attrs.push(`${esc(name)}="${esc(value)}"`);
      }
    });

    if (extra.meta !== false) {
      attrs.push(metadataAttr(config, payload).trim());
    }

    return `<${tag} ${attrs.filter(Boolean).join(" ")}>${body}</${tag}>`;
  }

  function primaryText(payload, overrideText = "") {
    if (overrideText) {
      return String(overrideText);
    }

    if (payload.label) {
      return String(payload.label);
    }

    if (payload.selection_label) {
      return String(payload.selection_label);
    }

    if (payload.kind === "gallery") {
      return "Gallery";
    }

    const friendlyValue = friendlyValueText(payload);

    if (friendlyValue) {
      return friendlyValue;
    }

    const href = effectiveHref(payload);
    return basename(href) || String(payload.value || "Open");
  }

  function imageSource(payload) {
    if (payload.image_override) {
      return normaliseJoomlaMediaValue(payload.image_override);
    }

    if (payload.kind === "image") {
      return normaliseJoomlaMediaValue(payload.value);
    }

    if (payload.kind === "video") {
      return normaliseJoomlaMediaValue(payload.video?.poster || payload.preview_image || "");
    }

    if (payload.kind === "gallery") {
      const first = Array.isArray(payload.value) ? payload.value[0] : null;
      return normaliseJoomlaMediaValue(first?.poster || first?.src || "");
    }

    if (payload.selection_image) {
      return normaliseJoomlaMediaValue(payload.selection_image);
    }

    return normaliseJoomlaMediaValue(payload.preview_image);
  }

  function imageAlt(payload, text) {
    return String(payload.preview_alt || payload.selection_image_alt || text || kindTypeLabel(payload.kind) || "").trim();
  }

  function textParts(payload, text) {
    const parts = [];

    if (payload.show_type_label) {
      parts.push(`<span class="smartlink-type">${esc(kindTypeLabel(payload.kind))}</span>`);
    }

    if (payload.show_text && text) {
      parts.push(esc(text));
    }

    if (payload.show_summary && payload.selection_summary) {
      parts.push(`<span class="smartlink-summary">${esc(String(payload.selection_summary || "").trim())}</span>`);
    }

    return parts.join("");
  }

  function resolveClickTargets(payload) {
    const available = {
      icon: Boolean(payload.show_icon),
      text: Boolean(payload.show_text) && payload.kind !== "gallery",
      thumbnail: Boolean(payload.show_image),
      view: payload.action !== "toggle_view" && Boolean(payload.display_inside) && canClickViewOnPage(payload.kind)
    };
    const targets = {
      whole: false,
      icon: false,
      text: false,
      thumbnail: false,
      view: false
    };

    if (payload.action === "no_action") {
      return targets;
    }

    if (!payload.click_individual_parts) {
      if (payload.display_inside) {
        return {
          ...targets,
          icon: available.icon,
          text: available.text,
          thumbnail: available.thumbnail,
          view: available.view
        };
      }

      return {
        ...targets,
        whole: true
      };
    }

    targets.icon = available.icon && Boolean(payload.click_icon);
    targets.text = available.text && Boolean(payload.click_text);
    targets.thumbnail = available.thumbnail && Boolean(payload.click_image);
    targets.view = available.view && Boolean(payload.click_view);

    if (!targets.icon && !targets.text && !targets.thumbnail && !targets.view) {
      for (const key of ["text", "thumbnail", "icon", "view"]) {
        if (available[key]) {
          targets[key] = true;
          break;
        }
      }
    }

    return targets;
  }

  function hasClickableTarget(targets) {
    return Boolean(targets.whole || targets.icon || targets.text || targets.thumbnail || targets.view);
  }

  function wrapPart(config, payload, body, active, classes = []) {
    if (!body) {
      return "";
    }

    if (!active || payload.action === "no_action") {
      return body;
    }

    return linkMarkup(config, payload, body, {
      meta: false,
      classes: ["smartlink-part", ...classes]
    });
  }

  function iconPart(config, payload, targets) {
    if (!payload.show_icon) {
      return "";
    }

    const body = `<span class="smartlink-icon ${esc(iconClassName(payload.icon_class, payload.kind))}" aria-hidden="true">&#8203;</span>`;

    return wrapPart(config, payload, body, targets.icon, ["smartlink-part--icon"]);
  }

  function imagePart(config, payload, text, targets) {
    if (!payload.show_image) {
      return "";
    }
    const body = thumbnailMarkup(config, payload, text);

    return wrapPart(config, payload, body, targets.thumbnail, ["smartlink-part--image"]);
  }

  function rawTextBody(payload, text) {
    return textParts(payload, text) || "";
  }

  function textBody(config, payload, text, targets) {
    const body = rawTextBody(payload, text);

    if (!body) {
      return "";
    }

    return wrapPart(config, payload, body, targets.text, ["smartlink-part--text"]);
  }

  function spacedInline(icon, body) {
    if (icon && body) {
      return `${icon} ${body}`;
    }

    return body || icon;
  }

  function figureBody(icon, body) {
    if (icon && body) {
      return `<span class="smartlink-caption-body">${spacedInline(icon, body)}</span>`;
    }

    return spacedInline(icon, body);
  }

  function thumbnailAfterContent(config, payload) {
    return effectiveThumbnailSettings(config, payload).position === "bottom";
  }

  function composeStructuredContent(config, payload, image, icon, body, useCaption = false) {
    if (payload.structure === "figure") {
      const figureText = figureBody(icon, body);
      const figureContent = useCaption
        ? (figureText ? `<figcaption class="smartlink-caption">${figureText}</figcaption>` : "")
        : figureText;

      return thumbnailAfterContent(config, payload)
        ? `${figureContent}${image}`
        : `${image}${figureContent}`;
    }

    const inline = spacedInline(icon, body);

    return thumbnailAfterContent(config, payload)
      ? `${inline}${image}`
      : `${image}${inline}`;
  }

  function viewerSupplementWrapper(payload, content) {
    if (!content) {
      return "";
    }

    if (payload.structure === "inline") {
      return `<span class="smartlink-inline-viewer__meta smartlink-inline-viewer__meta--inline">${content}</span>`;
    }

    return `<div class="smartlink-inline-viewer__meta">${content}</div>`;
  }

  function groupedViewerSupplement(config, payload, text, useCaption = false, skipIcon = false) {
    const icon = skipIcon ? "" : (payload.show_icon ? `<span class="smartlink-icon ${esc(iconClassName(payload.icon_class, payload.kind))}" aria-hidden="true"></span>` : "");
    const image = payload.show_image ? thumbnailMarkup(config, payload, text) : "";
    const body = rawTextBody(payload, text);

    if (!icon && !image && !body) {
      return "";
    }

    const content = composeStructuredContent(config, payload, image, icon, body, useCaption);

    return viewerSupplementWrapper(
      payload,
      linkMarkup(config, payload, content, {
        meta: false,
        classes: ["smartlink-part", "smartlink-part--view"]
      })
    );
  }

  function viewerSupplement(config, payload, text, targets, useCaption = false, skipIcon = false) {
    if (payload.action !== "no_action" && !payload.click_individual_parts) {
      return groupedViewerSupplement(config, payload, text, useCaption, skipIcon);
    }

    const icon = skipIcon ? "" : iconPart(config, payload, targets);
    const image = imagePart(config, payload, text, targets);
    const body = useCaption ? "" : textBody(config, payload, text, targets);

    if (!icon && !image && !body) {
      return "";
    }

    return viewerSupplementWrapper(payload, composeStructuredContent(config, payload, image, icon, body, false));
  }

  function structureInner(config, payload, text, targets) {
    const icon = iconPart(config, payload, targets);
    const image = imagePart(config, payload, text, targets);
    const body = textBody(config, payload, text, targets);

    return composeStructuredContent(config, payload, image, icon, body, payload.structure === "figure" && payload.figure_caption_text && Boolean(body));
  }

  function galleryLinks(config, payload) {
    const items = Array.isArray(payload.value) ? payload.value : [];
    const links = items.map((item) => {
      const itemPayload = {
        ...payload,
        kind: (item.type || "image") === "video" ? "video" : "image",
        value: item.src || "",
        label: item.label || "",
        selection_label: item.label || basename(item.src || "") || "Open",
        preview_image: item.poster || item.src || "",
        preview_alt: payload.preview_alt || item.label || ""
      };
      const text = item.label || basename(item.src || "") || "Open";
      return linkMarkup(config, itemPayload, esc(text), {
        meta: false,
        href: effectiveHref(itemPayload),
        attrs: {
          "data-item": (item.type || "image") === "video" ? "video" : "",
          "data-poster": normaliseJoomlaMediaValue(item.poster || "")
        }
      });
    }).join("");

    return `<div class="smartlink smartlink-links"${metadataAttr(config, payload)}>${links}</div>`;
  }

  function viewerFallback(config, payload, text) {
    if (payload.action === "no_action") {
      return "";
    }

    return `<div class="smartlink-fallback">${linkMarkup(config, payload, esc(text), { meta: false, href: effectiveHref(payload) })}</div>`;
  }

  function viewerRootTag(payload) {
    return payload.structure === "inline" ? "span" : "div";
  }

  let toggleViewIdCounter = 0;

  function toggleTargetId(payload) {
    return String(payload?._toggle_id || "").trim();
  }

  function withToggleContext(payload) {
    if (!payload || payload.action !== "toggle_view") {
      return payload;
    }

    const currentId = toggleTargetId(payload);
    if (currentId) {
      return payload;
    }

    toggleViewIdCounter += 1;

    return {
      ...payload,
      _toggle_id: `smartlink-view-${toggleViewIdCounter}`
    };
  }

  function viewContainerAttributes(payload, className, extra = {}) {
    const attrs = [`class="${esc(className)}"`];
    const toggleId = toggleTargetId(payload);

    if (toggleId) {
      attrs.push(`id="${esc(toggleId)}"`);
    }

    if (payload.action === "toggle_view" && !payload.display_inside) {
      attrs.push("hidden");
    }

    Object.entries(extra || {}).forEach(([name, value]) => {
      if (value !== "") {
        attrs.push(`${esc(name)}="${esc(value)}"`);
      }
    });

    return attrs.join(" ");
  }

  function videoViewerBody(payload, text) {
    const wrapperTag = viewerRootTag(payload);
    let body = "";

    try {
      const url = new URL(String(payload.value || ""), window.location.origin);
      const host = url.host.toLowerCase();

      if (host.includes("youtu.be")) {
        const id = url.pathname.replace(/^\//, "");
        if (id) {
          const qs = new URLSearchParams({
            controls: payload.video?.controls !== false ? "1" : "0",
            autoplay: payload.video?.autoplay ? "1" : "0",
            loop: payload.video?.loop ? "1" : "0",
            mute: payload.video?.muted ? "1" : "0"
          });
          const src = `https://www.youtube.com/embed/${id}?${qs.toString()}`;
          body = `<${wrapperTag} ${viewContainerAttributes(payload, "smartlink-view", iframeViewContainerExtra(src, true))}><iframe ${mediaSourceAttributes(payload, src)} allowfullscreen></iframe></${wrapperTag}>`;
        }
      } else if (host.includes("youtube.com")) {
        const id = url.searchParams.get("v");
        if (id) {
          const qs = new URLSearchParams({
            controls: payload.video?.controls !== false ? "1" : "0",
            autoplay: payload.video?.autoplay ? "1" : "0",
            loop: payload.video?.loop ? "1" : "0",
            mute: payload.video?.muted ? "1" : "0"
          });
          const src = `https://www.youtube.com/embed/${id}?${qs.toString()}`;
          body = `<${wrapperTag} ${viewContainerAttributes(payload, "smartlink-view", iframeViewContainerExtra(src, true))}><iframe ${mediaSourceAttributes(payload, src)} allowfullscreen></iframe></${wrapperTag}>`;
        }
      } else if (host.includes("vimeo.com")) {
        const id = url.pathname.split("/").filter(Boolean).pop();
        if (id) {
          const qs = new URLSearchParams({
            autoplay: payload.video?.autoplay ? "1" : "0",
            loop: payload.video?.loop ? "1" : "0",
            muted: payload.video?.muted ? "1" : "0"
          });
          const src = `https://player.vimeo.com/video/${id}?${qs.toString()}`;
          body = `<${wrapperTag} ${viewContainerAttributes(payload, "smartlink-view", iframeViewContainerExtra(src, true))}><iframe ${mediaSourceAttributes(payload, src)} allowfullscreen></iframe></${wrapperTag}>`;
        }
      }
    } catch (error) {
    }

    if (body) {
      return body;
    }

    const attrs = [
      payload.video?.controls !== false ? "controls" : "",
      payload.video?.autoplay ? "autoplay" : "",
      payload.video?.loop ? "loop" : "",
      payload.video?.muted ? "muted" : "",
      payload.video?.poster ? `poster="${esc(payload.video.poster)}"` : ""
    ].filter(Boolean);

    return `<${wrapperTag} ${viewContainerAttributes(payload, "smartlink-view")}><video class="smartlink-video" ${attrs.join(" ")}><source src="${esc(payload.value || "")}"><a href="${esc(payload.value || "")}">${esc(text)}</a></video></${wrapperTag}>`;
  }

  function viewerBody(config, payload, text, targets) {
    const wrapperTag = viewerRootTag(payload);
    if (payload.kind === "image") {
      const imageHref = normaliseJoomlaMediaValue(payload.value || "");
      const body = `<${wrapperTag} ${viewContainerAttributes(payload, "smartlink-view")}><img ${mediaSourceAttributes(payload, imageHref, "img")} alt="${esc(imageAlt(payload, text))}"></${wrapperTag}>`;

      return wrapPart(config, payload, body, targets.view, ["smartlink-part--view"]);
    }

    if (payload.kind === "video") {
      return videoViewerBody(payload, text);
    }

    if (payload.kind === "gallery") {
      const items = Array.isArray(payload.value) ? payload.value : [];
      const grid = items.map((item) => {
        const itemPayload = {
          ...payload,
          kind: (item.type || "image") === "video" ? "video" : "image",
          value: item.src || "",
          preview_image: item.poster || item.src || "",
          preview_alt: item.label || ""
        };

        if ((item.type || "image") === "video") {
          return `<span class="smartlink-item"${galleryInlineItemAttrs(item)}>${item.poster
            ? `<img ${mediaSourceAttributes(payload, item.poster, "img")} alt="${esc(item.label || ui("gallery_fallback_video"))}">`
            : `<span class="smartlink-item-label">${esc(item.label || "Video")}</span>`}</span>`;
        }

        return `<span class="smartlink-item"><img ${mediaSourceAttributes(payload, itemPayload.value || "", "img")} alt="${esc(item.label || "")}"></span>`;
      }).join("");

      return `<${wrapperTag} ${viewContainerAttributes(payload, `smartlink-view smartlink-gallery smartlink-gallery--${esc(payload.gallery.image_size_mode || "cover")}`, {
        style: `--smartlink-gallery-columns:${Number(payload.gallery.columns || 3)};--smartlink-gallery-gap:${Number(payload.gallery.gap || 16)}px;`
      })}>${grid}</${wrapperTag}>`;
    }

    if (payload.kind === "media_file" || payload.kind === "external_url" || payload.kind === "relative_url" || isStructuredContentKind(payload.kind) || ["menu_item", "com_tags_tag", "com_contact_contact", "user_profile", "advanced_route"].includes(payload.kind)) {
      const src = effectiveHref(payload);
      return `<${wrapperTag} ${viewContainerAttributes(payload, "smartlink-view", iframeViewContainerExtra(src))}><iframe ${mediaSourceAttributes(payload, src)}></iframe></${wrapperTag}>`;
    }

    return "";
  }

  function buildContentMarkup(config, payload, text, options = {}) {
    const targets = resolveClickTargets(payload);
    const linked = payload.action !== "no_action";
    const wholeItem = linked && !payload.click_individual_parts;
    const includeMeta = options.includeMeta !== false;
    const inner = structureInner(config, payload, text, targets);

    if (payload.structure === "figure") {
      if (wholeItem) {
        return linkMarkup(config, payload, `<figure>${inner}</figure>`, { classes: ["smartlink"], meta: includeMeta });
      }

      return linkMarkup(config, payload, inner, { tag: "figure", classes: ["smartlink"], meta: includeMeta });
    }

    if (payload.structure === "block") {
      if (wholeItem) {
        return `<div class="smartlink-wrapper">${linkMarkup(config, payload, inner, { classes: ["smartlink"], meta: includeMeta })}</div>`;
      }

      if (!linked) {
        return `<div class="smartlink-wrapper">${linkMarkup(config, payload, inner, { tag: "span", classes: ["smartlink"], meta: includeMeta })}</div>`;
      }

      return `<div class="smartlink-wrapper">${linkMarkup(config, payload, inner, { tag: "div", classes: ["smartlink"], meta: includeMeta })}</div>`;
    }

    return linkMarkup(
      config,
      payload,
      inner,
      {
        tag: wholeItem ? wrapperTagForAction(payload.action, "span") : "span",
        classes: ["smartlink"],
        meta: includeMeta
      }
    );
  }

  function buildViewerSupplement(config, payload, text, options = {}) {
    const supplementPayload = { ...payload, display_inside: false };
    const targets = resolveClickTargets(supplementPayload);
    const inner = structureInner(config, supplementPayload, text, targets);
    const linked = supplementPayload.action !== "no_action";
    const wholeItem = linked && !supplementPayload.click_individual_parts;

    if (wholeItem) {
      return linkMarkup(config, supplementPayload, inner, { classes: ["smartlink"], meta: options.includeMeta !== false });
    }

    return linkMarkup(config, supplementPayload, inner, { tag: "span", classes: ["smartlink"], meta: options.includeMeta !== false });
  }

  function buildFigureInlineViewer(config, payload, text, viewMarkup, options = {}) {
    const supplementPayload = { ...payload, display_inside: false };
    const linked = supplementPayload.action !== "no_action";
    const wholeItem = linked && !supplementPayload.click_individual_parts;
    let supplement = "";

    if (wholeItem && !supplementPayload.figure_caption_text) {
      const targets = resolveClickTargets(supplementPayload);
      const inner = structureInner(config, supplementPayload, text, targets);
      supplement = linkMarkup(config, supplementPayload, inner, { meta: false });
    } else {
      const figurePayload = wholeItem
        ? {
          ...supplementPayload,
          click_individual_parts: true,
          click_icon: Boolean(supplementPayload.show_icon),
          click_text: Boolean(supplementPayload.show_text || supplementPayload.show_summary || supplementPayload.show_type_label),
          click_image: Boolean(supplementPayload.show_image)
        }
        : supplementPayload;
      const targets = resolveClickTargets(figurePayload);
      supplement = structureInner(config, figurePayload, text, targets);
    }

    const viewAfter = normaliseViewPosition(payload.view_position) === "after";
    const parts = viewAfter
      ? `${supplement}${viewMarkup}`
      : `${viewMarkup}${supplement}`;

    return linkMarkup(config, payload, parts, { tag: "figure", classes: ["smartlink"], meta: options.includeMeta !== false });
  }

  function buildInlineViewer(config, payload, text, options = {}) {
    const viewerPayload = withToggleContext(payload);
    const targets = resolveClickTargets(viewerPayload);
    const body = options.viewMarkup || viewerBody(config, viewerPayload, text, targets);

    if (!body) {
      return buildContentMarkup(config, { ...viewerPayload, display_inside: false }, text, { includeMeta: options.includeMeta !== false });
    }

    if (viewerPayload.structure === "figure") {
      return buildFigureInlineViewer(config, viewerPayload, text, body, options);
    }

    const viewAfter = normaliseViewPosition(viewerPayload.view_position) === "after";
    const supplement = (viewerPayload.show_icon || viewerPayload.show_image || viewerPayload.show_text)
      ? buildViewerSupplement(config, viewerPayload, text, options)
      : "";
    const parts = viewAfter
      ? `${supplement}${body}`
      : `${body}${supplement}`;
    const wrapperTag = viewerPayload.structure === "block" ? "div" : "span";
    const wrapperMeta = supplement || options.includeMeta === false ? "" : metadataAttr(config, viewerPayload);

    return `<${wrapperTag} class="smartlink-wrapper"${wrapperMeta}>${parts}</${wrapperTag}>`;
  }

  function buildMarkup(configOrPayload, maybePayload, overrideText = "") {
    const hasConfig = maybePayload && typeof maybePayload === "object" && !Array.isArray(maybePayload);
    const config = hasConfig ? (configOrPayload || {}) : {};
    const payload = hasConfig ? maybePayload : configOrPayload;
    const textOverride = hasConfig ? overrideText : (typeof maybePayload === "string" ? maybePayload : "");
    const text = primaryText(payload, textOverride);

    if (payload.kind === "gallery" && !payload.display_inside && payload.action !== "toggle_view") {
      return applyHtmlOutputMode(config, galleryLinks(config, payload));
    }

    if (payload.display_inside || payload.action === "toggle_view") {
      return applyHtmlOutputMode(config, buildInlineViewer(config, payload, text));
    }

    return applyHtmlOutputMode(config, buildContentMarkup(config, payload, text));
  }

  function sectionWarning(state) {
    const value = String(Array.isArray(state.value) ? "" : state.value || "").trim();
    if (!value) {
      return "";
    }
    if (state.kind === "external_url" && state._externalInternalHint) {
      return ui("warning_use_relative_link");
    }
    if (state.kind === "external_url" && state._externalAutoPrefixed) {
      return ui("info_https_added");
    }
    if (state.kind === "relative_url" && state._relativeAutoConverted) {
      return ui("info_domain_removed");
    }
    if (state.kind === "relative_url" && state._relativeAutoRooted) {
      return ui("info_leading_slash_added");
    }
    if (state.kind === "relative_url" && state._relativeExternalHint) {
      return ui("warning_use_external_link");
    }
    if (isUnsafeUrl(value)) {
      return ui("warning_unsafe_scheme");
    }
    if (state.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return ui("warning_invalid_email");
    }
    if (state.kind === "phone" && !/^\+?[0-9()\-\s./]{5,}$/.test(value)) {
      return ui("warning_invalid_phone");
    }
    if (state.kind === "video" && state.source_type === "provider" && !isProviderUrl(value)) {
      return ui("warning_use_video_provider");
    }
    return "";
  }

  function summaryText(state) {
    if (state.selection_label) {
      return state.selection_label;
    }
    if (state.kind === "gallery") {
      const items = Array.isArray(state.value) ? state.value : [];
      return items.length
        ? uiFormat(items.length === 1 ? "summary_n_items_selected_one" : "summary_n_items_selected_other", { count: items.length })
        : ui("summary_no_items_selected");
    }
    if (state.kind === "com_tags_tag") {
      const items = Array.isArray(state.value) ? state.value : [];
      return items.length
        ? uiFormat(items.length === 1 ? "summary_n_tags_selected_one" : "summary_n_tags_selected_other", { count: items.length })
        : ui("summary_no_tags_selected");
    }
    const value = String(state.value || "").trim();
    if (!value) {
      return meta(state.kind).p ? ui("summary_nothing_selected") : ui("summary_no_value");
    }
    if (/^\d+$/.test(value)) {
      return uiFormat("summary_selected_item_number", { value });
    }
    return basename(value) || value;
  }

  function valueLabel(state) {
    const map = {
      external_url: ui("value_label_web_address"),
      relative_url: ui("value_label_relative_link"),
      anchor: ui("value_label_anchor_id"),
      email: ui("value_label_email_address"),
      phone: ui("value_label_phone_number"),
      advanced_route: ui("value_label_joomla_path"),
      user_profile: ui("value_label_user_reference")
    };
    if (map[state.kind]) {
      return map[state.kind];
    }
    if (state.kind === "video" && state.source_type === "provider") {
      return ui("value_label_youtube_vimeo_link");
    }
    if (["media_file", "image", "video"].includes(state.kind)) {
      return state.source_type === "external"
        ? ui("value_label_web_address")
        : uiFormat("value_label_path", { kind: meta(state.kind).l });
    }
    return ui("value_label_value");
  }

  function valuePlaceholder(state) {
    const map = {
      external_url: ui("value_placeholder_external"),
      relative_url: ui("value_placeholder_relative"),
      anchor: ui("value_placeholder_anchor"),
      email: ui("value_placeholder_email"),
      phone: ui("value_placeholder_phone"),
      advanced_route: ui("value_placeholder_joomla_path"),
      user_profile: ui("value_placeholder_user_reference")
    };
    if (map[state.kind]) {
      return map[state.kind];
    }
    if (state.kind === "video" && state.source_type === "provider") {
      return ui("value_placeholder_youtube");
    }
    if (["media_file", "image", "video"].includes(state.kind)) {
      return ui("value_placeholder_file");
    }
    return ui("value_placeholder_value");
  }

  function inputType(state) {
    if (["external_url", "relative_url", "advanced_route", "media_file", "image", "video"].includes(state.kind)) {
      return "url";
    }
    if (state.kind === "email") {
      return "email";
    }
    if (state.kind === "phone") {
      return "tel";
    }
    return "text";
  }

  function labelHint(state) {
    if (state.selection_label) {
      return state.selection_label;
    }

    if (!["external_url", "relative_url", "email", "phone"].includes(state.kind)) {
      return "";
    }

    const value = String(Array.isArray(state.value) ? "" : state.value || "").trim();
    if (!value) {
      return "";
    }

    if (state.kind === "external_url") {
      return value.replace(/^https?:\/\//i, "");
    }

    if (state.kind === "relative_url") {
      return value.replace(/^\//, "");
    }

    return value;
  }

  function downloadFilenameHint(state) {
    const raw = String(Array.isArray(state.value) ? "" : state.value || "").trim();

    if (!raw) {
      return ui("hint_download_filename");
    }

    let pathname = raw;

    try {
      const parsed = new URL(raw, window.location.origin);
      pathname = parsed.pathname || raw;
    } catch (error) {
    }

    const cleanPath = decodeURIComponent(String(pathname).split("?")[0].split("#")[0]).replace(/\/+$/, "");
    const guessed = basename(cleanPath).replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").trim();

    return guessed || ui("hint_download_filename");
  }

  function altHint(state) {
    const payload = {
      kind: state.kind,
      value: state.value,
      label: state.label,
      selection_label: state.selection_label,
      preview_alt: "",
      selection_image_alt: state.selection_image_alt
    };

    return imageAlt(payload, primaryText(payload));
  }

  function groups(config, currentKind) {
    const allowed = list(config.allowed_kinds, GROUPS.flatMap((group) => group[2]));
    return GROUPS
      .map(([key, label, kinds]) => [key, ui(label, label), kinds.filter((kind) => allowed.includes(kind) || kind === currentKind)])
      .filter((group) => group[2].length);
  }

  function activeGroupKey(state) {
    return meta(state.kind).g || "simple_links";
  }

  function isRailGroupExpanded(state, groupKey) {
    return groupKey === activeGroupKey(state);
  }

  function renderGeneral(state) {
    const currentMeta = meta(state.kind);
    const sources = currentMeta.s || [];
    const usesPicker = currentMeta.p && (!sources.length || state.source_type === "local");
    const warning = sectionWarning(state);
    let pickerPanel = "";

    if (state.kind === "gallery") {
      const items = Array.isArray(state.value) ? state.value : [];
      pickerPanel = `
        <div class="smartlink-builder__gallery-list">
          ${items.length ? items.map((item, index) => `
            <div class="smartlink-builder__gallery-card" data-index="${index}">
              <div class="smartlink-builder__gallery-preview">
                ${(item.type || "image") === "video"
                  ? (item.poster
                    ? `<img src="${esc(item.poster)}" alt="${esc(item.label || ui("gallery_fallback_video"))}" loading="lazy">`
                    : `<span class="smartlink-builder__gallery-fallback">${esc(item.label || ui("gallery_fallback_video"))}</span>`)
                  : `<img src="${esc(item.src || "")}" alt="${esc(item.label || "")}" loading="lazy">`}
              </div>
              <div class="smartlink-builder__gallery-meta">
                <div class="smartlink-builder__gallery-name">${esc(item.label || basename(item.src || "") || ui("generic_item"))}</div>
                <div class="smartlink-builder__gallery-path">${esc(item.src || "")}</div>
              </div>
              <button type="button" class="btn btn-sm btn-outline-danger js-gallery-remove" data-index="${index}">${esc(ui("gallery_remove"))}</button>
            </div>`).join("") : `<div class="smartlink-builder__empty">${esc(ui("summary_no_items_selected"))}</div>`}
        </div>
        ${state.source_type !== "local" ? `
          <div class="smartlink-builder__row">
            <label class="smartlink-builder__field">
              <span>${esc(state.source_type === "provider" ? ui("value_label_youtube_vimeo_link") : ui("value_label_web_address"))}</span>
              <input class="form-control js-gallery-manual-src" type="url" placeholder="${esc(state.source_type === "provider" ? ui("value_placeholder_youtube") : "https://example.com/image.jpg")}">
            </label>
            <label class="smartlink-builder__field">
              <span>${esc(ui("field_item_title"))}</span>
              <input class="form-control js-gallery-manual-label" type="text" placeholder="${esc(ui("placeholder_optional"))}">
            </label>
            <button type="button" class="btn btn-outline-secondary js-gallery-add-manual">${esc(ui("gallery_add_item"))}</button>
          </div>` : ""}
        <div class="smartlink-builder__actions">
          ${usesPicker ? `<button type="button" class="btn btn-outline-secondary js-picker">${esc(ui("gallery_add_from_media_library"))}</button>` : ""}
          ${items.length ? `<button type="button" class="btn btn-outline-secondary js-clear">${esc(ui("button_clear_all"))}</button>` : ""}
        </div>`;
    } else if (usesPicker) {
      pickerPanel = `
        <div class="smartlink-builder__picker-row">
          <div class="smartlink-builder__summary smartlink-builder__summary--compact">
            <div class="smartlink-builder__summary-caption">${esc(["com_content_article", "com_content_category", "menu_item", "com_contact_contact"].includes(state.kind) ? ui("summary_selected_item") : (state.kind === "com_tags_tag" ? ui("summary_selected_tags") : ui("summary_selected_file")))}</div>
            <div class="smartlink-builder__summary-value">${esc(summaryText(state))}</div>
          </div>
          <div class="smartlink-builder__actions smartlink-builder__actions--inline">
            <button type="button" class="btn btn-outline-secondary js-picker">${esc(ui("button_choose"))}</button>
            ${(Array.isArray(state.value) ? state.value.length : state.value) ? `<button type="button" class="btn btn-outline-secondary js-clear">${esc(ui("button_clear"))}</button>` : ""}
          </div>
        </div>
        <input class="js-hidden-value" type="hidden" value="${esc(Array.isArray(state.value) ? state.value.join(",") : String(state.value || ""))}">
      `;
    } else {
      const anchorSuggestions = state.kind === "anchor" ? (Array.isArray(state._anchorSuggestions) ? state._anchorSuggestions : []) : [];
      const anchorListId = `smartlink-anchor-list-${Math.random().toString(36).slice(2, 10)}`;
      pickerPanel = `
        <label class="smartlink-builder__field">
          <span>${esc(valueLabel(state))}</span>
          <input class="form-control js-value" type="${esc(inputType(state))}" value="${esc(Array.isArray(state.value) ? state.value.join(",") : state.value || "")}" placeholder="${esc(valuePlaceholder(state))}"${state.kind === "anchor" && anchorSuggestions.length ? ` list="${esc(anchorListId)}"` : ""}>
        </label>`;
      if (state.kind === "anchor" && anchorSuggestions.length) {
        pickerPanel += `
          <datalist id="${esc(anchorListId)}">
            ${anchorSuggestions.map((item) => `<option value="${esc(item)}"></option>`).join("")}
          </datalist>
          <div class="smartlink-builder__hint">${esc(ui("hint_anchor_suggestions"))}</div>`;
      }
    }

    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">${esc(ui("section_source"))}</h4>
        ${sources.length ? `
          <label class="smartlink-builder__field">
            <span>${esc(state.kind === "gallery" ? ui("field_where_items_from") : uiFormat("field_where_kind_from", { kind: meta(state.kind).l.toLowerCase() }))}</span>
            <select class="form-select js-source">
              ${sources.map((source) => `<option value="${esc(source[0])}"${source[0] === state.source_type ? " selected" : ""}>${esc(source[1])}</option>`).join("")}
            </select>
          </label>` : ""}
        ${pickerPanel}
        ${warning ? `<div class="smartlink-builder__warning">${esc(warning)}</div>` : ""}
      </section>`;
  }

  function hasPreviewValue(payload) {
    if (payload.kind === "gallery") {
      return Array.isArray(payload.value) && payload.value.length > 0;
    }
    if (payload.kind === "com_tags_tag") {
      return Array.isArray(payload.value) && payload.value.length > 0;
    }
    return String(payload.value || "").trim() !== "";
  }

  function hasPersistableValue(payload) {
    if (payload.kind === "gallery") {
      return Array.isArray(payload.value) && payload.value.length > 0;
    }

    if (payload.kind === "com_tags_tag") {
      return Array.isArray(payload.value) && payload.value.length > 0;
    }

    return String(payload.value || "").trim() !== "";
  }

  function hasTextualPreview(payload) {
    return Boolean(payload.show_text || payload.show_summary || payload.show_type_label);
  }

  function previewPlaceholderTextValue(payload) {
    if (!hasTextualPreview(payload)) {
      return "";
    }

    if (payload.label) {
      return String(payload.label);
    }

    if (payload.selection_label) {
      return String(payload.selection_label);
    }

    switch (payload.kind) {
      case "external_url":
      case "relative_url":
        return ui("preview_placeholder_link_text");
      case "anchor":
        return ui("preview_placeholder_anchor_point");
      case "email":
        return ui("preview_placeholder_email_address");
      case "phone":
        return ui("preview_placeholder_phone_number");
      case "advanced_route":
        return ui("preview_placeholder_joomla_path");
      case "media_file":
        return ui("preview_placeholder_file_name");
      case "image":
        return ui("preview_placeholder_image_title");
      case "video":
        return ui("preview_placeholder_video_title");
      case "gallery":
        return ui("preview_placeholder_gallery");
      case "com_tags_tag":
        return ui("preview_placeholder_tags");
      default:
        return kindTypeLabel(payload.kind);
    }
  }

  function previewPlaceholderPayload(payload) {
    return {
      ...payload,
      label: payload.label || payload.selection_label || "",
      selection_label: "",
      selection_summary: payload.selection_summary || (payload.show_summary ? ui("preview_placeholder_summary") : ""),
      preview_alt: payload.preview_alt || "",
      selection_image_alt: payload.selection_image_alt || ""
    };
  }

  function previewPlaceholderView(payload) {
    if (payload.kind === "gallery") {
      return `<div class="smartlink-gallery smartlink-gallery--cover smartlink-preview-placeholder__view smartlink-preview-placeholder__view--gallery" aria-hidden="true">
        <span class="smartlink-preview-placeholder__gallery-item"></span>
        <span class="smartlink-preview-placeholder__gallery-item"></span>
        <span class="smartlink-preview-placeholder__gallery-item"></span>
        <span class="smartlink-preview-placeholder__gallery-item"></span>
      </div>`;
    }

    if (payload.kind === "image") {
      return `<figure class="smartlink-image smartlink-preview-placeholder__view smartlink-preview-placeholder__view--image" aria-hidden="true"></figure>`;
    }

    return `<div class="smartlink-preview-placeholder__view smartlink-preview-placeholder__view--frame" aria-hidden="true"></div>`;
  }

  function buildPreviewPlaceholder(config, payload) {
    const placeholderText = previewPlaceholderTextValue(payload);
    const placeholderPayload = previewPlaceholderPayload(payload);
    const hasPlaceholderContent = Boolean(
      payload.show_icon
      || payload.show_image
      || placeholderText
      || payload.show_summary
      || payload.show_type_label
      || payload.display_inside
    );

    if (payload.display_inside) {
      return buildInlineViewer(config, placeholderPayload, placeholderText, {
        includeMeta: false,
        viewMarkup: previewPlaceholderView(payload)
      });
    }

    if (!hasPlaceholderContent) {
      return `<div class="smartlink-preview-placeholder-message"><span class="smartlink-preview-placeholder__text">${esc(ui("preview_placeholder_no_content"))}</span></div>`;
    }

    return buildContentMarkup(config, placeholderPayload, placeholderText, { includeMeta: false });
  }

  function renderImagePickerField(config, state, options = {}) {
    const value = String(options.value || "").trim();
    const preview = imageFieldPreview(state, String(options.fieldName || ""));
    const hasExplicitValue = Boolean(value);
    const pickerLabel = ui("button_choose_image");
    const clearLabel = ui("button_clear");
    const buttonClass = String(options.buttonClass || "").trim();
    const clearClass = String(options.clearClass || "").trim();
    const inputClass = String(options.inputClass || "").trim();
    const placeholder = String(options.placeholder || "").trim();
    const label = String(options.label || "").trim();

    return `
      <label class="smartlink-builder__field">
        <span>${esc(label)}</span>
        <div class="smartlink-builder__input-wrap smartlink-builder__input-wrap--picker smartlink-builder__input-wrap--with-prefix">
          <button class="smartlink-builder__input-thumb smartlink-builder__input-prefix-button ${esc(clearClass)}${preview ? " has-image" : " is-empty"}${hasExplicitValue ? " has-clear" : ""}" type="button" title="${esc(clearLabel)}" aria-label="${esc(clearLabel)}"${preview ? ` style="background-image:url('${esc(preview)}')"` : ""}></button>
          <input class="form-control ${esc(inputClass)}" type="url" value="${esc(value)}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ""}>
          <button class="btn btn-outline-secondary smartlink-builder__input-picker ${esc(buttonClass)}" type="button" title="${esc(pickerLabel)}" aria-label="${esc(pickerLabel)}">
            <span class="fa-regular fa-image" aria-hidden="true"></span>
          </button>
        </div>
      </label>`;
  }

  function renderIconClassField(config, state) {
    const value = String(state.icon_class || "");
    const previewClass = iconClassName(state.icon_class, state.kind);
    const hasExplicitValue = Boolean(value.trim());
    const clearLabel = ui("button_clear");
    const datalistId = inputId(config, "icon-suggestions");
    const suggestions = resolveIconSuggestions(config);

    return `
      <div class="smartlink-builder__field smartlink-builder__icon-field">
        <span>${esc(ui("field_icon_class"))}</span>
        <div class="smartlink-builder__input-wrap smartlink-builder__input-wrap--with-prefix">
          <button class="smartlink-builder__input-prefix smartlink-builder__input-prefix--icon smartlink-builder__input-prefix-button js-clear-icon-class${hasExplicitValue ? " has-clear" : ""}" type="button" title="${esc(clearLabel)}" aria-label="${esc(clearLabel)}">
            <span class="smartlink-icon ${esc(previewClass)}"></span>
          </button>
          <input class="form-control js-icon-class" type="text" value="${esc(value)}" placeholder="${esc(defaultIconClass(state.kind))}" list="${esc(datalistId)}" autocomplete="off">
        </div>
        <datalist id="${esc(datalistId)}">
          ${suggestions.map((suggestion) => `<option value="${esc(suggestion)}"></option>`).join("")}
        </datalist>
      </div>`;
  }

  function renderBehavior(config, state) {
    const behaviorModes = modes(config, state.kind);
    const hasMultipleModes = behaviorModes.length > 1;

    if (!behaviorModes.some((mode) => mode[0] === state.action)) {
      state.action = behaviorModes[0][0];
    }

    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">${esc(ui("section_behavior"))}</h4>
        <div class="smartlink-builder__grid">
          <label class="smartlink-builder__field">
            <span>${esc(ui("field_when_clicked"))}</span>
            ${hasMultipleModes
              ? `<select class="form-select js-action">
                  ${behaviorModes.map((mode) => `<option value="${esc(mode[0])}"${mode[0] === state.action ? " selected" : ""}>${esc(mode[1])}</option>`).join("")}
                </select>`
              : `<select class="form-select js-action smartlink-builder__select-readonly" aria-disabled="true" tabindex="-1" disabled>
                  <option value="${esc(behaviorModes[0][0])}" selected>${esc(behaviorModes[0][1])}</option>
                </select>`
            }
          </label>
          ${state.action === "link_download" ? `
            <label class="smartlink-builder__field">
              <span>${esc(ui("field_download_filename_optional"))}</span>
              <input class="form-control js-download" type="text" value="${esc(state.download_filename)}" placeholder="${esc(downloadFilenameHint(state))}">
            </label>` : ""}
        </div>
      </section>`;
  }

  function renderContent(state) {
    const iconDisabled = isToggleDisabled(state.kind, "icon");
    const imageDisabled = isToggleDisabled(state.kind, "image");
    const textDisabled = isToggleDisabled(state.kind, "text");
    const previewModalImpliesView = state.action === "preview_modal" && isToggleVisible(state.kind, "displayInside");
    const showDisplayInsideToggle = isToggleVisible(state.kind, "displayInside");
    const displayInsideActive = previewModalImpliesView || state.display_inside;
    const displayInsideDisabled = state.action === "preview_modal" || isToggleDisabled(state.kind, "displayInside");
    const showTextField = isToggleVisible(state.kind, "text") && state.show_text && state.kind !== "gallery";
    const noVisibleContent = !displayInsideActive && !state.show_icon && !state.show_image && !state.show_text;

    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">${esc(ui("section_content"))}</h4>
        <div class="smartlink-builder__switch-list smartlink-builder__switch-list--four">
          <label class="smartlink-builder__switch-row${state.show_image ? " is-active" : ""}${imageDisabled ? " is-disabled" : ""}">
            <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_thumbnail"))}</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-show-image" type="checkbox"${state.show_image ? " checked" : ""}${imageDisabled ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>
          <label class="smartlink-builder__switch-row${state.show_icon ? " is-active" : ""}${iconDisabled ? " is-disabled" : ""}">
            <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_icon"))}</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-show-icon" type="checkbox"${state.show_icon ? " checked" : ""}${iconDisabled ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>
          <label class="smartlink-builder__switch-row${state.show_text ? " is-active" : ""}${textDisabled ? " is-disabled" : ""}">
            <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_text"))}</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-show-text" type="checkbox"${state.show_text ? " checked" : ""}${textDisabled ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>
          ${showDisplayInsideToggle ? `
          <label class="smartlink-builder__switch-row${displayInsideActive ? " is-active" : ""}${displayInsideDisabled ? " is-disabled" : ""}"${displayInsideDisabled ? ` title="${esc(previewModalImpliesView ? ui("tooltip_popup_preview_forced") : ui("tooltip_view_required"))}"` : ""}>
            <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_view_on_page"))}</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-display-inside" type="checkbox"${displayInsideActive ? " checked" : ""}${displayInsideDisabled ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>` : ""}
        </div>
        ${showTextField ? `
          <label class="smartlink-builder__field">
            <span>${esc(ui("field_text_to_display"))}</span>
            <input class="form-control js-label" type="text" value="${esc(state.label)}" placeholder="${esc(labelHint(state))}">
          </label>` : ""}
        ${noVisibleContent ? `<div class="smartlink-builder__warning">${esc(ui("warning_enable_content_part"))}</div>` : ""}
      </section>`;
  }

  function renderAdvanced(config, state) {
    const showPopupScopeField = supportsBareLayout(state.kind) && (state.action === "preview_modal" || state.action === "toggle_view" || state.display_inside);
    const showTargetField = state.action === "link_open";
    const showRelField = state.action === "link_open";
    const richStructure = state.structure !== "inline";
    const showSummaryField = richStructure && allowsSummary(state.kind);
    const showTypeLabelField = richStructure && allowsTypeLabel(state.kind);
    const showFigureCaptionField = state.structure === "figure" && (state.show_text || state.show_summary || state.show_type_label);
    const showImageOverrideField = allowsImageOverride(state.kind) && (state.show_image || state.display_inside);
    const showPreviewImageField = state.action === "preview_modal" && !["image", "gallery"].includes(state.kind) && !showImageOverrideField;
    const showAltField = state.kind === "image" || state.show_image || state.display_inside;
    const thumbnailDefaultsState = state._thumbnail_defaults || thumbnailDefaults({});
    const showThumbnailPanel = Boolean(state.show_image) || showImageOverrideField || showAltField;
    const showThumbnailSettings = Boolean(state.show_image);
    const showThumbnailLayoutControls = showThumbnailSettings && Boolean(state.thumbnail_override);
    const showThumbnailEmptyClassField = showThumbnailSettings && thumbnailDefaultsState.empty_mode === "specific";
    const showViewPositionField = state.display_inside || state.action === "toggle_view";
    const clickCandidates = clickParts(state);
    const clickEnabled = state.action !== "no_action";
    const availableClickParts = new Set(clickCandidates);
    const canToggleIndividualParts = clickEnabled && clickCandidates.length > 0;
    const clickViewDisabled = !availableClickParts.has("view") || isClickPartLocked(state, "view");
    const structureToggles = [];

    if (showSummaryField) {
      structureToggles.push(`
        <label class="smartlink-builder__switch-row${state.show_summary ? " is-active" : ""}">
          <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_show_summary"))}</span>
          <span class="smartlink-builder__switch-control">
            <input class="js-show-summary" type="checkbox"${state.show_summary ? " checked" : ""}>
            <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
          </span>
        </label>`);
    }

    if (showTypeLabelField) {
      structureToggles.push(`
        <label class="smartlink-builder__switch-row${state.show_type_label ? " is-active" : ""}">
          <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_show_type_label"))}</span>
          <span class="smartlink-builder__switch-control">
            <input class="js-show-type-label" type="checkbox"${state.show_type_label ? " checked" : ""}>
            <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
          </span>
        </label>`);
    }

    if (showFigureCaptionField) {
      structureToggles.push(`
        <label class="smartlink-builder__switch-row${state.figure_caption_text ? " is-active" : ""}">
          <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_use_figure_caption"))}</span>
          <span class="smartlink-builder__switch-control">
            <input class="js-figure-caption-text" type="checkbox"${state.figure_caption_text ? " checked" : ""}>
            <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
          </span>
        </label>`);
    }

    const thumbnailFields = [];

    if (showImageOverrideField) {
      thumbnailFields.push(renderImagePickerField(config, state, {
        label: ui("field_image_to_show"),
        fieldName: "image_override",
        value: state.image_override,
        placeholder: ui("placeholder_optional_override"),
        inputClass: "js-image-override",
        buttonClass: "js-image-override-picker",
        clearClass: "js-clear-image-override"
      }));
    }

    if (showAltField) {
      thumbnailFields.push(`
        <label class="smartlink-builder__field">
          <span>${esc(ui("field_alternative_text"))}</span>
          <input class="form-control js-preview-alt" type="text" value="${esc(state.preview_alt)}" placeholder="${esc(altHint(state))}">
        </label>`);
    }

    if (showThumbnailSettings) {
      thumbnailFields.push(`
        <div class="smartlink-builder__field smartlink-builder__field--span-2 smartlink-builder__field--switches smartlink-builder__field--switch-inline">
          <label class="smartlink-builder__switch-row${state.thumbnail_override ? " is-active" : ""}">
            <span class="smartlink-builder__switch-row-label">${esc(ui("field_override_defaults"))}</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-thumbnail-override" type="checkbox"${state.thumbnail_override ? " checked" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>
        </div>`);
    }

    if (showThumbnailLayoutControls) {
      thumbnailFields.push(`
        <label class="smartlink-builder__field">
          <span>${esc(ui("field_position"))}</span>
          <select class="form-select js-thumbnail-position">
            ${withInheritOption(THUMBNAIL_POSITIONS).map((option) => `<option value="${esc(option[0])}"${option[0] === state.thumbnail_position ? " selected" : ""}>${esc(uiOptionLabel(option))}</option>`).join("")}
          </select>
        </label>`);
      thumbnailFields.push(`
        <label class="smartlink-builder__field">
          <span>${esc(ui("field_ratio"))}</span>
          <select class="form-select js-thumbnail-ratio">
            ${withInheritOption(THUMBNAIL_RATIOS).map((option) => `<option value="${esc(option[0])}"${option[0] === state.thumbnail_ratio ? " selected" : ""}>${esc(uiOptionLabel(option))}</option>`).join("")}
          </select>
        </label>`);
      thumbnailFields.push(`
        <label class="smartlink-builder__field">
          <span>${esc(ui("field_fit"))}</span>
          <select class="form-select js-thumbnail-fit">
            ${withInheritOption(THUMBNAIL_FITS).map((option) => `<option value="${esc(option[0])}"${option[0] === state.thumbnail_fit ? " selected" : ""}>${esc(uiOptionLabel(option))}</option>`).join("")}
          </select>
        </label>`);
      thumbnailFields.push(`
        <label class="smartlink-builder__field">
          <span>${esc(ui("field_size"))}</span>
          <select class="form-select js-thumbnail-size">
            ${withInheritOption(THUMBNAIL_SIZES).map((option) => `<option value="${esc(option[0])}"${option[0] === state.thumbnail_size ? " selected" : ""}>${esc(uiOptionLabel(option))}</option>`).join("")}
          </select>
        </label>`);
    }

    if (showThumbnailEmptyClassField) {
      thumbnailFields.push(`
        <label class="smartlink-builder__field smartlink-builder__field--span-3">
          <span>${esc(ui("field_empty_class"))}</span>
          <input class="form-control js-thumbnail-empty-class" type="text" value="${esc(state.thumbnail_empty_class)}" placeholder="${esc(defaultThumbnailEmptyClass(state))}">
        </label>`);
    }

    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">${esc(ui("section_advanced"))}</h4>
        <div class="smartlink-builder__grid">
          <label class="smartlink-builder__field">
            <span>${esc(ui("field_structure"))}</span>
            <select class="form-select js-structure">
              ${STRUCTURES.map((option) => `<option value="${esc(option[0])}"${option[0] === state.structure ? " selected" : ""}>${esc(uiOptionLabel(option))}</option>`).join("")}
            </select>
          </label>
          ${showPreviewImageField ? `
            ${renderImagePickerField(config, state, {
              label: ui("field_popup_image_override"),
              fieldName: "preview_image",
              value: state.preview_image,
              placeholder: ui("placeholder_optional_popup_image"),
              inputClass: "js-preview-image",
              buttonClass: "js-preview-image-picker",
              clearClass: "js-clear-preview-image"
            })}` : ""}
          ${state.show_icon ? `
            ${renderIconClassField(config, state)}` : ""}
          <label class="smartlink-builder__field"><span>${esc(ui("field_css_class"))}</span><input class="form-control js-css" type="text" value="${esc(state.css_class)}"></label>
          <label class="smartlink-builder__field"><span>${esc(ui("field_title"))}</span><input class="form-control js-title" type="text" value="${esc(state.title)}"></label>
          ${showTargetField ? `<label class="smartlink-builder__field"><span>${esc(ui("field_open_in"))}</span><input class="form-control js-target" type="text" value="${esc(state.target)}" placeholder="_blank"></label>` : ""}
          ${showRelField ? `<label class="smartlink-builder__field"><span>${esc(ui("field_rel"))}</span><input class="form-control js-rel" type="text" value="${esc(state.rel)}" placeholder="nofollow"></label>` : ""}
          ${showPopupScopeField ? `
            <label class="smartlink-builder__field">
              <span>${esc(ui("field_page_display"))}</span>
              <select class="form-select js-popup-scope">
                ${contentPopupScopes(state.kind).map((scope) => `<option value="${esc(scope[0])}"${scope[0] === state.popup_scope ? " selected" : ""}>${esc(scope[1])}</option>`).join("")}
              </select>
            </label>` : ""}
          ${showViewPositionField ? `
            <label class="smartlink-builder__field">
              <span>${esc(ui("field_view_on_page_position"))}</span>
              <select class="form-select js-view-position">
                ${VIEW_POSITIONS.map((position) => `<option value="${esc(position[0])}"${position[0] === state.view_position ? " selected" : ""}>${esc(uiOptionLabel(position))}</option>`).join("")}
              </select>
            </label>` : ""}
          ${structureToggles.length ? `
            <div class="smartlink-builder__field smartlink-builder__field--full smartlink-builder__field--switches">
              <span aria-hidden="true">&nbsp;</span>
              <div class="smartlink-builder__switch-list smartlink-builder__switch-list--advanced-inline">
                ${structureToggles.join("")}
              </div>
            </div>` : ""}
        </div>
        ${showThumbnailPanel ? `
          <div class="smartlink-builder__subsection">
            <h5 class="smartlink-builder__subsection-title">${esc(ui("subsection_thumbnail_overrides"))}</h5>
            <div class="smartlink-builder__grid">
              ${thumbnailFields.join("")}
            </div>
          </div>` : ""}
        <div class="smartlink-builder__switch-list smartlink-builder__switch-list--five smartlink-builder__linked-parts">
          <label class="smartlink-builder__switch-row smartlink-builder__switch-row--linked-main${state.click_individual_parts ? " is-active" : ""}${!canToggleIndividualParts ? " is-disabled" : ""}" title="${esc(ui("tooltip_linked_parts"))}">
            <span class="smartlink-builder__switch-control">
              <input class="js-click-individual-parts" type="checkbox"${state.click_individual_parts ? " checked" : ""}${!canToggleIndividualParts ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
            <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_linked_parts"))}</span>
          </label>
          ${state.click_individual_parts ? `
            <label class="smartlink-builder__switch-row smartlink-builder__switch-row--part smartlink-builder__switch-row--thumbnail${state.click_image ? " is-active" : ""}${(!availableClickParts.has("thumbnail") || isClickPartLocked(state, "thumbnail")) ? " is-disabled" : ""}">
              <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_thumbnail"))}</span>
              <span class="smartlink-builder__switch-control">
                <input class="js-click-image" type="checkbox"${state.click_image ? " checked" : ""}${(!availableClickParts.has("thumbnail") || isClickPartLocked(state, "thumbnail")) ? " disabled" : ""}>
                <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
              </span>
            </label>
            <label class="smartlink-builder__switch-row smartlink-builder__switch-row--part smartlink-builder__switch-row--icon${state.click_icon ? " is-active" : ""}${(!availableClickParts.has("icon") || isClickPartLocked(state, "icon")) ? " is-disabled" : ""}">
              <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_icon"))}</span>
              <span class="smartlink-builder__switch-control">
                <input class="js-click-icon" type="checkbox"${state.click_icon ? " checked" : ""}${(!availableClickParts.has("icon") || isClickPartLocked(state, "icon")) ? " disabled" : ""}>
                <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
              </span>
            </label>
            <label class="smartlink-builder__switch-row smartlink-builder__switch-row--part smartlink-builder__switch-row--text${state.click_text ? " is-active" : ""}${(!availableClickParts.has("text") || isClickPartLocked(state, "text")) ? " is-disabled" : ""}">
              <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_text"))}</span>
              <span class="smartlink-builder__switch-control">
                <input class="js-click-text" type="checkbox"${state.click_text ? " checked" : ""}${(!availableClickParts.has("text") || isClickPartLocked(state, "text")) ? " disabled" : ""}>
                <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
              </span>
            </label>
            <label class="smartlink-builder__switch-row smartlink-builder__switch-row--part smartlink-builder__switch-row--view${state.click_view ? " is-active" : ""}${clickViewDisabled ? " is-disabled" : ""}">
              <span class="smartlink-builder__switch-row-label">${esc(ui("toggle_view_on_page"))}</span>
              <span class="smartlink-builder__switch-control">
                <input class="js-click-view" type="checkbox"${state.click_view ? " checked" : ""}${clickViewDisabled ? " disabled" : ""}>
                <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
              </span>
            </label>` : ""}
        </div>
        ${(state.kind === "video" || state.kind === "gallery") ? `
          <div class="smartlink-builder__panel smartlink-builder__grid">
            ${state.kind === "video" ? `
              <label><input class="js-video-controls" type="checkbox"${state.video.controls ? " checked" : ""}> ${esc(ui("video_show_controls"))}</label>
              <label><input class="js-video-autoplay" type="checkbox"${state.video.autoplay ? " checked" : ""}> ${esc(ui("video_autoplay"))}</label>
              <label><input class="js-video-loop" type="checkbox"${state.video.loop ? " checked" : ""}> ${esc(ui("video_repeat"))}</label>
              <label><input class="js-video-muted" type="checkbox"${state.video.muted ? " checked" : ""}> ${esc(ui("video_start_muted"))}</label>
              <label class="smartlink-builder__field">
                <span>${esc(ui("field_poster_image"))}</span>
                <div class="smartlink-builder__input-wrap smartlink-builder__input-wrap--picker smartlink-builder__input-wrap--with-prefix">
                  <button class="smartlink-builder__input-thumb smartlink-builder__input-prefix-button js-clear-video-poster${imageFieldPreview(state, "video_poster") ? " has-image" : " is-empty"}${String(state.video.poster || "").trim() ? " has-clear" : ""}" type="button" title="${esc(ui("button_clear"))}" aria-label="${esc(ui("button_clear"))}"${imageFieldPreview(state, "video_poster") ? ` style="background-image:url('${esc(imageFieldPreview(state, "video_poster"))}')"` : ""}></button>
                  <input class="form-control js-video-poster" type="url" value="${esc(state.video.poster)}">
                  <button class="btn btn-outline-secondary smartlink-builder__input-picker js-video-poster-picker" type="button" title="${esc(ui("button_choose_image"))}" aria-label="${esc(ui("button_choose_image"))}">
                    <span class="fa-regular fa-image" aria-hidden="true"></span>
                  </button>
                </div>
              </label>` : ""}
            ${state.kind === "gallery" ? `
              <label class="smartlink-builder__field"><span>${esc(ui("field_columns"))}</span><input class="form-control js-gallery-columns" type="number" min="1" value="${esc(state.gallery.columns)}"></label>
              <label class="smartlink-builder__field"><span>${esc(ui("field_gap"))}</span><input class="form-control js-gallery-gap" type="number" min="0" value="${esc(state.gallery.gap)}"></label>
              <label class="smartlink-builder__field">
                <span>${esc(ui("field_how_items_fit"))}</span>
                <select class="form-select js-gallery-size">
                  <option value="cover"${state.gallery.image_size_mode === "cover" ? " selected" : ""}>${esc(ui("gallery_fit_fill_space"))}</option>
                  <option value="contain"${state.gallery.image_size_mode === "contain" ? " selected" : ""}>${esc(ui("gallery_fit_show_whole"))}</option>
                  <option value="stretch"${state.gallery.image_size_mode === "stretch" ? " selected" : ""}>${esc(ui("gallery_fit_stretch"))}</option>
                  <option value="stretch_width"${state.gallery.image_size_mode === "stretch_width" ? " selected" : ""}>${esc(ui("gallery_fit_stretch_width"))}</option>
                  <option value="stretch_height"${state.gallery.image_size_mode === "stretch_height" ? " selected" : ""}>${esc(ui("gallery_fit_stretch_height"))}</option>
                </select>
              </label>` : ""}
          </div>` : ""}
      </section>`;
  }

  function renderBody(config, state) {
    return state._view === "advanced"
      ? renderAdvanced(config, state)
      : `<div class="smartlink-builder__two-up">${renderGeneral(state)}${renderBehavior(config, state)}</div>${renderContent(state)}`;
  }

  function renderPreview() {
    return `
      <section class="smartlink-builder__section smartlink-builder__section--preview">
        <h4 class="smartlink-builder__section-title">${esc(ui("section_preview"))}</h4>
        <iframe class="smartlink-builder__preview-frame js-smartlink-preview-frame" title="${esc(ui("preview_frame_title"))}"></iframe>
      </section>`;
  }

  function render(root, state, config) {
    const payload = payloadFrom(state);
    root._smartlinkPreviewMarkup = hasPreviewValue(payload)
      ? buildMarkup(config, payload)
      : buildPreviewPlaceholder(config, payload);
    root._smartlinkPreviewStructure = String(payload.structure || "inline");
    root._smartlinkPreviewHasView = Boolean(payload.display_inside);

    root.innerHTML = `
      <div class="smartlink-builder__shell">
        <div class="smartlink-builder__layout">
          <aside class="smartlink-builder__rail">
            ${groups(config, state.kind).map((group) => {
              const expanded = isRailGroupExpanded(state, group[0]);
              return `
              <div class="smartlink-builder__rail-group">
                <button
                  type="button"
                  class="smartlink-builder__rail-title smartlink-builder__rail-title-toggle${expanded ? "" : " is-collapsed"} js-rail-toggle"
                  data-group="${esc(group[0])}"
                  aria-expanded="${expanded ? "true" : "false"}"
                  title="${esc(ui("rail_switch_section"))}"
                >
                  <span class="smartlink-builder__rail-chevron" aria-hidden="true">&#9662;</span>
                  <span class="smartlink-builder__rail-title-label">${esc(group[1])}</span>
                </button>
                <div class="smartlink-builder__rail-list${expanded ? "" : " is-collapsed"}">
                  ${group[2].map((kind) => `<button type="button" class="smartlink-builder__kind-button${kind === state.kind ? " is-active" : ""} js-kind-nav" data-kind="${esc(kind)}">${esc(meta(kind).l)}</button>`).join("")}
                </div>
              </div>`;
            }).join("")}
          </aside>
          <div class="smartlink-builder__content">
            <nav class="smartlink-builder__tabs" aria-label="${esc(ui("aria_sections"))}">
              <button type="button" class="smartlink-builder__tab${state._view === "main" ? " is-active" : ""} js-view" data-view="main">${esc(ui("tab_general"))}</button>
              <button type="button" class="smartlink-builder__tab${state._view === "advanced" ? " is-active" : ""} js-view" data-view="advanced">${esc(ui("tab_advanced"))}</button>
            </nav>
            ${renderPreview()}
            <div class="smartlink-builder__body js-smartlink-body">${renderBody(config, state)}</div>
          </div>
        </div>
      </div>`;

  }

  function updateViewOnly(root, state, config) {
    root.querySelectorAll(".smartlink-builder__tab").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === state._view);
    });

    const body = root.querySelector(".js-smartlink-body");

    if (body) {
      body.innerHTML = renderBody(config, state);
    }
  }

  function siteBasePath() {
    const pathname = String(window.location.pathname || "/");
    const adminIndex = pathname.toLowerCase().indexOf("/administrator");
    const basePath = adminIndex >= 0 ? pathname.slice(0, adminIndex) : pathname.replace(/[^/]*$/, "");

    if (!basePath) {
      return "/";
    }

    return basePath.endsWith("/") ? basePath : `${basePath}/`;
  }

  function previewUrl(value) {
    const raw = String(value || "").trim();

    if (!raw || raw.startsWith("#") || /^(https?:)?\/\//i.test(raw) || /^(data|blob):/i.test(raw)) {
      return raw;
    }

    if (raw.startsWith("/")) {
      return `${window.location.origin}${raw}`;
    }

    try {
      return new URL(raw, `${window.location.origin}${siteBasePath()}`).toString();
    } catch (error) {
      return raw;
    }
  }

  function previewContextData(config) {
    return config?.preview_context && typeof config.preview_context === "object"
      ? config.preview_context
      : {};
  }

  function absolutePreviewAssetUrl(value, baseHref = "") {
    const raw = String(value || "").trim();

    if (!raw) {
      return "";
    }

    if (/^(data|blob):/i.test(raw)) {
      return raw;
    }

    try {
      return new URL(raw, baseHref || siteRootUrl()).toString();
    } catch (error) {
      return previewUrl(raw);
    }
  }

  function previewDocumentBase(config) {
    const context = previewContextData(config);
    const rawBase = String(context.document_base_url || "").trim();

    return absolutePreviewAssetUrl(rawBase || siteRootUrl(), window.location.origin);
  }

  function versionedSmartlinkAssetUrl(href, config) {
    const raw = String(href || "").trim();
    const version = String(config?.asset_version || "").trim();

    if (!raw || !version) {
      return raw;
    }

    if (!/\/media\/plg_fields_smartlink\/smartlink-content\.(css|js)(?:[?#].*)?$/i.test(raw)) {
      return raw;
    }

    try {
      const url = new URL(raw, siteRootUrl());
      url.searchParams.set("v", version);
      return url.toString();
    } catch (error) {
      const separator = raw.includes("?") ? "&" : "?";
      return `${raw}${separator}v=${encodeURIComponent(version)}`;
    }
  }

  function previewStylesheetUrls(config) {
    const context = previewContextData(config);
    const baseHref = previewDocumentBase(config);
    const urls = [
      ...(useSmartlinkStyles(config) ? [versionedSmartlinkAssetUrl(DEFAULT_CONTENT_STYLESHEET_URL, config)] : []),
      ...list(context.content_css),
      String(config?.icon_stylesheet_url || DEFAULT_ICON_STYLESHEET_URL).trim()
    ]
      .map((href) => absolutePreviewAssetUrl(href, baseHref))
      .filter(Boolean);

    return Array.from(new Set(urls));
  }

  function previewScriptUrls(config) {
    const baseHref = previewDocumentBase(config);
    const urls = [versionedSmartlinkAssetUrl(DEFAULT_CONTENT_SCRIPT_URL, config)]
      .map((href) => absolutePreviewAssetUrl(href, baseHref))
      .filter(Boolean);

    return Array.from(new Set(urls));
  }

  function previewDocumentHtml(config, markup, structure = "inline") {
    const context = previewContextData(config);
    const baseHref = previewDocumentBase(config);
    const stylesheetUrls = previewStylesheetUrls(config);
    const scriptUrls = previewScriptUrls(config);
    const hasContentCss = list(context.content_css).some((href) => String(href || "").trim() !== "");
    const bodyClass = String(context.body_class || "").trim();
    const contentStyle = String(context.content_style || "");
    const previewStructure = ["inline", "block", "figure"].includes(String(structure || ""))
      ? String(structure || "")
      : "inline";

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <base href="${esc(baseHref)}">
    <style>${escapeStyleText(PREVIEW_FRAME_RESET_CSS)}</style>
    <style>${escapeStyleText(PREVIEW_FRAME_SMARTLINK_CSS)}</style>
    ${hasContentCss ? "" : `<style>${escapeStyleText(previewFrameFallbackCss(context))}</style>`}
    ${stylesheetUrls.map((href) => `<link rel="stylesheet" href="${esc(href)}">`).join("")}
    ${contentStyle ? `<style>${escapeStyleText(contentStyle)}</style>` : ""}
  </head>
  <body${bodyClass ? ` class="${esc(bodyClass)}"` : ""}>
    <div class="smartlink-preview-root smartlink-preview-root--${esc(previewStructure)}">
      ${markup}
    </div>
    ${scriptUrls.map((src) => `<script src="${esc(src)}"></script>`).join("")}
  </body>
</html>`;
  }

  function resizePreviewFrame(frame) {
    if (frame?._smartlinkPreviewSkipResize) {
      frame.style.height = "";
      return;
    }

    const doc = frame?.contentDocument;
    const body = doc?.body;
    const html = doc?.documentElement;

    if (!body || !html) {
      return;
    }

    const minHeight = Number(frame?._smartlinkPreviewMinHeight || 180);
    const height = Math.max(
      body.scrollHeight || 0,
      body.offsetHeight || 0,
      html.scrollHeight || 0,
      html.offsetHeight || 0,
      minHeight
    );

    const maxHeight = Number(frame?._smartlinkPreviewMaxHeight || 420);
    frame.style.height = `${Math.min(Math.max(height + 2, minHeight), maxHeight)}px`;
  }

  function schedulePreviewFrameResize(frame) {
    const timers = Array.isArray(frame?._smartlinkPreviewTimers) ? frame._smartlinkPreviewTimers : [];
    timers.forEach((timer) => window.clearTimeout(timer));
    frame._smartlinkPreviewTimers = [0, 60, 180, 360].map((delay) => window.setTimeout(() => {
      resizePreviewFrame(frame);
    }, delay));
  }

  function showPreviewAction(url) {
    const message = String(url || "").trim();

    if (!window.HTMLDialogElement) {
      window.alert(`Φόρτωση του URL:\n${message}`);
      return;
    }

    const dialog = document.createElement("dialog");
    dialog.className = "smartlink-preview-dialog smartlink-preview-dialog--notice";
    dialog.innerHTML = `
      <div class="smartlink-preview-dialog__shell">
        <div class="smartlink-preview-dialog__header">
          <strong>${esc(ui("dialog_preview_action_title"))}</strong>
          <button type="button" class="btn-close js-close" aria-label="${esc(ui("dialog_close"))}"></button>
        </div>
        <div class="smartlink-preview-dialog__body smartlink-preview-dialog__body--notice">
          <p class="smartlink-preview-dialog__message">Φόρτωση του URL:</p>
          <code class="smartlink-preview-dialog__url">${esc(message)}</code>
        </div>
      </div>`;

    dialog.querySelector(".js-close").addEventListener("click", () => {
      dialog.close();
      dialog.remove();
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
        dialog.remove();
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  }

  function initialisePreviewFrame(frame) {
    const doc = frame?.contentDocument;
    const body = doc?.body;
    const frameWindow = frame?.contentWindow;

    if (!doc || !body || !frameWindow) {
      return;
    }

    const resize = () => resizePreviewFrame(frame);
    const clickHandler = (event) => {
      const target = event.target;
      if (!target || target.nodeType !== 1 || typeof target.closest !== "function") {
        return;
      }

      const toggle = target.closest("[data-toggle-view='1']");
      if (toggle) {
        event.preventDefault();
        event.stopPropagation();

        if (typeof frameWindow.SuperSoftSmartLinkContent?.toggleView === "function") {
          frameWindow.SuperSoftSmartLinkContent.toggleView(toggle);
        } else {
          const targetId = String(toggle.getAttribute("aria-controls") || "").trim();
          const targetNode = targetId ? doc.getElementById(targetId) : null;

          if (targetNode) {
            const expanded = targetNode.hasAttribute("hidden");

            if (expanded) {
              [targetNode, ...targetNode.querySelectorAll("[data-src]")].forEach((node) => {
                if (!(node instanceof Element) || !node.hasAttribute("data-src")) {
                  return;
                }

                const src = String(node.getAttribute("data-src") || "").trim();

                if (!src) {
                  return;
                }

                if (node.matches(".smartlink-view[data-src]")) {
                  let iframe = node.querySelector(":scope > iframe");

                  if (!(iframe instanceof Element)) {
                    iframe = doc.createElement("iframe");
                    node.appendChild(iframe);
                  }

                  if (!iframe.getAttribute("src")) {
                    iframe.setAttribute("src", src);
                  }

                  if (String(node.getAttribute("data-allowfullscreen") || "").trim() === "1") {
                    iframe.setAttribute("allowfullscreen", "");
                  }

                  return;
                }

                if (!node.getAttribute("src")) {
                  node.setAttribute("src", src);
                }
              });
              targetNode.removeAttribute("hidden");
            } else {
              targetNode.setAttribute("hidden", "hidden");
            }

            toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
          }
        }

        schedulePreviewFrameResize(frame);
        return;
      }

      const link = target.closest("a[href]");
      if (!link) {
        return;
      }

      if (link.closest(".smartlink-view")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      showPreviewAction(link.href || link.getAttribute("href") || "");
    };

    doc.addEventListener("click", clickHandler);

    const observer = new frameWindow.MutationObserver(() => {
      schedulePreviewFrameResize(frame);
    });
    observer.observe(body, { childList: true, subtree: true, attributes: true, characterData: true });

    doc.querySelectorAll("img, video, iframe").forEach((node) => {
      node.addEventListener("load", resize);
      node.addEventListener("error", resize);
    });
    doc.querySelectorAll("link[rel=\"stylesheet\"]").forEach((node) => {
      node.addEventListener("load", resize);
      node.addEventListener("error", resize);
    });
    frameWindow.addEventListener("resize", resize);

    frame._smartlinkPreviewCleanup = () => {
      observer.disconnect();
      doc.removeEventListener("click", clickHandler);
      frameWindow.removeEventListener("resize", resize);
      const timers = Array.isArray(frame._smartlinkPreviewTimers) ? frame._smartlinkPreviewTimers : [];
      timers.forEach((timer) => window.clearTimeout(timer));
      frame._smartlinkPreviewTimers = [];
    };

    schedulePreviewFrameResize(frame);
  }

  function hydratePreview(root) {
    const frame = root.querySelector(".js-smartlink-preview-frame");

    if (!frame) {
      return;
    }

    if (typeof frame._smartlinkPreviewCleanup === "function") {
      frame._smartlinkPreviewCleanup();
      frame._smartlinkPreviewCleanup = null;
    }

    const config = root._smartlinkConfig || {};
    const markup = String(root._smartlinkPreviewMarkup || "");
    const structure = String(root._smartlinkPreviewStructure || "inline");
    const inDialog = Boolean(root.closest(".smartlink-builder-dialog"));
    frame._smartlinkPreviewSkipResize = inDialog;
    frame._smartlinkPreviewMinHeight = inDialog ? 140 : 180;
    frame._smartlinkPreviewMaxHeight = inDialog ? 220 : 280;

    frame.onload = () => {
      initialisePreviewFrame(frame);
    };
    frame.srcdoc = previewDocumentHtml(config, markup, structure);
  }

  function addGalleryItem(state, config, item) {
    const items = Array.isArray(state.value) ? state.value.slice() : [];
    const max = Number(config.max_gallery_items || 12);
    if (!item?.src || items.length >= max || items.some((current) => current.src === item.src && (current.type || "image") === (item.type || "image"))) {
      return;
    }
    items.push({ type: item.type || "image", src: item.src, label: item.label || "", poster: item.poster || "" });
    state.value = items;
    state.selection_label = `${items.length} item${items.length === 1 ? "" : "s"} selected`;
  }

  function mount(root, options = {}) {
    const input = options.input || document.getElementById(root.dataset.inputId || "");
    const config = applyUiStrings({ ...(options.config || parseJSON(root.dataset.config, {})) });
    const computed = window.getComputedStyle(root);
    const previewContext = config.preview_context && typeof config.preview_context === "object"
      ? { ...config.preview_context }
      : {};
    if (!String(previewContext.font_family || "").trim()) {
      previewContext.font_family = computed.fontFamily || "";
    }
    if (!String(previewContext.font_size || "").trim()) {
      previewContext.font_size = computed.fontSize || "";
    }
    if (!String(previewContext.line_height || "").trim()) {
      previewContext.line_height = computed.lineHeight || "";
    }
    if (!String(previewContext.text_color || "").trim()) {
      previewContext.text_color = computed.color || "";
    }
    config.preview_context = previewContext;
    config.instance_id = String(config.instance_id || root.dataset.inputId || root.id || `smartlink-${Math.random().toString(36).slice(2, 10)}`);
    root._smartlinkConfig = config;
    const state = makeState(config, parseJSON(input?.value, {}));
    const isFieldInput = Boolean(root.dataset.inputId);
    let pendingRailSwitchTimer = 0;
    let pendingRailTargetGroup = "";
    let pendingRailNextKind = "";

    const repaint = () => {
      normaliseImplicitFieldValues(state);
      const payload = payloadFrom(state);
      render(root, state, config);
      hydratePreview(root);
      if (input) {
        input.value = !isFieldInput || hasPersistableValue(payload) ? JSON.stringify(payload) : "";
      }
    };

    const refreshIconFieldUi = () => {
      const inputField = root.querySelector(".js-icon-class");
      const prefix = root.querySelector(".js-clear-icon-class .smartlink-icon");

      if (!inputField || !prefix) {
        return;
      }

      const value = String(inputField.value || "");
      prefix.className = `smartlink-icon ${iconClassName(value, state.kind)}`;
    };

    ensureBuilderIconStylesheet(config, () => {
      ICON_SUGGESTION_CACHE.delete(iconStylesheetUrls(config).join("|") || "__default__");
      repaint();
    });

    const cancelPendingRailSwitch = () => {
      if (pendingRailSwitchTimer) {
        window.clearTimeout(pendingRailSwitchTimer);
        pendingRailSwitchTimer = 0;
      }
      pendingRailTargetGroup = "";
      pendingRailNextKind = "";
    };

    const findRailToggle = (groupKey) => {
      return Array.from(root.querySelectorAll(".js-rail-toggle")).find((button) => (button.dataset.group || "") === groupKey) || null;
    };

    const setRailGroupExpanded = (groupKey, expanded) => {
      const toggle = findRailToggle(groupKey);
      if (!toggle) {
        return;
      }

      toggle.classList.toggle("is-collapsed", !expanded);
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");

      const list = toggle.nextElementSibling;
      if (list && list.classList.contains("smartlink-builder__rail-list")) {
        list.classList.toggle("is-collapsed", !expanded);
      }
    };

    root.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.classList.contains("js-source")) {
        const nextSource = target.value || "";
        if (nextSource !== state.source_type) {
          state.source_type = nextSource;
          state.value = state.kind === "gallery" ? [] : (state.kind === "com_tags_tag" ? [] : "");
          state.selection_label = "";
          state.selection_items = [];
          state.selection_summary = "";
          state.selection_href = "";
          state.selection_image = "";
          state.selection_image_alt = "";
          state.image_override = "";
          markCanonicalState(state, true);
        }
        repaint();
        return;
      }
      if (target.classList.contains("js-gallery-manual-src") || target.classList.contains("js-gallery-manual-label")) {
        return;
      }
      sync(root, state);
      markCanonicalState(state);
      repaint();
    });

    root.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.classList.contains("js-icon-class")) {
        refreshIconFieldUi();
      }
    });

    root.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }

      if (!button.classList.contains("js-rail-toggle") && pendingRailSwitchTimer) {
        cancelPendingRailSwitch();
      }

      if (button.classList.contains("js-clear-icon-class")) {
        state.icon_class = "";
        markCanonicalState(state, true);
        repaint();
        return;
      }

      if (button.classList.contains("js-clear-image-override")) {
        state.image_override = "";
        markCanonicalState(state, true);
        repaint();
        return;
      }

      if (button.classList.contains("js-clear-preview-image")) {
        state.preview_image = "";
        markCanonicalState(state, true);
        repaint();
        return;
      }

      if (button.classList.contains("js-clear-video-poster")) {
        state.video.poster = "";
        markCanonicalState(state, true);
        repaint();
        return;
      }

      if (button.classList.contains("js-rail-toggle")) {
        const groupKey = button.dataset.group || "";
        if (!groupKey) {
          return;
        }
        const currentGroup = pendingRailTargetGroup || activeGroupKey(state);
        if (groupKey === currentGroup) {
          return;
        }
        const group = groups(config, state.kind).find((entry) => entry[0] === groupKey);
        const nextKind = group?.[2]?.[0];
        if (!nextKind) {
          return;
        }

        sync(root, state);
        cancelPendingRailSwitch();
        setRailGroupExpanded(currentGroup, false);
        setRailGroupExpanded(groupKey, true);
        pendingRailTargetGroup = groupKey;
        pendingRailNextKind = nextKind;
        pendingRailSwitchTimer = window.setTimeout(() => {
          pendingRailSwitchTimer = 0;
          pendingRailTargetGroup = "";
          const kindToApply = pendingRailNextKind || nextKind;
          pendingRailNextKind = "";
          resetKind(state, config, kindToApply);
          repaint();
        }, 360);
        return;
      }

      if (button.classList.contains("js-kind-nav")) {
        sync(root, state);
        resetKind(state, config, button.dataset.kind || state.kind);
        repaint();
        return;
      }

      if (button.classList.contains("js-view")) {
        sync(root, state);
        state._view = button.dataset.view === "advanced" ? "advanced" : "main";
        updateViewOnly(root, state, config);
        if (input) {
          const payload = payloadFrom(state);
          input.value = !isFieldInput || hasPersistableValue(payload) ? JSON.stringify(payload) : "";
        }
        return;
      }

      if (button.classList.contains("js-clear")) {
        state.value = state.kind === "gallery" ? [] : (state.kind === "com_tags_tag" ? [] : "");
        state.selection_label = "";
        state.selection_items = [];
        state.selection_summary = "";
        state.selection_href = "";
        state.selection_image = "";
        state.selection_image_alt = "";
        state.image_override = "";
        markCanonicalState(state, true);
        repaint();
        return;
      }

      if (button.classList.contains("js-gallery-remove")) {
        const index = Number(button.dataset.index || -1);
        const items = Array.isArray(state.value) ? state.value.slice() : [];
        state.value = items.filter((_, itemIndex) => itemIndex !== index);
        state.selection_label = "";
        markCanonicalState(state, true);
        repaint();
        return;
      }

      if (button.classList.contains("js-gallery-add-manual")) {
        const src = root.querySelector(".js-gallery-manual-src")?.value?.trim() || "";
        const label = root.querySelector(".js-gallery-manual-label")?.value?.trim() || "";
        if (!src) {
          return;
        }
        addGalleryItem(state, config, {
          type: state.source_type === "provider" || looksLikeVideo(src) ? "video" : "image",
          src,
          label,
          poster: ""
        });
        markCanonicalState(state, true);
        repaint();
        return;
      }

      if (
        (button.classList.contains("js-image-override-picker")
          || button.classList.contains("js-preview-image-picker")
          || button.classList.contains("js-video-poster-picker"))
        && window.SuperSoftSmartLinkPickers
      ) {
        sync(root, state);
        const currentValue = button.classList.contains("js-image-override-picker")
          ? state.image_override
          : button.classList.contains("js-preview-image-picker")
            ? state.preview_image
            : state.video.poster;

        window.SuperSoftSmartLinkPickers.open("image", {
          currentValue,
          ui_strings: config.ui_strings || {}
        }).then((selection) => {
          if (selection === null) {
            return;
          }

          const nextValue = selection && typeof selection === "object" && !Array.isArray(selection)
            ? String(selection.value || "")
            : String(selection || "");

          if (button.classList.contains("js-image-override-picker")) {
            state.image_override = nextValue;
          } else if (button.classList.contains("js-preview-image-picker")) {
            state.preview_image = nextValue;
          } else {
            state.video.poster = nextValue;
          }

          markCanonicalState(state, true);
          repaint();
        });
        return;
      }

      if (button.classList.contains("js-picker") && window.SuperSoftSmartLinkPickers) {
        sync(root, state);
        window.SuperSoftSmartLinkPickers.open(state.kind, {
          currentValue: state.value,
          currentItems: state.kind === "com_tags_tag" ? state.selection_items : [],
          ui_strings: config.ui_strings || {}
        }).then((selection) => {
          if (selection === null) {
            return;
          }
          if (state.kind === "gallery") {
            (Array.isArray(selection?.value) ? selection.value : []).forEach((item) => addGalleryItem(state, config, item));
            markCanonicalState(state, true);
            repaint();
            return;
          }
          if (selection && typeof selection === "object" && !Array.isArray(selection) && Object.prototype.hasOwnProperty.call(selection, "value")) {
            state.value = Array.isArray(selection.value) ? selection.value : String(selection.value || "");
            state.selection_label = String(selection.label || "");
            state.selection_items = Array.isArray(selection.items)
              ? selection.items.filter((item) => item && item.id).map((item) => ({ id: String(item.id || ""), label: String(item.label || "") }))
              : [];
            state.selection_summary = String(selection.summary || "");
            state.selection_href = String(selection.href || "");
            state.selection_image = String(selection.image || "");
            state.selection_image_alt = String(selection.image_alt || selection.label || "");
            if (!state.label && selection.label && state.action === "link_open" && !["image", "video", "com_content_article", "com_content_category", "com_tags_tag"].includes(state.kind)) {
              state.label = String(selection.label);
            }
            markCanonicalState(state, true);
            hydrateSelectionState(state, repaint);
          } else {
            state.value = Array.isArray(selection) ? selection : String(selection || "");
            markCanonicalState(state, true);
          }
          repaint();
        });
      }
    });

    repaint();
    hydrateSelectionState(state, repaint);

    return {
      clear() {
        clearCurrentState(state, config);
        repaint();
      },
      getPayload() {
        if (pendingRailSwitchTimer && pendingRailNextKind) {
          const queuedKind = pendingRailNextKind;
          cancelPendingRailSwitch();
          resetKind(state, config, queuedKind);
        }

        sync(root, state);
        repaint();

        return payloadFrom(state);
      },
      getPayloadAsync() {
        if (pendingRailSwitchTimer && pendingRailNextKind) {
          const queuedKind = pendingRailNextKind;
          cancelPendingRailSwitch();
          resetKind(state, config, queuedKind);
        }

        sync(root, state);

        return ensureResolvedSelectionHref(state).then(() => {
          repaint();
          return payloadFrom(state);
        });
      }
    };
  }

  function preview(link) {
    if (!window.HTMLDialogElement) {
      return;
    }

    const dialog = document.createElement("dialog");
    const src = link.dataset.previewImage || link.getAttribute("href") || "#";
    const body = link.dataset.previewImage
      ? `<img src="${esc(src)}" alt="${esc(link.dataset.previewAlt || link.textContent || "")}" loading="lazy">`
      : `<iframe src="${esc(src)}" loading="lazy"></iframe>`;

    dialog.className = "smartlink-preview-dialog";
    dialog.innerHTML = `
      <div class="smartlink-preview-dialog__shell">
        <div class="smartlink-preview-dialog__header">
          <strong>${esc(link.getAttribute("title") || link.textContent || ui("dialog_preview_default_title"))}</strong>
          <button type="button" class="btn-close js-close" aria-label="${esc(ui("dialog_close"))}"></button>
        </div>
        <div class="smartlink-preview-dialog__body">${body}</div>
      </div>`;

    dialog.querySelector(".js-close").addEventListener("click", () => {
      dialog.close();
      dialog.remove();
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  }

  function openDialog(options = {}) {
    const dialogConfig = applyUiStrings({ ...(options.config || {}) });

    if (!window.HTMLDialogElement) {
      const raw = window.prompt(ui("dialog_prompt_json"), "");
      const payload = parseJSON(raw, null);
      return Promise.resolve(payload ? { payload, markup: buildMarkup(dialogConfig, payload) } : null);
    }

    return new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      const mountPoint = document.createElement("div");
      const hidden = document.createElement("input");
      dialog.className = "smartlink-builder-dialog";
      hidden.type = "hidden";
      hidden.value = JSON.stringify(options.payload || {});
      mountPoint.className = "smartlink-builder";
      mountPoint.dataset.config = JSON.stringify(dialogConfig);

      dialog.innerHTML = `
        <div class="smartlink-builder-dialog__shell">
          <div class="smartlink-builder-dialog__header">
            <strong>${esc(ui("dialog_builder_title"))}</strong>
            <button type="button" class="btn-close js-close" aria-label="${esc(ui("dialog_close"))}"></button>
          </div>
          <div class="smartlink-builder-dialog__body js-mount"></div>
          <div class="smartlink-builder-dialog__footer">
            <button type="button" class="btn btn-outline-secondary js-clear-dialog">${esc(ui("dialog_clear"))}</button>
            <button type="button" class="btn btn-secondary js-cancel">${esc(ui("dialog_cancel"))}</button>
            <button type="button" class="btn btn-primary js-insert">${esc(ui("dialog_insert"))}</button>
          </div>
        </div>`;

      dialog.querySelector(".js-mount").appendChild(mountPoint);
      dialog.appendChild(hidden);
      document.body.appendChild(dialog);

      const instance = mount(mountPoint, { config: dialogConfig, input: hidden });
      const close = (result) => {
        dialog.close();
        dialog.remove();
        resolve(result);
      };

      dialog.querySelector(".js-close").addEventListener("click", () => close(null));
      dialog.querySelector(".js-clear-dialog").addEventListener("click", () => {
        instance.clear();
      });
      dialog.querySelector(".js-cancel").addEventListener("click", () => close(null));
      dialog.querySelector(".js-insert").addEventListener("click", () => {
        const insertButton = dialog.querySelector(".js-insert");

        if (insertButton) {
          insertButton.disabled = true;
        }

        const payloadAction = typeof instance.getPayloadAsync === "function"
          ? instance.getPayloadAsync()
          : Promise.resolve(instance.getPayload());

        payloadAction
          .then((payload) => {
            close({ payload, markup: buildMarkup(options.config || {}, payload) });
          })
          .finally(() => {
            if (insertButton && insertButton.isConnected) {
              insertButton.disabled = false;
            }
          });
      });

      dialog.showModal();
    });
  }

  function boot() {
    document.querySelectorAll(".js-smartlink-builder").forEach((root) => {
      if (root.dataset.smartlinkMounted === "1") {
        return;
      }
      root.dataset.smartlinkMounted = "1";
      mount(root);
    });
  }

  let observerStarted = false;

  function observe() {
    if (observerStarted || !window.MutationObserver || !document.body) {
      return;
    }
    observerStarted = true;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }
          if (node.matches(".js-smartlink-builder") || node.querySelector(".js-smartlink-builder")) {
            boot();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      boot();
      observe();
    }, { once: true });
  } else {
    boot();
    observe();
  }

  document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive" || document.readyState === "complete") {
      boot();
      observe();
    }
  });
  document.addEventListener("joomla:updated", boot);
  document.addEventListener("click", (event) => {
    const link = event.target.closest(".js-smartlink-preview");
    if (!link) {
      return;
    }
    event.preventDefault();
    preview(link);
  });

  window.SuperSoftSmartLinkBuilder = { boot, mount, buildMarkup, openDialog };
})();
