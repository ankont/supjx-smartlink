(() => {
  const ACTIONS = ["link_open", "link_download", "preview_modal", "embed"];
  const GROUPS = [
    ["simple_links", "Simple Links", ["external_url", "anchor", "email", "phone"]],
    ["joomla_items", "Joomla Items", ["com_content_article", "com_content_category", "menu_item", "com_tags_tag", "com_contact_contact"]],
    ["media", "Media", ["media_file", "image", "video", "gallery"]],
    ["advanced", "Advanced", ["relative_url", "user_profile", "advanced_route"]]
  ];
  const METADATA_REQUIRED = ["com_content_article", "com_content_category", "menu_item", "com_tags_tag", "com_contact_contact", "relative_url", "user_profile", "advanced_route", "gallery"];
  const KINDS = {
    external_url: { l: "External Link", g: "simple_links", m: true, d: [["link_open", "Open link"], ["link_download", "Download link"], ["preview_modal", "Open in popup"]] },
    anchor: { l: "Anchor", g: "simple_links", m: true, d: [["link_open", "Jump to anchor"]] },
    email: { l: "Email", g: "simple_links", m: true, d: [["link_open", "Show email link"]] },
    phone: { l: "Phone", g: "simple_links", m: true, d: [["link_open", "Show phone link"]] },
    com_content_article: { l: "Article", g: "joomla_items", p: true, r: true, d: [["link_open", "Open article link"], ["preview_modal", "Open in popup"]] },
    com_content_category: { l: "Category", g: "joomla_items", p: true, r: true, d: [["link_open", "Open category link"], ["preview_modal", "Open in popup"]] },
    menu_item: { l: "Menu Item", g: "joomla_items", p: true, r: true, d: [["link_open", "Open menu item link"]] },
    com_tags_tag: { l: "Tags", g: "joomla_items", p: true, r: true, x: true, d: [["link_open", "Open tags link"]] },
    com_contact_contact: { l: "Contact", g: "joomla_items", p: true, r: true, d: [["link_open", "Open contact link"]] },
    media_file: { l: "Media File", g: "media", p: true, m: true, s: [["local", "Media Library"], ["external", "Web address"]], d: [["link_open", "Text link"], ["link_download", "Download link"], ["preview_modal", "Open in popup"]] },
    image: { l: "Image", g: "media", p: true, m: true, s: [["local", "Media Library"], ["external", "Web address"]], d: [["embed", "Show image"], ["preview_modal", "Thumbnail opens full image"], ["link_open", "Show text link to the image"]] },
    video: { l: "Video", g: "media", p: true, m: true, s: [["local", "Media Library"], ["provider", "YouTube or Vimeo"], ["external", "Direct web address"]], d: [["embed", "Play inside the page"], ["preview_modal", "Show a preview image first"], ["link_open", "Show text link to the video"]] },
    gallery: { l: "Gallery", g: "media", p: true, m: true, r: true, x: true, s: [["local", "Media Library"], ["external", "Web address"], ["provider", "YouTube or Vimeo"]], d: [["embed", "Grid gallery"], ["link_open", "Link list"]] },
    relative_url: { l: "Relative Link", g: "advanced", m: true, r: true, d: [["link_open", "Open link"], ["link_download", "Download link"], ["preview_modal", "Open in popup"]] },
    user_profile: { l: "User Profile", g: "advanced", m: true, r: true, d: [["link_open", "Open profile link"]] },
    advanced_route: { l: "Advanced Route", g: "advanced", m: true, r: true, d: [["link_open", "Open link"]] }
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

  function meta(kind) {
    return KINDS[kind] || { l: kind, g: "advanced", m: true, d: [["link_open", "Open link"]] };
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

    return {
      kind,
      value: normaliseValue(kind, seed.value),
      action: modes(config, kind).some((mode) => mode[0] === seed.action) ? seed.action : defaultAction(config, kind),
      label: String(seed.label || ""),
      selection_label: String(seed.selection_label || ""),
      title: String(seed.title || ""),
      target: String(seed.target || ""),
      rel: String(seed.rel || ""),
      css_class: String(seed.css_class || ""),
      download_filename: String(seed.download_filename || ""),
      source_type: defaultSource(kind, String(seed.source_type || "")),
      preview_image: String(seed.preview_image || ""),
      preview_alt: String(seed.preview_alt || ""),
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
  }

  function resetKind(state, config, kind) {
    state.kind = kind;
    state.value = normaliseValue(kind, kind === "gallery" ? [] : "");
    state.action = defaultAction(config, kind);
    state.selection_label = "";
    state.source_type = defaultSource(kind);
    state.download_filename = "";
    state.preview_image = "";
    state.preview_alt = "";
    state._externalAutoPrefixed = false;
    state._externalInternalHint = false;
    state._relativeExternalHint = false;
    state._relativeAutoConverted = false;
    state._relativeAutoRooted = false;
    if (kind === "anchor") {
      state._anchorSuggestions = collectAnchorSuggestions(config);
    }
    state._view = "main";
  }

  function metadataNeeded(config, payload) {
    return list(config.metadata_required_kinds, METADATA_REQUIRED).includes(payload.kind) || payload.action === "preview_modal";
  }

  function metadataAttr(config, payload) {
    return metadataNeeded(config, payload) ? ` data-smartlink="${esc(JSON.stringify(payload))}"` : "";
  }

  function effectiveHref(payload) {
    if (payload.kind === "gallery") {
      return payload.value[0]?.src || "#";
    }

    if (payload.kind === "anchor" && String(payload.value || "").charAt(0) !== "#") {
      return `#${String(payload.value || "")}`;
    }

    if (payload.kind === "relative_url") {
      return normaliseRelativeHref(payload.value) || "#";
    }

    return payload.value || "#";
  }

  function sync(root, state) {
    const actionField = root.querySelector(".js-action");
    const labelField = root.querySelector(".js-label");
    const titleField = root.querySelector(".js-title");
    const targetField = root.querySelector(".js-target");
    const relField = root.querySelector(".js-rel");
    const cssField = root.querySelector(".js-css");
    const downloadField = root.querySelector(".js-download");
    const previewImageField = root.querySelector(".js-preview-image");
    const previewAltField = root.querySelector(".js-preview-alt");
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

    if (downloadField) {
      state.download_filename = downloadField.value || "";
    }

    if (previewImageField) {
      state.preview_image = previewImageField.value || "";
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
  }

  function payloadFrom(state) {
    return {
      kind: state.kind,
      value: state.kind === "gallery" ? (Array.isArray(state.value) ? state.value : []) : (state.kind === "com_tags_tag" ? (Array.isArray(state.value) ? state.value : []) : String(state.value || "")),
      action: state.action,
      label: state.label,
      selection_label: state.selection_label,
      title: state.title,
      target: state.target,
      rel: state.rel,
      css_class: state.css_class,
      download_filename: state.download_filename,
      source_type: state.source_type,
      preview_image: state.preview_image,
      preview_alt: state.preview_alt,
      video: state.video,
      gallery: state.gallery
    };
  }

  function linkMarkup(config, payload, body, extra = {}) {
    const attrs = [
      `href="${esc(extra.href || effectiveHref(payload))}"`,
      `class="${esc(["smartlink-link", payload.css_class || "", payload.action === "preview_modal" ? "js-smartlink-preview" : "", ...(extra.classes || [])].filter(Boolean).join(" "))}"`
    ];

    if (payload.title) {
      attrs.push(`title="${esc(payload.title)}"`);
    }

    if (payload.target) {
      attrs.push(`target="${esc(payload.target)}"`);
    }

    let rel = payload.rel || "";

    if (payload.target === "_blank") {
      rel = `${rel} noopener noreferrer`.trim();
    }

    if (rel) {
      attrs.push(`rel="${esc(Array.from(new Set(rel.split(/\s+/).filter(Boolean))).join(" "))}"`);
    }

    if (payload.action === "link_download") {
      attrs.push(`download="${esc(payload.download_filename || "download")}"`);
    }

    if (payload.action === "preview_modal") {
      attrs.push(`data-smartlink-preview="1"`);

      if (payload.preview_image) {
        attrs.push(`data-preview-image="${esc(payload.preview_image)}"`);
      }

      if (payload.preview_alt) {
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

    return `<a ${attrs.filter(Boolean).join(" ")}>${body}</a>`;
  }

  function galleryLinks(config, payload) {
    const items = Array.isArray(payload.value) ? payload.value : [];
    const links = items.map((item) => {
      const itemPayload = {
        ...payload,
        value: item.src || "",
        label: "",
        preview_image: payload.action === "preview_modal" && (item.type || "image") === "image" ? (item.src || "") : payload.preview_image,
        preview_alt: payload.preview_alt || item.label || ""
      };
      const text = item.label || basename(item.src || "") || "Open";
      return linkMarkup(config, itemPayload, esc(text), { meta: false });
    }).join("");

    return `<div class="smartlink smartlink-links"${metadataAttr(config, payload)}>${links}</div>`;
  }

  function buildMarkup(configOrPayload, maybePayload, overrideText = "") {
    const hasConfig = maybePayload && typeof maybePayload === "object" && !Array.isArray(maybePayload);
    const config = hasConfig ? (configOrPayload || {}) : {};
    const payload = hasConfig ? maybePayload : configOrPayload;
    const textOverride = hasConfig ? overrideText : (typeof maybePayload === "string" ? maybePayload : "");
    const text = textOverride || payload.label || payload.selection_label || (payload.kind === "gallery" ? "Gallery" : payload.value || "Open");

    if (payload.kind === "gallery" && payload.action !== "embed") {
      return galleryLinks(config, payload);
    }

    if (payload.action !== "embed") {
      if (payload.kind === "image" && payload.action === "preview_modal") {
        const previewPayload = {
          ...payload,
          preview_image: payload.value || payload.preview_image,
          preview_alt: payload.preview_alt || payload.label || ""
        };
        const body = `<img src="${esc(payload.value || "")}" alt="${esc(payload.preview_alt || payload.label || "")}" loading="lazy">`;
        return linkMarkup(config, previewPayload, body, { classes: ["smartlink-thumb-link"] });
      }

      if (payload.kind === "video" && payload.action === "preview_modal" && (payload.preview_image || payload.video?.poster)) {
        const poster = payload.preview_image || payload.video?.poster || "";
        const previewPayload = {
          ...payload,
          preview_image: poster,
          preview_alt: payload.preview_alt || payload.label || payload.selection_label || ""
        };
        const body = `<figure class="smartlink-image"><img src="${esc(poster)}" alt="${esc(payload.preview_alt || payload.label || payload.selection_label || "")}" loading="lazy"></figure>`;
        return linkMarkup(config, previewPayload, body, { classes: ["smartlink-thumb-link"] });
      }

      return linkMarkup(config, payload, esc(text));
    }

    const fallback = linkMarkup(config, payload, esc(text), { meta: false });

    if (payload.kind === "image") {
      const body = `<figure class="smartlink-image"><img src="${esc(payload.value || "")}" alt="${esc(payload.preview_alt || payload.label || "")}" loading="lazy"></figure>`;
      return `<div class="smartlink smartlink-embed"${metadataAttr(config, payload)}>${body}<div class="smartlink-fallback">${fallback}</div></div>`;
    }

    if (payload.kind === "video") {
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

      if (!body) {
        const attrs = [
          payload.video?.controls !== false ? "controls" : "",
          payload.video?.autoplay ? "autoplay" : "",
          payload.video?.loop ? "loop" : "",
          payload.video?.muted ? "muted" : "",
          payload.video?.poster ? `poster="${esc(payload.video.poster)}"` : ""
        ].filter(Boolean);
        body = `<video class="smartlink-video" ${attrs.join(" ")}><source src="${esc(payload.value || "")}"><a href="${esc(payload.value || "")}">${esc(text)}</a></video>`;
      }

      return `<div class="smartlink smartlink-embed"${metadataAttr(config, payload)}>${body}<div class="smartlink-fallback">${fallback}</div></div>`;
    }

    if (payload.kind === "gallery") {
      const items = Array.isArray(payload.value) ? payload.value : [];
      const grid = items.map((item) => {
        const classes = `smartlink-gallery__item${payload.gallery.link_behavior === "lightbox-hook" ? " js-smartlink-lightbox" : ""}`;
        const attrs = [
          `href="${esc(item.src || "")}"`,
          `class="${esc(classes)}"`
        ];

        if (payload.gallery.link_behavior === "lightbox-hook") {
          attrs.push(`data-smartlink-lightbox="1"`);
        }

        if ((item.type || "image") === "video") {
          const inner = item.poster
            ? `<img src="${esc(item.poster)}" alt="${esc(item.label || "Video")}" loading="lazy">`
            : `<span class="smartlink-gallery__video-label">${esc(item.label || "Video")}</span>`;
          return `<a ${attrs.join(" ")}>${inner}</a>`;
        }

        return `<a ${attrs.join(" ")}><img src="${esc(item.src || "")}" alt="${esc(item.label || "")}" loading="lazy"></a>`;
      }).join("");

      const body = `<div class="smartlink-gallery smartlink-gallery--${esc(payload.gallery.image_size_mode || "cover")}" style="--smartlink-gallery-columns:${Number(payload.gallery.columns || 3)};--smartlink-gallery-gap:${Number(payload.gallery.gap || 16)}px;">${grid}</div>`;
      return `<div class="smartlink smartlink-embed"${metadataAttr(config, payload)}>${body}<div class="smartlink-fallback">${fallback}</div></div>`;
    }

    return linkMarkup(config, payload, esc(text));
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
        <div class="smartlink-builder__summary">
          <div class="smartlink-builder__summary-caption">${esc(["com_content_article", "com_content_category", "menu_item", "com_contact_contact"].includes(state.kind) ? "Selected item" : (state.kind === "com_tags_tag" ? "Selected tags" : "Selected file"))}</div>
          <div class="smartlink-builder__summary-value">${esc(summaryText(state))}</div>
        </div>
        <input class="js-hidden-value" type="hidden" value="${esc(Array.isArray(state.value) ? state.value.join(",") : String(state.value || ""))}">
        <div class="smartlink-builder__actions">
          <button type="button" class="btn btn-outline-secondary js-picker">Choose...</button>
          ${(Array.isArray(state.value) ? state.value.length : state.value) ? `<button type="button" class="btn btn-outline-secondary js-clear">Clear</button>` : ""}
        </div>`;
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

  function renderDisplay(config, state) {
    const displayModes = modes(config, state.kind);
    const hasMultipleModes = displayModes.length > 1;

    if (!hasMultipleModes) {
      state.action = displayModes[0][0];
    }

    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">Display</h4>
        <div class="smartlink-builder__grid">
          <label class="smartlink-builder__field">
            <span>How it appears</span>
            ${hasMultipleModes
              ? `<select class="form-select js-action">
                  ${displayModes.map((mode) => `<option value="${esc(mode[0])}"${mode[0] === state.action ? " selected" : ""}>${esc(mode[1])}</option>`).join("")}
                </select>`
              : `<select class="form-select js-action smartlink-builder__select-readonly" aria-disabled="true" tabindex="-1" disabled>
                  <option value="${esc(displayModes[0][0])}" selected>${esc(displayModes[0][1])}</option>
                </select>`
            }
          </label>
          ${state.kind !== "gallery" && !(state.kind === "image" && state.action !== "link_open") && !(state.kind === "video" && state.action !== "link_open") ? `
            <label class="smartlink-builder__field">
              <span>Text to display</span>
              <input class="form-control js-label" type="text" value="${esc(state.label)}" placeholder="${esc(labelHint(state))}">
            </label>` : ""}
          ${state.kind === "image" ? `
            <label class="smartlink-builder__field">
              <span>Alternative text</span>
              <input class="form-control js-preview-alt" type="text" value="${esc(state.preview_alt)}">
            </label>` : ""}
          ${state.action === "link_download" ? `
            <label class="smartlink-builder__field">
              <span>Download filename (optional)</span>
              <input class="form-control js-download" type="text" value="${esc(state.download_filename)}" placeholder="${esc(downloadFilenameHint(state))}">
            </label>` : ""}
          ${state.action === "preview_modal" && state.kind !== "image" ? `
            <label class="smartlink-builder__field">
              <span>Preview image</span>
              <input class="form-control js-preview-image" type="url" value="${esc(state.preview_image)}">
            </label>` : ""}
        </div>
        ${state.kind === "video" && state.action === "embed" ? `
          <div class="smartlink-builder__panel smartlink-builder__grid">
            <label><input class="js-video-controls" type="checkbox"${state.video.controls ? " checked" : ""}> Show controls</label>
            <label><input class="js-video-autoplay" type="checkbox"${state.video.autoplay ? " checked" : ""}> Start playing automatically</label>
            <label><input class="js-video-loop" type="checkbox"${state.video.loop ? " checked" : ""}> Repeat</label>
            <label><input class="js-video-muted" type="checkbox"${state.video.muted ? " checked" : ""}> Start muted</label>
            <label class="smartlink-builder__field">
              <span>Preview image</span>
              <input class="form-control js-video-poster" type="url" value="${esc(state.video.poster)}">
            </label>
          </div>` : ""}
        ${state.kind === "gallery" ? `
          <div class="smartlink-builder__panel smartlink-builder__grid">
            <label class="smartlink-builder__field"><span>Columns</span><input class="form-control js-gallery-columns" type="number" min="1" value="${esc(state.gallery.columns)}"></label>
            <label class="smartlink-builder__field"><span>Gap</span><input class="form-control js-gallery-gap" type="number" min="0" value="${esc(state.gallery.gap)}"></label>
            <label class="smartlink-builder__field">
              <span>What happens when clicked?</span>
              <select class="form-select js-gallery-link">
                <option value="open"${state.gallery.link_behavior === "open" ? " selected" : ""}>Open the file</option>
                <option value="lightbox-hook"${state.gallery.link_behavior === "lightbox-hook" ? " selected" : ""}>Open in popup</option>
              </select>
            </label>
            <label class="smartlink-builder__field">
              <span>How the items fit</span>
              <select class="form-select js-gallery-size">
                <option value="cover"${state.gallery.image_size_mode === "cover" ? " selected" : ""}>Fill the space</option>
                <option value="contain"${state.gallery.image_size_mode === "contain" ? " selected" : ""}>Show the whole item</option>
                <option value="stretch"${state.gallery.image_size_mode === "stretch" ? " selected" : ""}>Stretch to fit</option>
                <option value="stretch_width"${state.gallery.image_size_mode === "stretch_width" ? " selected" : ""}>Stretch to full width</option>
                <option value="stretch_height"${state.gallery.image_size_mode === "stretch_height" ? " selected" : ""}>Stretch to full height</option>
              </select>
            </label>
          </div>` : ""}
      </section>`;
  }

  function renderAdvanced(state) {
    return `
      <section class="smartlink-builder__section">
        <h4 class="smartlink-builder__section-title">Advanced</h4>
        <div class="smartlink-builder__grid">
          <label class="smartlink-builder__field"><span>Title</span><input class="form-control js-title" type="text" value="${esc(state.title)}"></label>
          <label class="smartlink-builder__field"><span>Open in</span><input class="form-control js-target" type="text" value="${esc(state.target)}" placeholder="_blank"></label>
          <label class="smartlink-builder__field"><span>Rel</span><input class="form-control js-rel" type="text" value="${esc(state.rel)}" placeholder="nofollow"></label>
          <label class="smartlink-builder__field"><span>CSS class</span><input class="form-control js-css" type="text" value="${esc(state.css_class)}"></label>
        </div>
      </section>`;
  }

  function renderBody(config, state) {
    return state._view === "advanced" ? renderAdvanced(state) : `${renderGeneral(state)}${renderDisplay(config, state)}`;
  }

  function renderPreview(config, state) {
    const payload = payloadFrom(state);
    const previewMarkup = hasPreviewValue(payload)
      ? buildMarkup(config, payload)
      : `<div class="smartlink-builder__empty">Nothing to preview yet.</div>`;

    return `
      <section class="smartlink-builder__section smartlink-builder__section--preview">
        <h4 class="smartlink-builder__section-title">Preview</h4>
        <div class="smartlink-builder__preview-canvas js-smartlink-preview-canvas">${previewMarkup}</div>
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
            if (!state.label && selection.label && state.action === "link_open" && !["image", "video"].includes(state.kind)) {
              state.label = String(selection.label);
            }
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
