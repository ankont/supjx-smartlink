import { JoomlaEditorButton } from "editor-api";

(() => {
  const DEFAULT_ICON_STYLESHEET_URL = "/media/system/css/joomla-fontawesome.min.css";
  const DEFAULT_CONTENT_STYLESHEET_URL = "/media/plg_fields_smartlink/smartlink-content.css";
  const DEFAULT_CONTENT_SCRIPT_URL = "/media/plg_fields_smartlink/smartlink-content.js";
  const DEFAULT_LINK_BUTTON_CLASS = "smartlink-actionbtn";
  const EMITTED_KIND_MAP = {
    external: "external_url",
    relative: "relative_url",
    anchor: "anchor",
    email: "email",
    phone: "phone",
    article: "com_content_article",
    category: "com_content_category",
    menu: "menu_item",
    tag: "com_tags_tag",
    contact: "com_contact_contact",
    file: "media_file",
    image: "image",
    video: "video",
    gallery: "gallery",
    user: "user_profile",
    route: "advanced_route"
  };
  const BARE_LAYOUT_KINDS = ["com_content_article", "com_content_category", "menu_item", "com_tags_tag", "com_contact_contact", "user_profile", "advanced_route", "relative_url"];
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

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normaliseWhitespace(value) {
    return String(value ?? "")
      .replace(/\u200B/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isElement(value) {
    return Boolean(value) && value.nodeType === 1 && typeof value.closest === "function";
  }

  function getSelection(editor) {
    if (editor?.getSelection) {
      return String(editor.getSelection() || "");
    }

    return "";
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

  function collectAnchorSuggestions(editor, existing = []) {
    const suggestions = new Set();
    const push = (value) => {
      const candidate = normaliseAnchorCandidate(value);
      if (candidate) {
        suggestions.add(candidate);
      }
    };

    (Array.isArray(existing) ? existing : []).forEach(push);

    if (editor?.getValue) {
      extractAnchorsFromHtml(editor.getValue()).forEach(push);
    }

    return Array.from(suggestions).slice(0, 80);
  }

  function isTinyMceEditor(value) {
    return Boolean(value) && (
      typeof value?.getDoc === "function"
      || typeof value?.getBody === "function"
      || typeof value?.selection?.getNode === "function"
      || typeof value?.dom?.setOuterHTML === "function"
      || typeof value?.options?.get === "function"
      || typeof value?.settings === "object"
    );
  }

  function getTinyMceEditor(editor = null) {
    if (isTinyMceEditor(editor)) {
      return editor;
    }

    const activeEditor = window.tinymce?.activeEditor || null;
    return isTinyMceEditor(activeEditor) ? activeEditor : null;
  }

  function listish(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  function tinyOption(editor, key) {
    try {
      if (editor?.options?.get) {
        return editor.options.get(key);
      }
    } catch (error) {
    }

    return editor?.settings?.[key];
  }

  function previewContext(editor) {
    const tinyEditor = getTinyMceEditor(editor);

    if (!tinyEditor) {
      return {};
    }

    const contentCss = listish(tinyOption(tinyEditor, "content_css"));
    const contentStyle = String(tinyOption(tinyEditor, "content_style") || "");
    const bodyClass = String(tinyOption(tinyEditor, "body_class") || "");
    const documentBase = String(
      tinyOption(tinyEditor, "document_base_url")
      || tinyEditor.documentBaseURI?.getURI?.()
      || `${window.location.origin}/`
    );

    return {
      content_css: contentCss,
      content_style: contentStyle,
      body_class: bodyClass,
      document_base_url: documentBase
    };
  }

  function absoluteEditorAssetUrl(value, editor = null) {
    const raw = String(value || "").trim();

    if (!raw) {
      return "";
    }

    const context = previewContext(editor);
    const base = String(context.document_base_url || `${window.location.origin}/`).trim() || `${window.location.origin}/`;

    try {
      return new URL(raw, base).toString();
    } catch (error) {
      return raw;
    }
  }

  function versionedSmartlinkAssetUrl(href, config = {}) {
    const raw = String(href || "").trim();
    const version = String(config?.asset_version || "").trim();

    if (!raw || !version) {
      return raw;
    }

    if (!/\/media\/plg_fields_smartlink\/smartlink-content\.(css|js)(?:[?#].*)?$/i.test(raw)) {
      return raw;
    }

    try {
      const url = new URL(raw, window.location.origin);
      url.searchParams.set("v", version);
      return url.toString();
    } catch (error) {
      const separator = raw.includes("?") ? "&" : "?";
      return `${raw}${separator}v=${encodeURIComponent(version)}`;
    }
  }

  function isSmartlinkContentAssetUrl(value, kind = "css") {
    const raw = String(value || "").trim();

    if (!raw) {
      return false;
    }

    const pattern = kind === "js"
      ? /\/media\/plg_fields_smartlink\/smartlink-content\.js(?:[?#].*)?$/i
      : /\/media\/plg_fields_smartlink\/smartlink-content\.css(?:[?#].*)?$/i;

    return pattern.test(raw);
  }

  function ensureEditorStylesheet(editor, href, marker) {
    const absoluteHref = absoluteEditorAssetUrl(href, editor);

    if (!absoluteHref) {
      return;
    }

    const tinyEditor = getTinyMceEditor(editor);
    const doc = tinyEditor?.getDoc?.() || null;
    const head = doc?.head || null;

    if (!head || !doc?.createElement) {
      return;
    }

    if (isSmartlinkContentAssetUrl(absoluteHref, "css")) {
      Array.from(head.querySelectorAll("link[rel='stylesheet']"))
        .forEach((node) => {
          const currentHref = String(node.getAttribute("href") || "").trim();

          if (isSmartlinkContentAssetUrl(currentHref, "css")) {
            node.remove();
          }
        });
    }

    const exists = Array.from(head.querySelectorAll("link[rel='stylesheet']"))
      .some((node) => {
        const currentHref = String(node.getAttribute("href") || "").trim();

        if (!currentHref) {
          return false;
        }

        try {
          return new URL(currentHref, doc.baseURI || window.location.origin).toString() === absoluteHref;
        } catch (error) {
          return currentHref === absoluteHref;
        }
      });

    if (exists) {
      return;
    }

    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = absoluteHref;
    link.setAttribute(marker, "1");
    head.appendChild(link);
  }

  function ensureEditorIconStylesheet(editor, config = {}) {
    ensureEditorStylesheet(editor, config.icon_stylesheet_url || DEFAULT_ICON_STYLESHEET_URL, "data-smartlink-icon-stylesheet");
  }

  function ensureEditorScript(editor, src, marker) {
    const absoluteSrc = absoluteEditorAssetUrl(src, editor);

    if (!absoluteSrc) {
      return;
    }

    const tinyEditor = getTinyMceEditor(editor);
    const doc = tinyEditor?.getDoc?.() || null;
    const head = doc?.head || null;

    if (!head || !doc?.createElement) {
      return;
    }

    if (isSmartlinkContentAssetUrl(absoluteSrc, "js")) {
      Array.from(head.querySelectorAll("script[src]"))
        .forEach((node) => {
          const currentSrc = String(node.getAttribute("src") || "").trim();

          if (isSmartlinkContentAssetUrl(currentSrc, "js")) {
            node.remove();
          }
        });
    }

    const exists = Array.from(head.querySelectorAll("script[src]"))
      .some((node) => {
        const currentSrc = String(node.getAttribute("src") || "").trim();

        if (!currentSrc) {
          return false;
        }

        try {
          return new URL(currentSrc, doc.baseURI || window.location.origin).toString() === absoluteSrc;
        } catch (error) {
          return currentSrc === absoluteSrc;
        }
      });

    if (exists) {
      return;
    }

    const script = doc.createElement("script");
    script.src = absoluteSrc;
    script.setAttribute(marker, "1");
    head.appendChild(script);
  }

  function useSmartlinkStyles(config = {}) {
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

  function ensureEditorContentStylesheet(editor, config = {}) {
    if (!useSmartlinkStyles(config)) {
      return;
    }

    ensureEditorStylesheet(editor, versionedSmartlinkAssetUrl(DEFAULT_CONTENT_STYLESHEET_URL, config), "data-smartlink-content-stylesheet");
  }

  function ensureEditorContentScript(editor, config = {}) {
    ensureEditorScript(editor, versionedSmartlinkAssetUrl(DEFAULT_CONTENT_SCRIPT_URL, config), "data-smartlink-content-script");
  }

  function bootstrapConfig() {
    const globalConfig = window.SuperSoftSmartLinkEditorConfig;

    return globalConfig && typeof globalConfig === "object"
      ? globalConfig
      : {};
  }

  function ensureEditorRuntimeStyles(editor, config = {}) {
    ensureEditorContentStylesheet(editor, config);
    ensureEditorIconStylesheet(editor, config);
    ensureEditorContentScript(editor, config);
  }

  function ensureKnownEditorsStyled(config = {}) {
    const editors = Array.isArray(window.tinymce?.editors) ? window.tinymce.editors : [];

    editors.forEach((editor) => {
      ensureEditorRuntimeStyles(editor, config);
    });
  }

  function installEditorStyleBootstrap() {
    const config = bootstrapConfig();
    const applyKnown = () => ensureKnownEditorsStyled(config);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyKnown, { once: true });
    } else {
      applyKnown();
    }

    let attempts = 0;
    const maxAttempts = 24;
    const intervalId = window.setInterval(() => {
      applyKnown();
      attempts += 1;

      if (attempts >= maxAttempts) {
        window.clearInterval(intervalId);
      }
    }, 500);

    try {
      if (window.tinymce?.on) {
        window.tinymce.on("AddEditor", (event) => {
          const editor = event?.editor || null;
          if (editor?.on) {
            editor.on("init", () => {
              ensureEditorRuntimeStyles(editor, config);
            });
          }
          ensureEditorRuntimeStyles(editor, config);
        });
      }
    } catch (error) {
    }
  }

  function splitClassNames(value) {
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function linkButtonClassNames(config = {}) {
    if (useSmartlinkStyles(config)) {
      return [DEFAULT_LINK_BUTTON_CLASS];
    }

    const raw = Object.prototype.hasOwnProperty.call(config || {}, "link_button_class")
      ? String(config.link_button_class || "").trim()
      : DEFAULT_LINK_BUTTON_CLASS;

    return splitClassNames(raw || DEFAULT_LINK_BUTTON_CLASS);
  }

  function thumbnailClassMappings(config = {}) {
    const useDefaults = useSmartlinkStyles(config);
    const read = (key, fallback) => {
      if (useDefaults) {
        return fallback;
      }

      if (Object.prototype.hasOwnProperty.call(config || {}, key)) {
        return String(config[key] || "").trim();
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

  function matchesAllClasses(classList, classes) {
    return classes.length > 0 && classes.every((className) => classList.includes(className));
  }

  function extractMappedThumbnailValue(classList, mappingGroup, orderedKeys = []) {
    const entries = orderedKeys.map((key) => [key, mappingGroup[key] || ""]);

    for (const [key, mappedClass] of entries) {
      const classes = splitClassNames(mappedClass);

      if (matchesAllClasses(classList, classes)) {
        return key;
      }
    }

    return "";
  }

  function currentSelectionElement(editor) {
    const tinyEditor = getTinyMceEditor(editor);
    const node = tinyEditor?.selection?.getNode?.() || null;

    if (!node) {
      return null;
    }

    return node.nodeType === 1 ? node : node.parentElement;
  }

  function findEditableRoot(editor) {
    const element = currentSelectionElement(editor);

    if (!isElement(element)) {
      return null;
    }

    return element.closest(".smartlink-wrapper")
      || element.closest(".smartlink-links")
      || element.closest("figure.smartlink")
      || element.closest("div.smartlink")
      || element.closest("span.smartlink")
      || element.closest("button.smartlink")
      || element.closest("a.smartlink")
      || element.closest("button[data-toggle-view='1']")
      || element.closest("a[href]");
  }

  function replaceMarkup(editor, context, markup) {
    const root = context?.root;

    if (isElement(root)) {
      const tinyEditor = getTinyMceEditor(editor);

      if (tinyEditor?.dom?.setOuterHTML) {
        tinyEditor.dom.setOuterHTML(root, markup);
        return;
      }

      root.outerHTML = markup;
      return;
    }

    insertMarkup(editor, markup);
  }

  function insertMarkup(editor, markup) {
    if (editor?.replaceSelection) {
      editor.replaceSelection(markup);
      return;
    }

    if (editor?.insertHtml) {
      editor.insertHtml(markup);
      return;
    }

    if (editor?.setValue && editor?.getValue) {
      editor.setValue(`${editor.getValue()}${markup}`);
    }
  }

  function fallbackResult(selection) {
    const href = window.prompt("SmartLink URL", "");

    if (href === null) {
      return null;
    }

    const safeHref = String(href || "").trim();

    if (!safeHref) {
      return null;
    }

    const linkText = selection || safeHref;
    const markup = `<a href="${esc(safeHref)}">${esc(linkText)}</a>`;

    return {
      payload: {
        kind: "external_url",
        value: safeHref,
        action: "link_open",
        label: selection || "",
        selection_label: selection || safeHref,
        title: "",
        target: "",
        rel: "",
        css_class: "",
        download_filename: "",
        source_type: "",
        preview_image: "",
        image_override: "",
        preview_alt: "",
        show_icon: false,
        show_image: false,
        show_text: true,
        display_inside: false,
        click_individual_parts: false,
        click_icon: false,
        click_text: false,
        click_image: false,
        click_view: false,
        structure: "inline",
        view_position: "after",
        show_summary: false,
        show_type_label: false,
        figure_caption_text: false,
        video: {
          controls: true,
          autoplay: false,
          loop: false,
          muted: false,
          poster: ""
        },
        gallery: {
          layout: "grid",
          columns: 3,
          gap: 16,
          link_behavior: "open",
          image_size_mode: "cover"
        }
      },
      markup
    };
  }

  function hasUrlScheme(value) {
    return /^[a-z][a-z0-9+.-]*:/i.test(String(value || "").trim());
  }

  function isCurrentSiteHostname(hostname) {
    const current = String(window.location.hostname || "").toLowerCase();
    const host = String(hostname || "").toLowerCase();

    if (!host || !current) {
      return false;
    }

    return host === current || host === `www.${current}` || current === `www.${host}`;
  }

  function toRelativeHref(value) {
    const raw = String(value || "").trim();

    if (!raw) {
      return "";
    }

    if (/^(\/|\.\/|\.\.\/|\?|#|index\.php\?)/i.test(raw)) {
      return raw;
    }

    try {
      const url = new URL(raw, window.location.origin);

      if (!/^https?:$/i.test(url.protocol) || !isCurrentSiteHostname(url.hostname)) {
        return "";
      }

      const relative = `${url.pathname}${url.search}${url.hash}` || "/";
      if (!relative) {
        return "";
      }

      return /^(\/|\?|#)/.test(relative) ? relative : `/${relative}`;
    } catch (error) {
      return "";
    }
  }

  function inferJoomlaKind(rawHref) {
    try {
      const url = new URL(String(rawHref || "").trim(), window.location.origin);
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

      const itemId = String(url.searchParams.get("Itemid") || "");
      if (itemId) {
        return { kind: "menu_item", value: itemId };
      }
    } catch (error) {
    }

    return null;
  }

  function matchesUrlExtension(value, extensions) {
    const raw = String(value || "").trim();

    if (!raw) {
      return false;
    }

    return new RegExp(`\\.(${extensions.join("|")})(?:[?#].*)?$`, "i").test(raw);
  }

  function isImageLikeUrl(value) {
    return matchesUrlExtension(value, ["avif", "bmp", "gif", "ico", "jpe?g", "png", "svg", "webp"]);
  }

  function isVideoLikeUrl(value) {
    return matchesUrlExtension(value, ["mp4", "m4v", "mov", "ogv", "ogg", "webm"]);
  }

  function isFileLikeUrl(value) {
    return matchesUrlExtension(value, [
      "pdf", "zip", "rar", "7z", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
      "csv", "txt", "rtf", "odt", "ods", "odp", "epub", "mp3", "wav"
    ]);
  }

  function extractGalleryItems(root) {
    const gallery = root?.matches?.(".smartlink-gallery, .smartlink-links")
      ? root
      : root?.querySelector?.(".smartlink-gallery, .smartlink-links");

    if (!isElement(gallery)) {
      return [];
    }

    return Array.from(gallery.querySelectorAll(":scope > .smartlink-item, :scope > a"))
      .map((item) => {
        if (!isElement(item)) {
          return null;
        }

        const img = item.querySelector("img");
        const labelNode = item.querySelector(".smartlink-item-label");
        const type = String(item.getAttribute("data-item") || "").trim() === "video" ? "video" : "image";
        const src = type === "video"
          ? String(item.getAttribute("href") || "").trim()
          : String(img?.getAttribute("src") || item.getAttribute("href") || "").trim();
        const poster = String(item.getAttribute("data-poster") || img?.getAttribute("src") || "").trim();
        const label = normaliseWhitespace(labelNode?.textContent || img?.getAttribute("alt") || item.textContent || "");

        if (!src && !poster) {
          return null;
        }

        return {
          type,
          src,
          poster,
          label
        };
      })
      .filter(Boolean);
  }

  function inferMediaKind(root, anchor, rawHref) {
    const galleryItems = extractGalleryItems(root);

    if (galleryItems.length) {
      return { kind: "gallery", value: galleryItems };
    }

    if (anchor?.hasAttribute("download")) {
      return { kind: "media_file", value: rawHref };
    }

    const localVideo = root?.querySelector?.("video.smartlink-video");
    if (isElement(localVideo)) {
      const source = localVideo.querySelector("source[src]");
      const src = String(source?.getAttribute("src") || localVideo.getAttribute("src") || rawHref || "").trim();
      return src ? { kind: "video", value: src } : { kind: "video", value: rawHref };
    }

    const providerFrame = root?.querySelector?.(".smartlink-view iframe, iframe");
    if (isElement(providerFrame)) {
      const src = String(providerFrame.getAttribute("src") || "").trim();
      if (/youtube\.com\/embed|player\.vimeo\.com\/video/i.test(src)) {
        return { kind: "video", value: rawHref || src };
      }
    }

    const viewImage = root?.querySelector?.(".smartlink-view > img, .smartlink-view img");
    if (isElement(viewImage)) {
      const src = String(viewImage.getAttribute("src") || "").trim();
      return src ? { kind: "image", value: src } : null;
    }

    const imageData = extractImageData(root);
    if (imageData.src && isImageLikeUrl(rawHref || imageData.src)) {
      return { kind: "image", value: imageData.src || rawHref };
    }

    if (isFileLikeUrl(rawHref)) {
      return { kind: "media_file", value: rawHref };
    }

    if (isVideoLikeUrl(rawHref)) {
      return { kind: "video", value: rawHref };
    }

    if (isImageLikeUrl(rawHref)) {
      return { kind: "image", value: rawHref };
    }

    return null;
  }

  function mapEmittedKind(value) {
    const raw = String(value || "").trim().toLowerCase();

    if (!raw) {
      return "";
    }

    return EMITTED_KIND_MAP[raw] || "";
  }

  function parseMetadataSeed(holder) {
    if (!isElement(holder)) {
      return null;
    }

    const raw = String(holder.getAttribute("data-kind") || "").trim();

    if (!raw) {
      return null;
    }

    const kind = mapEmittedKind(raw);

    if (!kind) {
      return null;
    }

    const valueAttr = String(holder.getAttribute("data-value") || "").trim();
    const value = kind === "com_tags_tag"
      ? valueAttr.split(/\s*,\s*/).filter(Boolean)
      : valueAttr;

    return { kind, value };
  }

  function findMetadataHolder(root) {
    if (!isElement(root)) {
      return null;
    }

    return root.matches("[data-kind]") ? root : root.querySelector("[data-kind]");
  }

  function findMainAnchor(root) {
    if (!isElement(root)) {
      return null;
    }

    if (root.matches("a[href], button[data-toggle-view='1']")) {
      return root;
    }

    return root.querySelector(":scope > a[href], :scope > button[data-toggle-view='1'], :scope > .smartlink > a[href], :scope > .smartlink > button[data-toggle-view='1'], a[href], button[data-toggle-view='1']");
  }

  function contentRoot(root) {
    if (!isElement(root)) {
      return null;
    }

    if (root.matches(".smartlink")) {
      return root;
    }

    return root.querySelector(":scope > .smartlink, :scope > a.smartlink, :scope > div.smartlink, :scope > span.smartlink, :scope > figure.smartlink") || root;
  }

  function detectStructure(root) {
    if (!isElement(root)) {
      return "inline";
    }

    if (root.matches("figure.smartlink")) {
      return "figure";
    }

    if (root.matches("div.smartlink-wrapper") || root.matches("div.smartlink")) {
      return "block";
    }

    if (root.matches("span.smartlink-wrapper")) {
      return "inline";
    }

    if (root.matches("a.smartlink") && root.querySelector(":scope > figure")) {
      return "figure";
    }

    return "inline";
  }

  function extractPrimaryText(root) {
    if (!isElement(root)) {
      return "";
    }

    const clone = root.cloneNode(true);

    clone.querySelectorAll([
      ".smartlink-icon",
      ".smartlink-thumb",
      ".smartlink-summary",
      ".smartlink-type",
      ".smartlink-caption",
      ".smartlink-item",
      ".smartlink-item-label",
      ".smartlink-view",
      ".smartlink-gallery",
      ".smartlink-inline-viewer",
      "iframe",
      "video",
      "img"
    ].join(",")).forEach((node) => node.remove());

    return normaliseWhitespace(clone.textContent || "");
  }

  function extractUserClasses(element, config = {}) {
    if (!isElement(element)) {
      return "";
    }

    const ignoredButtonClasses = new Set(linkButtonClassNames(config));

    return Array.from(element.classList || [])
      .filter((className) => className !== "smartlink"
        && className !== "smartlink-wrapper"
        && className !== "smartlink-links"
        && className !== "js-smartlink-preview"
        && className !== "smartlink-part"
        && !className.startsWith("smartlink-part--")
        && !ignoredButtonClasses.has(className))
      .join(" ");
  }

  function extractIconClass(root) {
    const icon = root?.querySelector?.(".smartlink-icon");

    if (!isElement(icon)) {
      return "";
    }

    return Array.from(icon.classList || [])
      .filter((className) => className !== "smartlink-icon")
      .join(" ");
  }

  function defaultIconClass(kind) {
    switch (String(kind || "")) {
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
      default:
        return "fa-solid fa-link";
    }
  }

  function normaliseImportedIconClass(value, kind) {
    const iconClass = String(value || "").trim();

    if (!iconClass) {
      return "";
    }

    return iconClass === defaultIconClass(kind) ? "" : iconClass;
  }

  function extractImageData(root) {
    const thumbImage = root?.querySelector?.(".smartlink-thumb > img, .smartlink-thumb img");
    const directImage = root?.matches?.("img") ? root : root?.querySelector?.(":scope > img");
    const wrappedImage = root?.querySelector?.("figure.smartlink-image > img, .smartlink-view > img");
    const image = isElement(thumbImage)
      ? thumbImage
      : (isElement(directImage) ? directImage : (isElement(wrappedImage) ? wrappedImage : null));

    if (!isElement(image)) {
      return { src: "", alt: "" };
    }

    return {
      src: String(image.getAttribute("src") || "").trim(),
      alt: String(image.getAttribute("alt") || "").trim()
    };
  }

  function extractThumbnailSettings(root, config = {}) {
    const thumb = root?.querySelector?.(".smartlink-thumb");

    if (!isElement(thumb)) {
      return {
        thumbnail_empty_class: "",
        thumbnail_override: false,
        thumbnail_position: "",
        thumbnail_ratio: "",
        thumbnail_fit: "",
        thumbnail_size: ""
      };
    }

    const mappings = thumbnailClassMappings(config);
    const classList = Array.from(thumb.classList || []);
    const emptyNode = Array.from(thumb.children || []).find((node) => isElement(node) && node.tagName.toLowerCase() === "span") || null;
    const thumbnailPosition = extractMappedThumbnailValue(classList, mappings.position, ["inline", "top", "bottom", "left", "right"]);
    const thumbnailRatio = extractMappedThumbnailValue(classList, mappings.ratio, ["auto", "1-1", "4-3", "16-9"]);
    const thumbnailFit = extractMappedThumbnailValue(classList, mappings.fit, ["cover", "contain", "fill", "none", "scale-down"]);
    const thumbnailSize = extractMappedThumbnailValue(classList, mappings.size, ["sm", "md", "lg"]);
    const thumbnailOverride = Boolean(thumbnailPosition || thumbnailRatio || thumbnailFit || thumbnailSize);

    return {
      thumbnail_empty_class: isElement(emptyNode) ? Array.from(emptyNode.classList || []).join(" ") : "",
      thumbnail_override: thumbnailOverride,
      thumbnail_position: thumbnailPosition,
      thumbnail_ratio: thumbnailRatio,
      thumbnail_fit: thumbnailFit,
      thumbnail_size: thumbnailSize
    };
  }

  function extractSummaryText(root) {
    const summary = root?.querySelector?.(".smartlink-summary");

    if (!isElement(summary)) {
      return "";
    }

    return normaliseWhitespace(summary.textContent || "");
  }

  function detectAction(anchor) {
    if (!isElement(anchor)) {
      return "no_action";
    }

    if (anchor.getAttribute("data-toggle-view") === "1") {
      return "toggle_view";
    }

    if (anchor.hasAttribute("download")) {
      return "link_download";
    }

    if (anchor.classList.contains("js-smartlink-preview") || anchor.getAttribute("data-preview") === "1") {
      return "preview_modal";
    }

    return anchor.getAttribute("href") ? "link_open" : "no_action";
  }

  function detectViewPosition(root) {
    const holder = isElement(root) && (root.matches(".smartlink-wrapper") || root.matches("figure.smartlink"))
      ? root
      : root?.querySelector?.(":scope > .smartlink-wrapper, :scope > figure.smartlink, .smartlink-wrapper, figure.smartlink");

    if (!isElement(holder)) {
      return "after";
    }

    const firstElement = Array.from(holder.children).find((node) => isElement(node)) || null;

    if (!isElement(firstElement)) {
      return "after";
    }

    if (firstElement.matches(".smartlink-view, .smartlink-gallery, video.smartlink-video, figure.smartlink-image, .smartlink-part--view")
      || firstElement.querySelector?.(":scope > .smartlink-view, :scope > .smartlink-gallery, :scope > video.smartlink-video, :scope > figure.smartlink-image")) {
      return "before";
    }

    return "after";
  }

  function detectDisplayInside(root, action) {
    const viewNode = root?.querySelector?.(".smartlink-view, .smartlink-gallery, video.smartlink-video, figure.smartlink-image, .smartlink-part--view");

    if (!isElement(viewNode)) {
      return false;
    }

    if (action === "toggle_view") {
      return !viewNode.hasAttribute("hidden");
    }

    return true;
  }

  function detectPopupScope(root, anchor, kind) {
    if (!BARE_LAYOUT_KINDS.includes(String(kind || ""))) {
      return "";
    }

    const href = String(anchor?.getAttribute?.("href") || anchor?.href || "").trim();
    const view = root?.querySelector?.(".smartlink-view");
    const wrapperSrc = String(view?.getAttribute?.("data-src") || "").trim();
    const iframe = root?.querySelector?.(".smartlink-view iframe");
    const iframeSrc = String(iframe?.getAttribute?.("src") || iframe?.src || iframe?.getAttribute?.("data-src") || "").trim();
    const candidate = wrapperSrc || iframeSrc || href;

    if (!candidate) {
      return "component";
    }

    if (String(kind || "") === "com_content_article" && /([?&])smartlink=content(?:[&#]|$)/i.test(candidate)) {
      return "content";
    }

    return /([?&])tmpl=component(?:[&#]|$)/i.test(candidate) ? "component" : "page";
  }

  function inferKindValue(root, anchor, metadataSeed) {
    if (metadataSeed?.kind) {
      return {
        kind: metadataSeed.kind,
        value: Object.prototype.hasOwnProperty.call(metadataSeed, "value") ? metadataSeed.value : ""
      };
    }

    const rawHref = isElement(anchor) ? String(anchor.getAttribute("href") || "").trim() : "";

    if (!isElement(anchor) && !isElement(root)) {
      return null;
    }

    if (rawHref.startsWith("#")) {
      return { kind: "anchor", value: rawHref.replace(/^#/, "") };
    }

    if (/^mailto:/i.test(rawHref)) {
      return { kind: "email", value: rawHref.replace(/^mailto:/i, "") };
    }

    if (/^tel:/i.test(rawHref)) {
      return { kind: "phone", value: rawHref.replace(/^tel:/i, "") };
    }

    const joomlaKind = inferJoomlaKind(rawHref);
    if (joomlaKind) {
      return joomlaKind;
    }

    const mediaKind = inferMediaKind(root, anchor, rawHref);
    if (mediaKind) {
      return mediaKind;
    }

    const relativeHref = toRelativeHref(rawHref);
    if (relativeHref) {
      return { kind: "relative_url", value: relativeHref };
    }

    if (!rawHref) {
      return null;
    }

    if (!hasUrlScheme(rawHref) && !/^\/\//.test(rawHref)) {
      return { kind: "external_url", value: rawHref };
    }

    return { kind: "external_url", value: rawHref };
  }

  function parseExistingLink(editor, config = {}) {
    const root = findEditableRoot(editor);

    if (!isElement(root)) {
      return null;
    }

    const holder = findMetadataHolder(root);
    const metadataSeed = parseMetadataSeed(holder);
    const anchor = findMainAnchor(root);
    const kindValue = inferKindValue(root, anchor, metadataSeed);

    if (!kindValue?.kind) {
      return null;
    }

    const visualRoot = contentRoot(root);
    const text = extractPrimaryText(visualRoot);
    const imageData = extractImageData(visualRoot || root);
    const thumbnailSettings = extractThumbnailSettings(visualRoot || root, config);
    const summary = extractSummaryText(visualRoot || root);
    const partLinks = Array.from(root.querySelectorAll(".smartlink-part"));
    const previewImage = anchor?.getAttribute("data-preview-image") || "";
    const previewAlt = anchor?.getAttribute("data-preview-alt") || "";
    const metadataKind = metadataSeed?.kind || "";
    const viewNode = root?.querySelector?.(".smartlink-view");
    const wrapperSrc = String(viewNode?.getAttribute?.("data-src") || "").trim();
    const iframeNode = root?.querySelector?.(".smartlink-view iframe");
    const iframeSrc = String(iframeNode?.getAttribute?.("src") || iframeNode?.src || iframeNode?.getAttribute?.("data-src") || "").trim();
    const importedSelectionHref = wrapperSrc || iframeSrc || String(anchor?.getAttribute("href") || anchor?.href || "").trim();
    const usesManualThumbnail = ["external_url", "relative_url"].includes(kindValue.kind);
    const importedImageOverride = usesManualThumbnail ? imageData.src : "";
    const importedSelectionImage = usesManualThumbnail ? "" : imageData.src;
    const importedSelectionImageAlt = usesManualThumbnail ? "" : imageData.alt;
    const importedPreviewAlt = previewAlt || (usesManualThumbnail ? imageData.alt : "");
    const action = detectAction(anchor);
    const payload = {
      ...(metadataSeed && typeof metadataSeed === "object" ? metadataSeed : {}),
      kind: kindValue.kind,
      value: kindValue.value,
      action,
      label: text,
      selection_label: metadataKind ? text : "",
      title: anchor?.getAttribute("title") || "",
      target: anchor?.getAttribute("target") || "",
      rel: anchor?.getAttribute("rel") || "",
      css_class: extractUserClasses(visualRoot || anchor || root, config),
      icon_class: normaliseImportedIconClass(extractIconClass(visualRoot || root), kindValue.kind),
      popup_scope: detectPopupScope(root, anchor, kindValue.kind),
      preview_image: previewImage,
      image_override: importedImageOverride,
      selection_href: importedSelectionHref,
      selection_image: importedSelectionImage,
      selection_image_alt: importedSelectionImageAlt,
      preview_alt: importedPreviewAlt,
      thumbnail_empty_class: thumbnailSettings.thumbnail_empty_class,
      thumbnail_override: thumbnailSettings.thumbnail_override,
      thumbnail_position: thumbnailSettings.thumbnail_position,
      thumbnail_ratio: thumbnailSettings.thumbnail_ratio,
      thumbnail_fit: thumbnailSettings.thumbnail_fit,
      thumbnail_size: thumbnailSettings.thumbnail_size,
      selection_summary: summary,
      show_icon: Boolean(root.querySelector(".smartlink-icon")),
      show_image: Boolean(root.querySelector(".smartlink-thumb, span.smartlink-image")),
      show_text: text !== "",
      display_inside: detectDisplayInside(root, action),
      click_individual_parts: partLinks.length > 0,
      click_icon: Boolean(root.querySelector(".smartlink-part--icon")),
      click_text: Boolean(root.querySelector(".smartlink-part--text")),
      click_image: Boolean(root.querySelector(".smartlink-part--image")),
      click_view: Boolean(root.querySelector(".smartlink-part--view")),
      structure: detectStructure(root),
      view_position: detectViewPosition(root),
      show_summary: Boolean(root.querySelector(".smartlink-summary")),
      show_type_label: Boolean(root.querySelector(".smartlink-type")),
      figure_caption_text: Boolean(root.querySelector("figcaption"))
    };

    return { root, payload };
  }

  installEditorStyleBootstrap();

  JoomlaEditorButton.registerAction("supersoft-smartlink", (editor, options = {}) => {
    const activeEditor = editor || null;
    const selection = getSelection(activeEditor).trim();
    const config = {
      ...(options.config || {}),
      anchor_suggestions: collectAnchorSuggestions(activeEditor, options.config?.anchor_suggestions || []),
      preview_context: previewContext(activeEditor)
    };
    ensureEditorRuntimeStyles(activeEditor, config);
    const builder = window.SuperSoftSmartLinkBuilder;
    const editContext = builder ? parseExistingLink(activeEditor, config) : null;
    const action = builder
      ? builder.openDialog({
        config,
        payload: editContext?.payload || options.payload || {}
      })
      : Promise.resolve(fallbackResult(selection));

    action.then((result) => {
      if (!result) {
        return;
      }

      if (editContext?.root) {
        replaceMarkup(activeEditor, editContext, result.markup);
        return;
      }

      const canWrap = !result.payload.display_inside && selection !== "";
      const markup = canWrap
        ? (builder ? builder.buildMarkup(config, result.payload, selection) : result.markup)
        : result.markup;

      insertMarkup(activeEditor, markup);
    });
  });
})();
