(() => {
  const ACTIONS = ["no_action", "link_open", "link_download", "preview_modal"];
  const GROUPS = [
    ["simple_links", "Simple Links", ["external_url", "anchor", "email", "phone"]],
    ["joomla_items", "Joomla Items", ["com_content_article", "com_content_category", "menu_item", "com_tags_tag", "com_contact_contact"]],
    ["media", "Media", ["media_file", "image", "video", "gallery"]],
    ["advanced", "Advanced", ["relative_url", "user_profile", "advanced_route"]]
  ];
  const STRUCTURES = [
    ["inline", "Inline"],
    ["block", "Block"],
    ["figure", "Figure"]
  ];
  const VIEW_POSITIONS = [
    ["before", "Before link"],
    ["after", "After link"]
  ];
  const STRUCTURED_CONTENT_KINDS = ["com_content_article", "com_content_category"];
  const METADATA_REQUIRED = ["com_content_article", "com_content_category", "menu_item", "com_tags_tag", "com_contact_contact", "relative_url", "user_profile", "advanced_route", "gallery"];
  const KINDS = {
    external_url: { l: "External Link", g: "simple_links", m: true, d: [["no_action", "No action"], ["link_open", "Open link"], ["link_download", "Download file"], ["preview_modal", "Open in popup"]] },
    anchor: { l: "Anchor", g: "simple_links", m: true, d: [["no_action", "No action"], ["link_open", "Jump to anchor"]] },
    email: { l: "Email", g: "simple_links", m: true, d: [["no_action", "No action"], ["link_open", "Open email link"]] },
    phone: { l: "Phone", g: "simple_links", m: true, d: [["no_action", "No action"], ["link_open", "Open phone link"]] },
    com_content_article: { l: "Article", g: "joomla_items", p: true, r: true, d: [["no_action", "No action"], ["link_open", "Open link"], ["preview_modal", "Open in popup"]] },
    com_content_category: { l: "Category", g: "joomla_items", p: true, r: true, d: [["no_action", "No action"], ["link_open", "Open link"], ["preview_modal", "Open in popup"]] },
    menu_item: { l: "Menu Item", g: "joomla_items", p: true, r: true, d: [["no_action", "No action"], ["link_open", "Open link"]] },
    com_tags_tag: { l: "Tags", g: "joomla_items", p: true, r: true, x: true, d: [["no_action", "No action"], ["link_open", "Open link"]] },
    com_contact_contact: { l: "Contact", g: "joomla_items", p: true, r: true, d: [["no_action", "No action"], ["link_open", "Open link"], ["preview_modal", "Open in popup"]] },
    media_file: { l: "Media File", g: "media", p: true, m: true, s: [["local", "Media Library"], ["external", "Web address"]], d: [["no_action", "No action"], ["link_open", "Open file"], ["link_download", "Download file"], ["preview_modal", "Open in popup"]] },
    image: { l: "Image", g: "media", p: true, m: true, s: [["local", "Media Library"], ["external", "Web address"]], d: [["no_action", "No action"], ["link_open", "Open image"], ["preview_modal", "Open in popup"]] },
    video: { l: "Video", g: "media", p: true, m: true, s: [["local", "Media Library"], ["provider", "YouTube or Vimeo"], ["external", "Direct web address"]], d: [["no_action", "No action"], ["link_open", "Open video"], ["preview_modal", "Open in popup"]] },
    gallery: { l: "Gallery", g: "media", p: true, m: true, r: true, x: true, s: [["local", "Media Library"], ["external", "Web address"], ["provider", "YouTube or Vimeo"]], d: [["no_action", "No action"], ["link_open", "Open items"], ["preview_modal", "Open items in popup"]] },
    relative_url: { l: "Relative Link", g: "advanced", m: true, r: true, d: [["no_action", "No action"], ["link_open", "Open link"], ["link_download", "Download file"], ["preview_modal", "Open in popup"]] },
    user_profile: { l: "User Profile", g: "advanced", m: true, r: true, d: [["no_action", "No action"], ["link_open", "Open link"]] },
    advanced_route: { l: "Advanced Route", g: "advanced", m: true, r: true, d: [["no_action", "No action"], ["link_open", "Open link"]] }
  };

  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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

  function kindCapabilities(kind) {
    const base = {
      icon: { mode: "available", default: false },
      image: { mode: "hidden", default: false },
      text: { mode: "available", default: true },
      displayInside: { mode: "available", default: false },
      summary: false,
      typeLabel: false,
      imageOverride: false,
      popupScope: isStructuredContentKind(kind)
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
      case "menu_item":
      case "com_tags_tag":
      case "user_profile":
      case "advanced_route":
      case "external_url":
      case "relative_url":
        return base;
      case "anchor":
      case "email":
      case "phone":
        return {
          ...base,
          displayInside: { mode: "hidden", default: false }
        };
      case "media_file":
        return {
          ...base,
          image: { mode: "available", default: false },
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
          displayInside: { mode: "available", default: true }
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

    if (capability.mode === "hidden") {
      return false;
    }

    return booleanValue(value, capability.default);
  }

  function isToggleVisible(kind, key) {
    return resolveToggleCapability(kind, key).mode !== "hidden";
  }

  function isToggleFixed(kind, key) {
    return resolveToggleCapability(kind, key).mode === "fixed";
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
    return isStaticAction(action) ? fallbackTag : "a";
  }

  function defaultIconClass(kind) {
    switch (kind) {
      case "anchor":
        return "fa-solid fa-anchor";
      case "email":
        return "fa-solid fa-envelope";
      case "phone":
        return "fa-solid fa-phone";
      case "com_content_article":
        return "fa-regular fa-newspaper";
      case "com_content_category":
        return "fa-regular fa-folder-open";
      case "menu_item":
        return "fa-solid fa-bars";
      case "com_tags_tag":
        return "fa-solid fa-tags";
      case "com_contact_contact":
      case "user_profile":
        return "fa-regular fa-user";
      case "media_file":
        return "fa-regular fa-file";
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

  function normalisePopupScope(kind, value) {
    if (!isStructuredContentKind(kind)) {
      return "";
    }

    return ["component", "page"].includes(value) ? value : "component";
  }

  function contentPopupScopes(kind) {
    if (!isStructuredContentKind(kind)) {
      return [];
    }

    return [
      ["component", "Component only"],
      ["page", "Full page"]
    ];
  }

  function applyPopupScopeToHref(href, payload) {
    const value = String(href || "").trim();

    if (!value || payload.action !== "preview_modal" || !isStructuredContentKind(payload.kind)) {
      return value || "#";
    }

    if ((payload.popup_scope || "component") !== "component" || /([?&])tmpl=component(?:[&#]|$)/.test(value)) {
      return value;
    }

    return `${value}${value.includes("?") ? "&" : "?"}tmpl=component`;
  }

  function structuredContentHref(payload) {
    const id = encodeURIComponent(String(payload.value || "").trim());

    if (!id) {
      return "#";
    }

    const href = payload.kind === "com_content_category"
      ? `index.php?option=com_content&view=category&id=${id}`
      : `index.php?option=com_content&view=article&id=${id}`;

    return applyPopupScopeToHref(href, payload);
  }

  function meta(kind) {
    return KINDS[kind] || { l: kind, g: "advanced", m: true, d: [["link_open", "Open link"]] };
  }

  function kindTypeLabel(kind) {
    return meta(kind).l || "Item";
  }

  function normaliseContentState(state) {
    state.show_icon = resolveToggleState(state.kind, "icon", state.show_icon);
    state.show_image = resolveToggleState(state.kind, "image", state.show_image);
    state.show_text = resolveToggleState(state.kind, "text", state.show_text);
    state.display_inside = resolveToggleState(state.kind, "displayInside", state.display_inside);
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

    if (!state.display_inside && !state.show_icon && !state.show_image && !state.show_text) {
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

  function modes(config, kind) {
    const allowed = list(config.allowed_actions, ACTIONS);
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
      selection_image: String(seed.selection_image || ""),
      selection_image_alt: String(seed.selection_image_alt || ""),
      preview_alt: String(seed.preview_alt || ""),
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
      _view: "main"
    };

    return normaliseContentState(state);
  }

  function resetKind(state, config, kind) {
    state.kind = kind;
    state.value = normaliseValue(kind, kind === "gallery" ? [] : "");
    state.action = defaultAction(config, kind);
    state.selection_label = "";
    state.selection_summary = "";
    state.source_type = defaultSource(kind);
    state.popup_scope = normalisePopupScope(kind, "");
    state.icon_class = "";
    state.download_filename = "";
    state.preview_image = "";
    state.image_override = "";
    state.selection_image = "";
    state.selection_image_alt = "";
    state.preview_alt = "";
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
    normaliseContentState(state);
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
      || Boolean(payload.figure_caption_text);
  }

  function metadataAttr(config, payload) {
    return metadataNeeded(config, payload) ? ` data-smartlink="${esc(JSON.stringify(payload))}"` : "";
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

  function effectiveHref(payload) {
    if (payload.kind === "gallery") {
      return payload.value[0]?.src || "#";
    }

    switch (payload.kind) {
      case "anchor":
        return String(payload.value || "").charAt(0) === "#" ? String(payload.value || "") : `#${String(payload.value || "")}`;
      case "relative_url":
        return normaliseRelativeHref(payload.value) || "#";
      case "email":
        return String(payload.value || "").startsWith("mailto:") ? String(payload.value || "") : `mailto:${String(payload.value || "").trim()}`;
      case "phone":
        return String(payload.value || "").startsWith("tel:") ? String(payload.value || "") : `tel:${String(payload.value || "").trim()}`;
      case "com_content_article":
      case "com_content_category":
        return structuredContentHref(payload);
      case "menu_item":
        return payload.value ? `index.php?Itemid=${encodeURIComponent(String(payload.value || ""))}` : "#";
      case "com_contact_contact":
        return payload.value ? `index.php?option=com_contact&view=contact&id=${encodeURIComponent(String(payload.value || ""))}` : "#";
      case "com_tags_tag": {
        const ids = Array.isArray(payload.value) ? payload.value : list(payload.value, []);
        if (!ids.length) {
          return "#";
        }
        const params = new URLSearchParams();
        params.set("option", "com_tags");
        params.set("view", "tag");
        ids.forEach((id) => params.append("id[]", String(id)));
        return `index.php?${params.toString()}`;
      }
      case "user_profile":
        return payload.value ? `index.php?option=com_users&view=profile&id=${encodeURIComponent(String(payload.value || ""))}` : "#";
      case "advanced_route":
        return String(payload.value || "").trim() || "#";
      default:
        return payload.value || "#";
    }
  }

  function friendlyValueText(payload) {
    const value = String(payload.value || "").trim();

    switch (payload.kind) {
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
      normaliseContentState(state);
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

    normaliseContentState(state);
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
      selection_image: state.selection_image,
      selection_image_alt: state.selection_image_alt,
      preview_alt: state.preview_alt,
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

    return payload;
  }

  function linkMarkup(config, payload, body, extra = {}) {
    const tag = extra.tag || wrapperTagForAction(payload.action);
    const attrs = [
      `class="${esc(["smartlink-link", payload.css_class || "", payload.action === "preview_modal" ? "js-smartlink-preview" : "", ...(extra.classes || [])].filter(Boolean).join(" "))}"`
    ];

    if (tag === "a") {
      attrs.unshift(`href="${esc(extra.href || effectiveHref(payload))}"`);
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
      attrs.push(`data-smartlink-preview="1"`);

      if (payload.preview_image && !isStructuredContentKind(payload.kind)) {
        attrs.push(`data-preview-image="${esc(payload.preview_image)}"`);
      }

      if (payload.preview_alt && !isStructuredContentKind(payload.kind)) {
        attrs.push(`data-preview-alt="${esc(payload.preview_alt)}"`);
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
      return String(payload.image_override || "").trim();
    }

    if (payload.kind === "image") {
      return String(payload.value || "").trim();
    }

    if (payload.kind === "video") {
      return String(payload.video?.poster || payload.preview_image || "").trim();
    }

    if (payload.kind === "gallery") {
      const first = Array.isArray(payload.value) ? payload.value[0] : null;
      return String(first?.poster || first?.src || "").trim();
    }

    if (payload.selection_image) {
      return String(payload.selection_image || "").trim();
    }

    return String(payload.preview_image || "").trim();
  }

  function imageAlt(payload, text) {
    return String(payload.preview_alt || payload.selection_image_alt || text || kindTypeLabel(payload.kind) || "").trim();
  }

  function textParts(payload, text) {
    const parts = [];

    if (payload.show_type_label) {
      parts.push(`<span class="smartlink-structure__type">${esc(kindTypeLabel(payload.kind))}</span>`);
    }

    if (payload.show_text && text) {
      parts.push(`<span class="smartlink-structure__title">${esc(text)}</span>`);
    }

    if (payload.show_summary && payload.selection_summary) {
      parts.push(`<span class="smartlink-structure__summary">${esc(String(payload.selection_summary || "").trim())}</span>`);
    }

    if (!parts.length) {
      return "";
    }

    return `<span class="smartlink-structure__body">${parts.join("")}</span>`;
  }

  function resolveClickTargets(payload) {
    const available = {
      icon: Boolean(payload.show_icon),
      text: Boolean(payload.show_text) && payload.kind !== "gallery",
      thumbnail: Boolean(payload.show_image),
      view: Boolean(payload.display_inside) && canClickViewOnPage(payload.kind)
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
      classes: ["smartlink-part-link", ...classes]
    });
  }

  function iconPart(config, payload, targets) {
    if (!payload.show_icon) {
      return "";
    }

    const body = `<span class="smartlink-structure__icon ${esc(iconClassName(payload.icon_class, payload.kind))}" aria-hidden="true"></span>`;

    return wrapPart(config, payload, body, targets.icon, ["smartlink-part-link--icon"]);
  }

  function imagePart(config, payload, text, targets) {
    if (!payload.show_image) {
      return "";
    }

    const src = imageSource(payload);

    if (!src) {
      return "";
    }

    const body = `<span class="smartlink-structure__image"><img src="${esc(src)}" alt="${esc(imageAlt(payload, text))}" loading="lazy"></span>`;

    return wrapPart(config, payload, body, targets.thumbnail, ["smartlink-part-link--thumbnail"]);
  }

  function rawTextBody(payload, text) {
    return textParts(payload, text) || "";
  }

  function textBody(config, payload, text, targets) {
    const body = rawTextBody(payload, text);

    if (!body) {
      return "";
    }

    return wrapPart(config, payload, body, targets.text, ["smartlink-part-link--text"]);
  }

  function figureBody(icon, body) {
    if (icon && body) {
      return `<span class="smartlink-structure__caption-body">${icon}${body}</span>`;
    }

    return body || icon;
  }

  function viewerSupplementWrapper(payload, content) {
    if (!content) {
      return "";
    }

    if (payload.structure === "inline") {
      return `<span class="smartlink-structure smartlink-structure--inline smartlink-inline-viewer__meta smartlink-inline-viewer__meta--inline">${content}</span>`;
    }

    return `<div class="smartlink-inline-viewer__meta">${content}</div>`;
  }

  function groupedViewerSupplement(config, payload, text, useCaption = false, skipIcon = false) {
    const icon = skipIcon ? "" : (payload.show_icon ? `<span class="smartlink-structure__icon ${esc(iconClassName(payload.icon_class, payload.kind))}" aria-hidden="true"></span>` : "");
    const image = payload.show_image ? (() => {
      const src = imageSource(payload);

      if (!src) {
        return "";
      }

      return `<span class="smartlink-structure__image"><img src="${esc(src)}" alt="${esc(imageAlt(payload, text))}" loading="lazy"></span>`;
    })() : "";
    const body = rawTextBody(payload, text);

    if (!icon && !image && !body) {
      return "";
    }

    const content = payload.structure === "figure" && useCaption
      ? `${image}${figureBody(icon, body) ? `<span class="smartlink-structure__caption">${figureBody(icon, body)}</span>` : ""}`
      : payload.structure === "figure"
        ? `${image}${figureBody(icon, body)}`
        : `${image}${icon}${body}`;

    return viewerSupplementWrapper(
      payload,
      linkMarkup(config, payload, content, {
        meta: false,
        classes: ["smartlink-inline-viewer__meta-link"]
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

    return viewerSupplementWrapper(payload, `${image}${icon}${body}`);
  }

  function structureInner(config, payload, text, targets) {
    const icon = iconPart(config, payload, targets);
    const image = imagePart(config, payload, text, targets);
    const body = textBody(config, payload, text, targets);
    const figureText = figureBody(icon, body);

    if (payload.structure === "figure" && payload.figure_caption_text && body) {
      return `${image}<figcaption class="smartlink-structure__caption">${figureText}</figcaption>`;
    }

    if (payload.structure === "figure") {
      return `${image}${figureText}`;
    }

    return `${image}${icon}${body}`;
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
      return linkMarkup(config, itemPayload, esc(text), { meta: false, href: effectiveHref(itemPayload) });
    }).join("");

    return `<div class="smartlink smartlink-links"${metadataAttr(config, payload)}>${links}</div>`;
  }

  function viewerFallback(config, payload, text) {
    if (payload.action === "no_action") {
      return "";
    }

    return `<div class="smartlink-fallback">${linkMarkup(config, payload, esc(text), { meta: false, href: effectiveHref(payload) })}</div>`;
  }

  function videoViewerBody(payload, text) {
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
          body = `<div class="smartlink-video-embed"><iframe src="https://www.youtube.com/embed/${esc(id)}?${qs.toString()}" loading="lazy" allowfullscreen></iframe></div>`;
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
          body = `<div class="smartlink-video-embed"><iframe src="https://www.youtube.com/embed/${esc(id)}?${qs.toString()}" loading="lazy" allowfullscreen></iframe></div>`;
        }
      } else if (host.includes("vimeo.com")) {
        const id = url.pathname.split("/").filter(Boolean).pop();
        if (id) {
          const qs = new URLSearchParams({
            autoplay: payload.video?.autoplay ? "1" : "0",
            loop: payload.video?.loop ? "1" : "0",
            muted: payload.video?.muted ? "1" : "0"
          });
          body = `<div class="smartlink-video-embed"><iframe src="https://player.vimeo.com/video/${esc(id)}?${qs.toString()}" loading="lazy" allowfullscreen></iframe></div>`;
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

    return `<video class="smartlink-video" ${attrs.join(" ")}><source src="${esc(payload.value || "")}"><a href="${esc(payload.value || "")}">${esc(text)}</a></video>`;
  }

  function viewerBody(config, payload, text, targets) {
    if (payload.kind === "image") {
      const body = `<figure class="smartlink-image"><img src="${esc(payload.value || "")}" alt="${esc(imageAlt(payload, text))}" loading="lazy"></figure>`;

      return wrapPart(config, payload, body, targets.view, ["smartlink-part-link--view"]);
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
          return `<span class="smartlink-gallery__item">${item.poster
            ? `<img src="${esc(item.poster)}" alt="${esc(item.label || "Video")}" loading="lazy">`
            : `<span class="smartlink-gallery__video-label">${esc(item.label || "Video")}</span>`}</span>`;
        }

        return `<span class="smartlink-gallery__item"><img src="${esc(itemPayload.value || "")}" alt="${esc(item.label || "")}" loading="lazy"></span>`;
      }).join("");

      return `<div class="smartlink-gallery smartlink-gallery--${esc(payload.gallery.image_size_mode || "cover")}" style="--smartlink-gallery-columns:${Number(payload.gallery.columns || 3)};--smartlink-gallery-gap:${Number(payload.gallery.gap || 16)}px;">${grid}</div>`;
    }

    if (payload.kind === "media_file" || payload.kind === "external_url" || payload.kind === "relative_url" || isStructuredContentKind(payload.kind) || ["menu_item", "com_tags_tag", "com_contact_contact", "user_profile", "advanced_route"].includes(payload.kind)) {
      return `<div class="smartlink-frame-embed"><iframe src="${esc(effectiveHref(payload))}" loading="lazy"></iframe></div>`;
    }

    return "";
  }

  function buildContentMarkup(config, payload, text) {
    const targets = resolveClickTargets(payload);
    const linked = payload.action !== "no_action";
    const wholeItem = linked && !payload.click_individual_parts;
    const inner = structureInner(config, payload, text, targets);

    if (payload.structure === "figure") {
      if (wholeItem) {
        return linkMarkup(config, payload, `<figure class="smartlink-structure smartlink-structure--figure">${inner}</figure>`, { classes: ["smartlink-structure-link", "smartlink-structure-link--figure"] });
      }

      return linkMarkup(config, payload, inner, { tag: "figure", classes: ["smartlink-structure", "smartlink-structure--figure"] });
    }

    if (payload.structure === "block") {
      if (wholeItem) {
        return linkMarkup(config, payload, `<div class="smartlink-structure smartlink-structure--block">${inner}</div>`, { classes: ["smartlink-structure-link", "smartlink-structure-link--block"] });
      }

      return linkMarkup(config, payload, inner, { tag: "div", classes: ["smartlink-structure", "smartlink-structure--block"] });
    }

    return linkMarkup(
      config,
      payload,
      inner,
      {
        tag: wholeItem ? "a" : "span",
        classes: ["smartlink-structure", "smartlink-structure--inline"]
      }
    );
  }

  function buildInlineViewer(config, payload, text) {
    const targets = resolveClickTargets(payload);
    const body = viewerBody(config, payload, text, targets);

    if (!body) {
      return buildContentMarkup(config, { ...payload, display_inside: false }, text);
    }

    const viewAfter = normaliseViewPosition(payload.view_position) === "after";
    const supplementPayload = { ...payload, display_inside: false };
    const supplement = (payload.show_icon || payload.show_image || payload.show_text)
      ? buildContentMarkup(config, supplementPayload, text)
      : "";
    const parts = viewAfter
      ? `${supplement || ""}${body}`
      : `${body}${supplement || ""}`;
    return `<div class="smartlink smartlink-embed"${metadataAttr(config, payload)}><div class="smartlink-inline-viewer-stack smartlink-inline-viewer-stack--${esc(payload.structure || "inline")}">${parts}</div></div>`;
  }

  function buildMarkup(configOrPayload, maybePayload, overrideText = "") {
    const hasConfig = maybePayload && typeof maybePayload === "object" && !Array.isArray(maybePayload);
    const config = hasConfig ? (configOrPayload || {}) : {};
    const payload = hasConfig ? maybePayload : configOrPayload;
    const textOverride = hasConfig ? overrideText : (typeof maybePayload === "string" ? maybePayload : "");
    const text = primaryText(payload, textOverride);

    if (payload.kind === "gallery" && !payload.display_inside) {
      return galleryLinks(config, payload);
    }

    if (payload.display_inside) {
      return buildInlineViewer(config, payload, text);
    }

    return buildContentMarkup(config, payload, text);
  }

  function sectionWarning(state) {
    const value = String(Array.isArray(state.value) ? "" : state.value || "").trim();
    if (!value) {
      return "";
    }
    if (state.kind === "external_url" && state._externalInternalHint) {
      return "This does not look like a normal site URL. Maybe use Relative Link instead.";
    }
    if (state.kind === "external_url" && state._externalAutoPrefixed) {
      return "https:// was added automatically for this external link.";
    }
    if (state.kind === "relative_url" && state._relativeAutoConverted) {
      return "Site domain was removed and kept as a relative link.";
    }
    if (state.kind === "relative_url" && state._relativeAutoRooted) {
      return "A leading / was added automatically for this relative link.";
    }
    if (state.kind === "relative_url" && state._relativeExternalHint) {
      return "This looks like an external address. Use External Link instead.";
    }
    if (isUnsafeUrl(value)) {
      return "This address uses an unsafe scheme and will be rejected.";
    }
    if (state.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "This does not look like a valid email address.";
    }
    if (state.kind === "phone" && !/^\+?[0-9()\-\s./]{5,}$/.test(value)) {
      return "This does not look like a valid phone number.";
    }
    if (state.kind === "video" && state.source_type === "provider" && !isProviderUrl(value)) {
      return "Use a YouTube or Vimeo link here.";
    }
    return "";
  }

  function summaryText(state) {
    if (state.selection_label) {
      return state.selection_label;
    }
    if (state.kind === "gallery") {
      const items = Array.isArray(state.value) ? state.value : [];
      return items.length ? `${items.length} item${items.length === 1 ? "" : "s"} selected` : "No items selected yet.";
    }
    if (state.kind === "com_tags_tag") {
      const items = Array.isArray(state.value) ? state.value : [];
      return items.length ? `${items.length} tag${items.length === 1 ? "" : "s"} selected` : "No tags selected yet.";
    }
    const value = String(state.value || "").trim();
    if (!value) {
      return meta(state.kind).p ? "Nothing selected yet." : "No value set yet.";
    }
    if (/^\d+$/.test(value)) {
      return `Selected item #${value}`;
    }
    return basename(value) || value;
  }

  function valueLabel(state) {
    const map = {
      external_url: "Web address",
      relative_url: "Relative link",
      anchor: "Anchor ID",
      email: "Email address",
      phone: "Phone number",
      advanced_route: "Route",
      user_profile: "User reference"
    };
    if (map[state.kind]) {
      return map[state.kind];
    }
    if (state.kind === "video" && state.source_type === "provider") {
      return "YouTube or Vimeo link";
    }
    if (["media_file", "image", "video"].includes(state.kind)) {
      return state.source_type === "external" ? "Web address" : `${meta(state.kind).l} path`;
    }
    return "Value";
  }

  function valuePlaceholder(state) {
    const map = {
      external_url: "https://example.com/page",
      relative_url: "/my-page",
      anchor: "section-id",
      email: "name@example.com",
      phone: "+30 210 1234567",
      advanced_route: "index.php?option=com_content&view=article&id=12",
      user_profile: "42"
    };
    if (map[state.kind]) {
      return map[state.kind];
    }
    if (state.kind === "video" && state.source_type === "provider") {
      return "https://youtu.be/...";
    }
    if (["media_file", "image", "video"].includes(state.kind)) {
      return "https://example.com/file";
    }
    return "Enter a value";
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
      return "download";
    }

    let pathname = raw;

    try {
      const parsed = new URL(raw, window.location.origin);
      pathname = parsed.pathname || raw;
    } catch (error) {
    }

    const cleanPath = decodeURIComponent(String(pathname).split("?")[0].split("#")[0]).replace(/\/+$/, "");
    const guessed = basename(cleanPath).replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").trim();

    return guessed || "download";
  }

  function groups(config, currentKind) {
    const allowed = list(config.allowed_kinds, GROUPS.flatMap((group) => group[2]));
    return GROUPS
      .map(([key, label, kinds]) => [key, label, kinds.filter((kind) => allowed.includes(kind) || kind === currentKind)])
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
                    ? `<img src="${esc(item.poster)}" alt="${esc(item.label || "Video")}" loading="lazy">`
                    : `<span class="smartlink-builder__gallery-fallback">${esc(item.label || "Video")}</span>`)
                  : `<img src="${esc(item.src || "")}" alt="${esc(item.label || "")}" loading="lazy">`}
              </div>
              <div class="smartlink-builder__gallery-meta">
                <div class="smartlink-builder__gallery-name">${esc(item.label || basename(item.src || "") || "Item")}</div>
                <div class="smartlink-builder__gallery-path">${esc(item.src || "")}</div>
              </div>
              <button type="button" class="btn btn-sm btn-outline-danger js-gallery-remove" data-index="${index}">Remove</button>
            </div>`).join("") : `<div class="smartlink-builder__empty">No items selected yet.</div>`}
        </div>
        ${state.source_type !== "local" ? `
          <div class="smartlink-builder__row">
            <label class="smartlink-builder__field">
              <span>${esc(state.source_type === "provider" ? "YouTube or Vimeo link" : "Web address")}</span>
              <input class="form-control js-gallery-manual-src" type="url" placeholder="${esc(state.source_type === "provider" ? "https://youtu.be/..." : "https://example.com/image.jpg")}">
            </label>
            <label class="smartlink-builder__field">
              <span>Item title</span>
              <input class="form-control js-gallery-manual-label" type="text" placeholder="Optional">
            </label>
            <button type="button" class="btn btn-outline-secondary js-gallery-add-manual">Add item</button>
          </div>` : ""}
        <div class="smartlink-builder__actions">
          ${usesPicker ? `<button type="button" class="btn btn-outline-secondary js-picker">Add from Media Library</button>` : ""}
          ${items.length ? `<button type="button" class="btn btn-outline-secondary js-clear">Clear all</button>` : ""}
        </div>`;
    } else if (usesPicker) {
      pickerPanel = `
        <div class="smartlink-builder__picker-row">
          <div class="smartlink-builder__summary smartlink-builder__summary--compact">
            <div class="smartlink-builder__summary-caption">${esc(["com_content_article", "com_content_category", "menu_item", "com_contact_contact"].includes(state.kind) ? "Selected item" : (state.kind === "com_tags_tag" ? "Selected tags" : "Selected file"))}</div>
            <div class="smartlink-builder__summary-value">${esc(summaryText(state))}</div>
          </div>
          <div class="smartlink-builder__actions smartlink-builder__actions--inline">
            <button type="button" class="btn btn-outline-secondary js-picker">Choose...</button>
            ${(Array.isArray(state.value) ? state.value.length : state.value) ? `<button type="button" class="btn btn-outline-secondary js-clear">Clear</button>` : ""}
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
          <div class="smartlink-builder__hint">Suggestions are collected from the current editor content.</div>`;
      }
    }

    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">Source</h4>
        ${sources.length ? `
          <label class="smartlink-builder__field">
            <span>${esc(state.kind === "gallery" ? "Where are the items from?" : `Where is the ${meta(state.kind).l.toLowerCase()} from?`)}</span>
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

  function hasTextualPreview(payload) {
    return Boolean(payload.show_text || payload.show_summary || payload.show_type_label);
  }

  function previewPlaceholderText(payload) {
    if (!hasTextualPreview(payload)) {
      return "";
    }

    return `<span class="smartlink-structure__body"><span class="smartlink-preview-placeholder__text">No content to preview</span></span>`;
  }

  function previewPlaceholderIcon() {
    return `<span class="smartlink-structure__icon smartlink-preview-placeholder__icon" aria-hidden="true"></span>`;
  }

  function previewPlaceholderImage() {
    return `<span class="smartlink-structure__image smartlink-preview-placeholder__thumb" aria-hidden="true"></span>`;
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

  function buildPreviewPlaceholder(payload) {
    const icon = payload.show_icon ? previewPlaceholderIcon() : "";
    const image = payload.show_image ? previewPlaceholderImage() : "";
    const text = previewPlaceholderText(payload);
    const hasPlaceholderContent = Boolean(icon || image || text || payload.display_inside);

    if (payload.display_inside) {
      const useCaption = payload.structure === "figure" && payload.figure_caption_text;
      const captionBody = useCaption ? figureBody(icon, text) : "";
      const caption = captionBody ? `<figcaption class="smartlink-structure__caption">${captionBody}</figcaption>` : "";
      const supplementContent = [image, useCaption ? "" : icon, useCaption ? "" : text].filter(Boolean).join("");
      const supplement = viewerSupplementWrapper(payload, supplementContent);
      const viewAfter = normaliseViewPosition(payload.view_position) === "after";
      const wrapper = payload.structure === "figure"
        ? `<figure class="smartlink-structure smartlink-structure--figure smartlink-inline-viewer smartlink-preview-placeholder">${viewAfter ? `${supplement || ""}${caption}${previewPlaceholderView(payload)}` : `${previewPlaceholderView(payload)}${caption}${supplement || ""}`}</figure>`
        : `<div class="smartlink-structure smartlink-structure--${esc(payload.structure || "inline")} smartlink-inline-viewer smartlink-preview-placeholder">${viewAfter ? `${supplement || ""}${previewPlaceholderView(payload)}` : `${previewPlaceholderView(payload)}${supplement || ""}`}</div>`;

      return `<div class="smartlink smartlink-preview-placeholder">${wrapper}</div>`;
    }

    if (!hasPlaceholderContent) {
      return `<div class="smartlink smartlink-preview-placeholder"><span class="smartlink-preview-placeholder__text">No content to preview</span></div>`;
    }

    const figureText = figureBody(icon, text);
    const inner = payload.structure === "figure" && payload.figure_caption_text && text
      ? `${image}<figcaption class="smartlink-structure__caption">${figureText}</figcaption>`
      : payload.structure === "figure"
        ? `${image}${figureText}`
        : `${image}${icon}${text}`;

    const wrapper = payload.structure === "figure"
      ? `<figure class="smartlink-structure smartlink-structure--figure smartlink-preview-placeholder">${inner}</figure>`
      : payload.structure === "block"
        ? `<div class="smartlink-structure smartlink-structure--block smartlink-preview-placeholder">${inner}</div>`
        : `<span class="smartlink-structure smartlink-structure--inline smartlink-preview-placeholder">${inner}</span>`;

    return `<div class="smartlink smartlink-preview-placeholder">${wrapper}</div>`;
  }

  function renderBehavior(config, state) {
    const behaviorModes = modes(config, state.kind);
    const popupScopes = contentPopupScopes(state.kind);
    const hasMultipleModes = behaviorModes.length > 1;
    const showPopupScopeField = isStructuredContentKind(state.kind) && state.action === "preview_modal";

    if (!hasMultipleModes) {
      state.action = behaviorModes[0][0];
    }

    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">Behavior</h4>
        <div class="smartlink-builder__grid">
          <label class="smartlink-builder__field">
            <span>When clicked</span>
            ${hasMultipleModes
              ? `<select class="form-select js-action">
                  ${behaviorModes.map((mode) => `<option value="${esc(mode[0])}"${mode[0] === state.action ? " selected" : ""}>${esc(mode[1])}</option>`).join("")}
                </select>`
              : `<select class="form-select js-action smartlink-builder__select-readonly" aria-disabled="true" tabindex="-1" disabled>
                  <option value="${esc(behaviorModes[0][0])}" selected>${esc(behaviorModes[0][1])}</option>
                </select>`
            }
          </label>
          ${showPopupScopeField ? `
            <label class="smartlink-builder__field">
              <span>Popup content</span>
              <select class="form-select js-popup-scope">
                ${popupScopes.map((scope) => `<option value="${esc(scope[0])}"${scope[0] === state.popup_scope ? " selected" : ""}>${esc(scope[1])}</option>`).join("")}
              </select>
            </label>` : ""}
          ${state.action === "link_download" ? `
            <label class="smartlink-builder__field">
              <span>Download filename (optional)</span>
              <input class="form-control js-download" type="text" value="${esc(state.download_filename)}" placeholder="${esc(downloadFilenameHint(state))}">
            </label>` : ""}
        </div>
      </section>`;
  }

  function renderContent(state) {
    const iconDisabled = isToggleDisabled(state.kind, "icon");
    const imageDisabled = isToggleDisabled(state.kind, "image");
    const textDisabled = isToggleDisabled(state.kind, "text");
    const displayInsideDisabled = isToggleDisabled(state.kind, "displayInside");
    const showTextField = isToggleVisible(state.kind, "text") && state.show_text && state.kind !== "gallery";
    const noVisibleContent = !state.display_inside && !state.show_icon && !state.show_image && !state.show_text;

    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">Content</h4>
        <div class="smartlink-builder__switch-list smartlink-builder__switch-list--four">
          <label class="smartlink-builder__switch-row${state.show_image ? " is-active" : ""}${imageDisabled ? " is-disabled" : ""}">
            <span class="smartlink-builder__switch-row-label">Thumbnail</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-show-image" type="checkbox"${state.show_image ? " checked" : ""}${imageDisabled ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>
          <label class="smartlink-builder__switch-row${state.show_icon ? " is-active" : ""}${iconDisabled ? " is-disabled" : ""}">
            <span class="smartlink-builder__switch-row-label">Icon</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-show-icon" type="checkbox"${state.show_icon ? " checked" : ""}${iconDisabled ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>
          <label class="smartlink-builder__switch-row${state.show_text ? " is-active" : ""}${textDisabled ? " is-disabled" : ""}">
            <span class="smartlink-builder__switch-row-label">Text</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-show-text" type="checkbox"${state.show_text ? " checked" : ""}${textDisabled ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>
          <label class="smartlink-builder__switch-row${state.display_inside ? " is-active" : ""}${displayInsideDisabled ? " is-disabled" : ""}">
            <span class="smartlink-builder__switch-row-label">View on Page</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-display-inside" type="checkbox"${state.display_inside ? " checked" : ""}${displayInsideDisabled ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>
        </div>
        ${showTextField ? `
          <label class="smartlink-builder__field">
            <span>Text to display</span>
            <input class="form-control js-label" type="text" value="${esc(state.label)}" placeholder="${esc(labelHint(state))}">
          </label>` : ""}
        ${noVisibleContent ? `<div class="smartlink-builder__warning">Enable at least one of icon, image or text.</div>` : ""}
      </section>`;
  }

  function renderAdvanced(state) {
    const showPopupScopeField = isStructuredContentKind(state.kind) && state.action === "preview_modal";
    const richStructure = state.structure !== "inline";
    const showSummaryField = richStructure && allowsSummary(state.kind);
    const showTypeLabelField = richStructure && allowsTypeLabel(state.kind);
    const showFigureCaptionField = state.structure === "figure" && (state.show_text || state.show_summary || state.show_type_label);
    const showImageOverrideField = allowsImageOverride(state.kind) && (state.show_image || state.display_inside);
    const showPreviewImageField = state.action === "preview_modal" && !["image", "gallery"].includes(state.kind) && !showImageOverrideField;
    const showAltField = state.kind === "image" || state.show_image || state.display_inside;
    const showViewPositionField = state.display_inside;
    const clickCandidates = clickParts(state);
    const clickEnabled = state.action !== "no_action";
    const availableClickParts = new Set(clickCandidates);
    const canToggleIndividualParts = clickEnabled && clickCandidates.length > 0;
    const clickViewDisabled = !availableClickParts.has("view") || isClickPartLocked(state, "view");
    const structureToggles = [];

    if (showSummaryField) {
      structureToggles.push(`
        <label class="smartlink-builder__switch-row${state.show_summary ? " is-active" : ""}">
          <span class="smartlink-builder__switch-row-label">Show summary</span>
          <span class="smartlink-builder__switch-control">
            <input class="js-show-summary" type="checkbox"${state.show_summary ? " checked" : ""}>
            <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
          </span>
        </label>`);
    }

    if (showTypeLabelField) {
      structureToggles.push(`
        <label class="smartlink-builder__switch-row${state.show_type_label ? " is-active" : ""}">
          <span class="smartlink-builder__switch-row-label">Show type label</span>
          <span class="smartlink-builder__switch-control">
            <input class="js-show-type-label" type="checkbox"${state.show_type_label ? " checked" : ""}>
            <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
          </span>
        </label>`);
    }

    if (showFigureCaptionField) {
      structureToggles.push(`
        <label class="smartlink-builder__switch-row${state.figure_caption_text ? " is-active" : ""}">
          <span class="smartlink-builder__switch-row-label">Use figure caption for text</span>
          <span class="smartlink-builder__switch-control">
            <input class="js-figure-caption-text" type="checkbox"${state.figure_caption_text ? " checked" : ""}>
            <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
          </span>
        </label>`);
    }

    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">Advanced</h4>
        <div class="smartlink-builder__grid">
          <label class="smartlink-builder__field">
            <span>Structure</span>
            <select class="form-select js-structure">
              ${STRUCTURES.map((option) => `<option value="${esc(option[0])}"${option[0] === state.structure ? " selected" : ""}>${esc(option[1])}</option>`).join("")}
            </select>
          </label>
          <label class="smartlink-builder__field"><span>Title</span><input class="form-control js-title" type="text" value="${esc(state.title)}"></label>
          <label class="smartlink-builder__field"><span>Open in</span><input class="form-control js-target" type="text" value="${esc(state.target)}" placeholder="_blank"></label>
          <label class="smartlink-builder__field"><span>Rel</span><input class="form-control js-rel" type="text" value="${esc(state.rel)}" placeholder="nofollow"></label>
          <label class="smartlink-builder__field"><span>CSS class</span><input class="form-control js-css" type="text" value="${esc(state.css_class)}"></label>
          ${structureToggles.length ? `
            <div class="smartlink-builder__field smartlink-builder__field--span-3 smartlink-builder__field--switches">
              <span aria-hidden="true">&nbsp;</span>
              <div class="smartlink-builder__switch-list smartlink-builder__switch-list--advanced-inline">
                ${structureToggles.join("")}
              </div>
            </div>` : ""}
          ${showPopupScopeField ? `
            <label class="smartlink-builder__field">
              <span>Popup content</span>
              <select class="form-select js-popup-scope">
                ${contentPopupScopes(state.kind).map((scope) => `<option value="${esc(scope[0])}"${scope[0] === state.popup_scope ? " selected" : ""}>${esc(scope[1])}</option>`).join("")}
              </select>
            </label>` : ""}
          ${showViewPositionField ? `
            <label class="smartlink-builder__field">
              <span>View on Page position</span>
              <select class="form-select js-view-position">
                ${VIEW_POSITIONS.map((position) => `<option value="${esc(position[0])}"${position[0] === state.view_position ? " selected" : ""}>${esc(position[1])}</option>`).join("")}
              </select>
            </label>` : ""}
          ${state.show_icon ? `
            <label class="smartlink-builder__field">
              <span>Icon class</span>
              <input class="form-control js-icon-class" type="text" value="${esc(state.icon_class)}" placeholder="fa-solid fa-link">
            </label>` : ""}
          ${showImageOverrideField ? `
            <label class="smartlink-builder__field">
              <span>Image to show</span>
              <input class="form-control js-image-override" type="url" value="${esc(state.image_override)}" placeholder="Optional override">
            </label>` : ""}
          ${showPreviewImageField ? `
            <label class="smartlink-builder__field">
              <span>Popup image override</span>
              <input class="form-control js-preview-image" type="url" value="${esc(state.preview_image)}" placeholder="Optional popup image">
            </label>` : ""}
          ${showAltField ? `
            <label class="smartlink-builder__field">
              <span>Alternative text</span>
              <input class="form-control js-preview-alt" type="text" value="${esc(state.preview_alt)}">
            </label>` : ""}
        </div>
        <div class="smartlink-builder__switch-list smartlink-builder__switch-list--five">
          <label class="smartlink-builder__switch-row smartlink-builder__switch-row--linked${state.click_individual_parts ? " is-active" : ""}${!canToggleIndividualParts ? " is-disabled" : ""}" title="Link only the selected parts instead of linking the whole item.">
            <span class="smartlink-builder__switch-row-label">Linked Part…</span>
            <span class="smartlink-builder__switch-control">
              <input class="js-click-individual-parts" type="checkbox"${state.click_individual_parts ? " checked" : ""}${!canToggleIndividualParts ? " disabled" : ""}>
              <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
            </span>
          </label>
          ${state.click_individual_parts ? `
            <label class="smartlink-builder__switch-row smartlink-builder__switch-row--part smartlink-builder__switch-row--thumbnail${state.click_image ? " is-active" : ""}${(!availableClickParts.has("thumbnail") || isClickPartLocked(state, "thumbnail")) ? " is-disabled" : ""}">
              <span class="smartlink-builder__switch-row-label">Thumbnail</span>
              <span class="smartlink-builder__switch-control">
                <input class="js-click-image" type="checkbox"${state.click_image ? " checked" : ""}${(!availableClickParts.has("thumbnail") || isClickPartLocked(state, "thumbnail")) ? " disabled" : ""}>
                <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
              </span>
            </label>
            <label class="smartlink-builder__switch-row smartlink-builder__switch-row--part smartlink-builder__switch-row--icon${state.click_icon ? " is-active" : ""}${(!availableClickParts.has("icon") || isClickPartLocked(state, "icon")) ? " is-disabled" : ""}">
              <span class="smartlink-builder__switch-row-label">Icon</span>
              <span class="smartlink-builder__switch-control">
                <input class="js-click-icon" type="checkbox"${state.click_icon ? " checked" : ""}${(!availableClickParts.has("icon") || isClickPartLocked(state, "icon")) ? " disabled" : ""}>
                <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
              </span>
            </label>
            <label class="smartlink-builder__switch-row smartlink-builder__switch-row--part smartlink-builder__switch-row--text${state.click_text ? " is-active" : ""}${(!availableClickParts.has("text") || isClickPartLocked(state, "text")) ? " is-disabled" : ""}">
              <span class="smartlink-builder__switch-row-label">Text</span>
              <span class="smartlink-builder__switch-control">
                <input class="js-click-text" type="checkbox"${state.click_text ? " checked" : ""}${(!availableClickParts.has("text") || isClickPartLocked(state, "text")) ? " disabled" : ""}>
                <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
              </span>
            </label>
            <label class="smartlink-builder__switch-row smartlink-builder__switch-row--part smartlink-builder__switch-row--view${state.click_view ? " is-active" : ""}${clickViewDisabled ? " is-disabled" : ""}">
              <span class="smartlink-builder__switch-row-label">View on Page</span>
              <span class="smartlink-builder__switch-control">
                <input class="js-click-view" type="checkbox"${state.click_view ? " checked" : ""}${clickViewDisabled ? " disabled" : ""}>
                <span class="smartlink-builder__switch-ui" aria-hidden="true"></span>
              </span>
            </label>` : ""}
        </div>
        ${(state.kind === "video" || state.kind === "gallery") ? `
          <div class="smartlink-builder__panel smartlink-builder__grid">
            ${state.kind === "video" ? `
              <label><input class="js-video-controls" type="checkbox"${state.video.controls ? " checked" : ""}> Show controls</label>
              <label><input class="js-video-autoplay" type="checkbox"${state.video.autoplay ? " checked" : ""}> Start playing automatically</label>
              <label><input class="js-video-loop" type="checkbox"${state.video.loop ? " checked" : ""}> Repeat</label>
              <label><input class="js-video-muted" type="checkbox"${state.video.muted ? " checked" : ""}> Start muted</label>
              <label class="smartlink-builder__field">
                <span>Poster image</span>
                <input class="form-control js-video-poster" type="url" value="${esc(state.video.poster)}">
              </label>` : ""}
            ${state.kind === "gallery" ? `
              <label class="smartlink-builder__field"><span>Columns</span><input class="form-control js-gallery-columns" type="number" min="1" value="${esc(state.gallery.columns)}"></label>
              <label class="smartlink-builder__field"><span>Gap</span><input class="form-control js-gallery-gap" type="number" min="0" value="${esc(state.gallery.gap)}"></label>
              <label class="smartlink-builder__field">
                <span>How the items fit</span>
                <select class="form-select js-gallery-size">
                  <option value="cover"${state.gallery.image_size_mode === "cover" ? " selected" : ""}>Fill the space</option>
                  <option value="contain"${state.gallery.image_size_mode === "contain" ? " selected" : ""}>Show the whole item</option>
                  <option value="stretch"${state.gallery.image_size_mode === "stretch" ? " selected" : ""}>Stretch to fit</option>
                  <option value="stretch_width"${state.gallery.image_size_mode === "stretch_width" ? " selected" : ""}>Stretch to full width</option>
                  <option value="stretch_height"${state.gallery.image_size_mode === "stretch_height" ? " selected" : ""}>Stretch to full height</option>
                </select>
              </label>` : ""}
          </div>` : ""}
      </section>`;
  }

  function renderBody(config, state) {
    return state._view === "advanced"
      ? renderAdvanced(state)
      : `<div class="smartlink-builder__two-up">${renderGeneral(state)}${renderBehavior(config, state)}</div>${renderContent(state)}`;
  }

  function renderPreview(config, state) {
    const payload = payloadFrom(state);
    const previewMarkup = hasPreviewValue(payload)
      ? buildMarkup(config, payload)
      : buildPreviewPlaceholder(payload);
    const previewCanvasClass = `smartlink-builder__preview-canvas smartlink-builder__preview-canvas--${esc(payload.structure || "inline")}`;

    return `
      <section class="smartlink-builder__section smartlink-builder__section--preview">
        <h4 class="smartlink-builder__section-title">Preview</h4>
        <div class="${previewCanvasClass} js-smartlink-preview-canvas">${previewMarkup}</div>
      </section>`;
  }

  function render(root, state, config) {

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
                  title="Click to switch section."
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
            <nav class="smartlink-builder__tabs" aria-label="SmartLink sections">
              <button type="button" class="smartlink-builder__tab${state._view === "main" ? " is-active" : ""} js-view" data-view="main">General</button>
              <button type="button" class="smartlink-builder__tab${state._view === "advanced" ? " is-active" : ""} js-view" data-view="advanced">Advanced</button>
            </nav>
            ${renderPreview(config, state)}
            <div class="smartlink-builder__body js-smartlink-body">${renderBody(config, state)}</div>
          </div>
        </div>
      </div>`;

    const linkedPartLabel = root.querySelector(".smartlink-builder__switch-row--linked .smartlink-builder__switch-row-label");
    if (linkedPartLabel) {
      linkedPartLabel.textContent = state.click_individual_parts ? "Linked Part:" : "Linked Part...";
    }
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

  function hydratePreview(root) {
    const canvas = root.querySelector(".js-smartlink-preview-canvas");

    if (!canvas) {
      return;
    }

    canvas.querySelectorAll("[src]").forEach((node) => {
      const value = node.getAttribute("src") || "";
      const next = previewUrl(value);

      if (next && next !== value) {
        node.setAttribute("src", next);
      }
    });

    canvas.querySelectorAll("[href]").forEach((node) => {
      const value = node.getAttribute("href") || "";
      const next = previewUrl(value);

      if (next && next !== value) {
        node.setAttribute("href", next);
      }
    });

    canvas.querySelectorAll("[poster]").forEach((node) => {
      const value = node.getAttribute("poster") || "";
      const next = previewUrl(value);

      if (next && next !== value) {
        node.setAttribute("poster", next);
      }
    });

    canvas.querySelectorAll("[data-preview-image]").forEach((node) => {
      const value = node.getAttribute("data-preview-image") || "";
      const next = previewUrl(value);

      if (next && next !== value) {
        node.setAttribute("data-preview-image", next);
      }
    });
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
    const config = { ...(options.config || parseJSON(root.dataset.config, {})) };
    root._smartlinkConfig = config;
    const state = makeState(config, parseJSON(input?.value, {}));
    let pendingRailSwitchTimer = 0;
    let pendingRailTargetGroup = "";
    let pendingRailNextKind = "";

    const repaint = () => {
      render(root, state, config);
      hydratePreview(root);
      if (input) {
        input.value = JSON.stringify(payloadFrom(state));
      }
    };

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
          state.selection_summary = "";
          state.selection_image = "";
          state.selection_image_alt = "";
          state.image_override = "";
        }
        repaint();
        return;
      }
      if (target.classList.contains("js-gallery-manual-src") || target.classList.contains("js-gallery-manual-label")) {
        return;
      }
      sync(root, state);
      repaint();
    });

    root.addEventListener("click", (event) => {
      const previewLink = event.target.closest(".js-smartlink-preview-canvas a");
      if (previewLink) {
        event.preventDefault();
        if (!previewLink.classList.contains("js-smartlink-preview")) {
          return;
        }
      }

      const button = event.target.closest("button");
      if (!button) {
        return;
      }

      if (!button.classList.contains("js-rail-toggle") && pendingRailSwitchTimer) {
        cancelPendingRailSwitch();
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
          input.value = JSON.stringify(payloadFrom(state));
        }
        return;
      }

      if (button.classList.contains("js-clear")) {
        state.value = state.kind === "gallery" ? [] : (state.kind === "com_tags_tag" ? [] : "");
        state.selection_label = "";
        state.selection_summary = "";
        state.selection_image = "";
        state.selection_image_alt = "";
        state.image_override = "";
        repaint();
        return;
      }

      if (button.classList.contains("js-gallery-remove")) {
        const index = Number(button.dataset.index || -1);
        const items = Array.isArray(state.value) ? state.value.slice() : [];
        state.value = items.filter((_, itemIndex) => itemIndex !== index);
        state.selection_label = "";
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
        repaint();
        return;
      }

      if (button.classList.contains("js-picker") && window.SuperSoftSmartLinkPickers) {
        sync(root, state);
        window.SuperSoftSmartLinkPickers.open(state.kind, { currentValue: state.value }).then((selection) => {
          if (selection === null) {
            return;
          }
          if (state.kind === "gallery") {
            (Array.isArray(selection?.value) ? selection.value : []).forEach((item) => addGalleryItem(state, config, item));
            repaint();
            return;
          }
          if (selection && typeof selection === "object" && !Array.isArray(selection) && Object.prototype.hasOwnProperty.call(selection, "value")) {
            state.value = Array.isArray(selection.value) ? selection.value : String(selection.value || "");
            state.selection_label = String(selection.label || "");
            state.selection_summary = String(selection.summary || "");
            state.selection_image = String(selection.image || "");
            state.selection_image_alt = String(selection.image_alt || selection.label || "");
            if (!state.label && selection.label && state.action === "link_open" && !["image", "video", "com_content_article", "com_content_category"].includes(state.kind)) {
              state.label = String(selection.label);
            }
            fetchSelectionMetadata(state.kind, state.value).then((metadata) => {
              if (!metadata || String(state.value || "") !== String(selection.value || "")) {
                return;
              }
              if (!state.selection_label && metadata.label) {
                state.selection_label = String(metadata.label || "");
              }
              if (!state.selection_summary && metadata.summary) {
                state.selection_summary = String(metadata.summary || "");
              }
              if (!state.selection_image && metadata.image) {
                state.selection_image = String(metadata.image || "");
              }
              if (!state.selection_image_alt && metadata.image_alt) {
                state.selection_image_alt = String(metadata.image_alt || "");
              }
              repaint();
            });
          } else {
            state.value = Array.isArray(selection) ? selection : String(selection || "");
          }
          repaint();
        });
      }
    });

    repaint();

    return {
      getPayload() {
        if (pendingRailSwitchTimer && pendingRailNextKind) {
          const queuedKind = pendingRailNextKind;
          cancelPendingRailSwitch();
          resetKind(state, config, queuedKind);
        }
        sync(root, state);
        repaint();
        return payloadFrom(state);
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
          <strong>${esc(link.getAttribute("title") || link.textContent || "Preview")}</strong>
          <button type="button" class="btn-close js-close" aria-label="Close"></button>
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
    if (!window.HTMLDialogElement) {
      const raw = window.prompt("Paste a SmartLink JSON payload.", "");
      const payload = parseJSON(raw, null);
      return Promise.resolve(payload ? { payload, markup: buildMarkup(options.config || {}, payload) } : null);
    }

    return new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      const mountPoint = document.createElement("div");
      const hidden = document.createElement("input");
      dialog.className = "smartlink-builder-dialog";
      hidden.type = "hidden";
      hidden.value = JSON.stringify(options.payload || {});
      mountPoint.className = "smartlink-builder";
      mountPoint.dataset.config = JSON.stringify(options.config || {});

      dialog.innerHTML = `
        <div class="smartlink-builder-dialog__shell">
          <div class="smartlink-builder-dialog__header">
            <strong>SmartLink Builder</strong>
            <button type="button" class="btn-close js-close" aria-label="Close"></button>
          </div>
          <div class="smartlink-builder-dialog__body js-mount"></div>
          <div class="smartlink-builder-dialog__footer">
            <button type="button" class="btn btn-secondary js-cancel">Cancel</button>
            <button type="button" class="btn btn-primary js-insert">Insert</button>
          </div>
        </div>`;

      dialog.querySelector(".js-mount").appendChild(mountPoint);
      dialog.appendChild(hidden);
      document.body.appendChild(dialog);

      const instance = mount(mountPoint, { config: options.config || {}, input: hidden });
      const close = (result) => {
        dialog.close();
        dialog.remove();
        resolve(result);
      };

      dialog.querySelector(".js-close").addEventListener("click", () => close(null));
      dialog.querySelector(".js-cancel").addEventListener("click", () => close(null));
      dialog.querySelector(".js-insert").addEventListener("click", () => {
        const payload = instance.getPayload();
        close({ payload, markup: buildMarkup(options.config || {}, payload) });
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
