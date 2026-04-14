(() => {
  const DEFAULT_UI_STRINGS = {
    kind_article: "Article",
    kind_category: "Category",
    kind_tags: "Tags",
    kind_contact: "Contact",
    kind_menu_item: "Menu Item",
    kind_media_file: "Media File",
    kind_image: "Image",
    kind_video: "Video",
    kind_gallery: "Gallery",
    picker_dialog_title_default: "Joomla Picker",
    picker_selected_items: "Selected items",
    picker_add_selected: "Add selected",
    picker_close: "Close",
    picker_paste_selected_value: "Paste the selected value",
    picker_one_item_per_line: "One item per line: type|src|label|poster",
    picker_cancel: "Cancel",
    picker_apply: "Apply",
    picker_no_items_selected: "No items selected yet.",
    picker_no_tags_selected: "No tags selected yet.",
    picker_remove: "Remove {label}",
    generic_item: "Item",
    gallery_fallback_video: "Video"
  };

  function ui(strings, key, fallback = "") {
    return String(strings?.[key] ?? DEFAULT_UI_STRINGS[key] ?? fallback ?? key);
  }

  function uiFormat(strings, key, replacements = {}, fallback = "") {
    let text = ui(strings, key, fallback);

    Object.entries(replacements || {}).forEach(([token, value]) => {
      text = text.replace(new RegExp(`\\{${String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\}`, "g"), String(value ?? ""));
    });

    return text;
  }

  const contentRoutes = {
    com_content_article: "index.php?option=com_content&view=articles&layout=modal&tmpl=component",
    com_content_category: "index.php?option=com_categories&extension=com_content&view=categories&layout=modal&tmpl=component",
    com_tags_tag: "index.php?option=com_tags&view=tags&layout=modal&tmpl=component",
    com_contact_contact: "index.php?option=com_contact&view=contacts&layout=modal&tmpl=component",
    menu_item: "index.php?option=com_menus&view=items&layout=modal&tmpl=component"
  };

  function isMediaKind(kind) {
    return ["media_file", "image", "video", "gallery"].includes(kind);
  }

  function mediaTypes(kind) {
    switch (kind) {
      case "image":
        return "0";
      case "video":
        return "2";
      case "gallery":
        return "0,2";
      default:
        return "0,1,2,3";
    }
  }

  function routeFor(kind) {
    if (isMediaKind(kind)) {
      return `index.php?option=com_media&view=media&tmpl=component&mediatypes=${encodeURIComponent(mediaTypes(kind))}&asset=com_content&author=0&path=`;
    }

    return contentRoutes[kind] || "";
  }

  function pickerTitle(kind, strings) {
    switch (kind) {
      case "com_content_article":
        return ui(strings, "kind_article");
      case "com_content_category":
        return ui(strings, "kind_category");
      case "com_tags_tag":
        return ui(strings, "kind_tags");
      case "com_contact_contact":
        return ui(strings, "kind_contact");
      case "menu_item":
        return ui(strings, "kind_menu_item");
      case "media_file":
        return ui(strings, "kind_media_file");
      case "image":
        return ui(strings, "kind_image");
      case "video":
        return ui(strings, "kind_video");
      case "gallery":
        return ui(strings, "kind_gallery");
      default:
        return ui(strings, "picker_dialog_title_default");
    }
  }

  function pickerIconClass(kind) {
    switch (kind) {
      case "com_content_article":
        return "fa-solid fa-plus";
      case "com_content_category":
        return "fa-regular fa-folder-open";
      case "com_tags_tag":
        return "fa-solid fa-tag";
      case "com_contact_contact":
        return "fa-solid fa-address-book";
      case "menu_item":
        return "fa-solid fa-bars";
      case "media_file":
        return "fa-regular fa-file-lines";
      case "image":
        return "fa-regular fa-image";
      case "video":
        return "fa-solid fa-video";
      case "gallery":
        return "fa-regular fa-images";
      default:
        return "fa-solid fa-list";
    }
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function siteBasePath() {
    const baseUri = String(document.baseURI || window.location.href || "");

    try {
      const url = new URL(baseUri, window.location.origin);
      return url.pathname.replace(/\/administrator\/.*$/i, "/");
    } catch (error) {
      return "/";
    }
  }

  function siteAbsoluteUrl(value) {
    const raw = String(value || "").trim();

    if (!raw) {
      return "";
    }

    if (/^(?:https?:|data:|blob:)/i.test(raw)) {
      return raw;
    }

    try {
      if (raw.startsWith("/")) {
        return new URL(raw, window.location.origin).toString();
      }

      return new URL(raw, new URL(siteBasePath(), window.location.origin)).toString();
    } catch (error) {
      return raw;
    }
  }

  function cloneGalleryItems(value) {
    if (!Array.isArray(value)) {
      return parseGallery(value);
    }

    return value
      .filter((item) => item && item.src)
      .map((item) => ({
        type: item.type || "image",
        src: normaliseJoomlaMediaValue(item.src || ""),
        label: item.label || "",
        poster: normaliseJoomlaMediaValue(item.poster || "")
      }));
  }

  function parseTagIds(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }

    return String(value || "")
      .split(/[,\r\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function cloneTagItems(value, items = []) {
    const provided = Array.isArray(items)
      ? items
        .filter((item) => item && item.id)
        .map((item) => ({
          id: String(item.id || "").trim(),
          label: String(item.label || "").trim()
        }))
        .filter((item) => item.id)
      : [];

    if (provided.length) {
      return provided;
    }

    return parseTagIds(value).map((id) => ({
      id,
      label: `Tag #${id}`
    }));
  }

  function renderGallerySelectionCard(strings, item, index) {
    const label = item.label || basename(item.src || "") || ui(strings, "generic_item");
    const previewMarkup = item.type === "video"
      ? (item.poster
        ? `<img src="${esc(siteAbsoluteUrl(item.poster))}" alt="${esc(label)}" loading="lazy">`
        : `<span class="smartlink-picker-dialog__selection-fallback fa-solid fa-video" aria-hidden="true">&#8203;</span>`)
      : `<img src="${esc(siteAbsoluteUrl(item.src))}" alt="${esc(label)}" loading="lazy">`;

    return `
      <article class="smartlink-picker-dialog__selection-card" data-index="${index}">
        <button
          type="button"
          class="smartlink-picker-dialog__selection-remove js-smartlink-selection-remove"
          data-index="${index}"
          aria-label="${esc(uiFormat(strings, "picker_remove", { label }))}"
          title="${esc(uiFormat(strings, "picker_remove", { label }))}"
        >&times;</button>
        <div class="smartlink-picker-dialog__selection-preview">
          ${previewMarkup}
        </div>
        <div class="smartlink-picker-dialog__selection-name">${esc(label)}</div>
      </article>`;
  }

  function renderTagSelectionCard(strings, item, index) {
    const id = String(item.id || "").trim();
    const label = item.label || (id ? `Tag #${id}` : ui(strings, "kind_tags"));

    return `
      <article class="smartlink-picker-dialog__selection-card smartlink-picker-dialog__selection-card--tag" data-index="${index}">
        <div class="smartlink-picker-dialog__selection-preview smartlink-picker-dialog__selection-preview--tag">
          <span class="smartlink-picker-dialog__selection-fallback fa-solid fa-tag" aria-hidden="true">&#8203;</span>
        </div>
        <div class="smartlink-picker-dialog__selection-name">${esc(label)}</div>
        <button
          type="button"
          class="smartlink-picker-dialog__selection-remove js-smartlink-selection-remove"
          data-index="${index}"
          aria-label="${esc(uiFormat(strings, "picker_remove", { label }))}"
          title="${esc(uiFormat(strings, "picker_remove", { label }))}"
        >&times;</button>
      </article>`;
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

  function mediaPathToRelative(path) {
    const match = String(path || "").match(/^local-([^:]+):\/?(.*)$/);

    if (!match) {
      return "";
    }

    const root = match[1] || "";
    const rest = match[2] || "";

    return rest ? `${root}/${rest}` : root;
  }

  function normaliseMediaSelection(kind, selected) {
    if (!selected || typeof selected !== "object") {
      return null;
    }

    const rawType = String(
      selected.type
      || selected.itemType
      || selected.fileType
      || selected.mime_type
      || selected.mime
      || ""
    ).toLowerCase();
    const hasFileSignals = Boolean(
      selected.url
      || selected.thumb
      || selected.fileType
      || selected.mime_type
      || selected.mime
      || selected.extension
    );

    if (/(^|[^a-z])(dir|folder|directory)([^a-z]|$)/.test(rawType) || !hasFileSignals) {
      return null;
    }

    const relative = mediaPathToRelative(selected.path || "");

    if (!relative) {
      return null;
    }

    const label = basename(relative);
    const isImageSelection = /(^|[^a-z])image([^a-z]|$)/.test(rawType)
      || /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(relative);
    const image = isImageSelection ? relative : "";

    if (kind === "gallery") {
      return {
        value: [{
          type: String(selected.fileType || "").includes("video") ? "video" : "image",
          src: relative,
          label,
          poster: ""
        }],
        label: ""
      };
    }

    return {
      value: relative,
      label,
      image,
      image_alt: label
    };
  }

  function normaliseContentSelection(kind, data) {
    const id = String(data.id || "").trim();
    const title = String(data.title || data.name || data.label || "").trim();
    const summary = String(data.summary || data.description || data.introtext || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const image = normaliseJoomlaMediaValue(data.image || data.image_intro || data.thumb_image || "");
    const imageAlt = String(data.image_alt || data.image_intro_alt || title).trim();

    switch (kind) {
      case "com_content_article":
      case "com_content_category":
      case "com_contact_contact":
      case "menu_item":
        if (!id) {
          return null;
        }

        return {
          value: id,
          label: title,
          summary,
          image,
          image_alt: imageAlt
        };
      case "com_tags_tag":
        if (!id) {
          return null;
        }

        return {
          value: [id],
          label: title,
          summary,
          image,
          image_alt: imageAlt
        };
      default:
        return null;
    }
  }

  function frameDatasetSelection(kind, target) {
    if (!target || target.nodeType !== 1 || typeof target.closest !== "function") {
      return null;
    }

    const selectable = target.closest("[data-content-select]");

    if (selectable) {
      return normaliseContentSelection(kind, { ...selectable.dataset });
    }

    if (kind !== "com_tags_tag") {
      return null;
    }

    const anchor = target.closest("a[href]");

    if (!anchor) {
      return null;
    }

    const row = anchor.closest("tr");

    if (!row) {
      return null;
    }

    const checkbox = row.querySelector('input[type="checkbox"][value], input[name*="cid"][value]');

    if (!checkbox) {
      return null;
    }

    const titleNode = row.querySelector("td:nth-child(2) a, td a, .title a, .title");
    const id = String(checkbox.value || "").trim();
    const title = String(titleNode?.textContent || anchor.textContent || "").replace(/\s+/g, " ").trim();

    return normaliseContentSelection(kind, { id, title });
  }

  function serialiseGallery(value) {
    if (!Array.isArray(value)) {
      return "";
    }

    return value
      .map((item) => [item.type || "image", item.src || "", item.label || "", item.poster || ""].join("|"))
      .join("\n");
  }

  function parseGallery(raw) {
    return String(raw || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|");
        return {
          type: parts[0] || "image",
          src: parts[1] || "",
          label: parts[2] || "",
          poster: parts[3] || ""
        };
      })
      .filter((item) => item.src);
  }

  function parse(kind, raw) {
    return kind === "gallery" ? parseGallery(raw) : String(raw || "").trim();
  }

  function open(kind, options = {}) {
    const route = routeFor(kind);
    const galleryItems = kind === "gallery" ? cloneGalleryItems(options.currentValue) : [];
    const tagItems = kind === "com_tags_tag" ? cloneTagItems(options.currentValue, options.currentItems) : [];
    const strings = options?.ui_strings && typeof options.ui_strings === "object" ? options.ui_strings : {};
    const seed = kind === "gallery" ? serialiseGallery(galleryItems) : String(options.currentValue || "");
    const supportsManualEntry = kind === "gallery" || !route;
    const isTagsMultiSelectPicker = kind === "com_tags_tag" && Boolean(route);
    const isSingleSelectContentPicker = !supportsManualEntry && !isMediaKind(kind) && !isTagsMultiSelectPicker;
    const isGalleryMultiSelectPicker = kind === "gallery" && Boolean(route);
    const isMultiSelectPicker = isGalleryMultiSelectPicker || isTagsMultiSelectPicker;

    if (!window.HTMLDialogElement) {
      const answer = window.prompt(
        route
          ? `${ui(strings, "picker_dialog_title_default")}:\n\n${route}\n\n${ui(strings, "picker_paste_selected_value")}.`
          : `${ui(strings, "picker_paste_selected_value")}.`,
        seed
      );

      return Promise.resolve(answer === null ? null : parse(kind, answer));
    }

    return new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      let lastMediaSelection = null;
      let frameDocument = null;

      dialog.className = "smartlink-picker-dialog";
      dialog.innerHTML = `
        <div class="smartlink-picker-dialog__shell${isSingleSelectContentPicker ? " smartlink-picker-dialog__shell--content-select" : ""}${isMultiSelectPicker ? " smartlink-picker-dialog__shell--gallery" : ""}">
          <div class="smartlink-picker-dialog__header">
            <strong class="smartlink-picker-dialog__title">
              <span class="smartlink-picker-dialog__title-icon ${pickerIconClass(kind)}" aria-hidden="true">&#8203;</span>
              <span>${esc(pickerTitle(kind, strings))}</span>
            </strong>
            <div class="smartlink-picker-dialog__header-actions">
              ${isMultiSelectPicker ? `<button type="button" class="btn btn-success js-smartlink-apply"${(isGalleryMultiSelectPicker ? galleryItems.length : tagItems.length) ? "" : " disabled"}>${esc(ui(strings, "picker_add_selected"))}</button>` : ""}
              <button type="button" class="btn-close js-smartlink-close" aria-label="${esc(ui(strings, "picker_close"))}"></button>
            </div>
          </div>
          <div class="smartlink-picker-dialog__body${isMultiSelectPicker ? " smartlink-picker-dialog__body--gallery" : ""}">
            ${route ? `<iframe class="smartlink-picker-dialog__frame" src="${route}" loading="lazy"></iframe>` : ""}
            ${isMultiSelectPicker ? `
              <section class="smartlink-picker-dialog__selection">
                <div class="smartlink-picker-dialog__selection-heading">${esc(ui(strings, "picker_selected_items"))}</div>
                <div class="smartlink-picker-dialog__selection-list js-smartlink-selection-list"></div>
              </section>` : supportsManualEntry ? `<label class="smartlink-builder__field smartlink-picker-dialog__value">
              <span>${esc(kind === "gallery" ? ui(strings, "picker_one_item_per_line") : ui(strings, "picker_paste_selected_value"))}</span>
              ${kind === "gallery"
                ? `<textarea class="form-control js-smartlink-value" rows="6">${seed}</textarea>`
                : `<input class="form-control js-smartlink-value" type="text" value="${seed.replace(/"/g, "&quot;")}">`}
            </label>` : ""}
          </div>
          ${supportsManualEntry && !isMultiSelectPicker ? `<div class="smartlink-picker-dialog__footer">
            <button type="button" class="btn btn-secondary js-smartlink-cancel">${esc(ui(strings, "picker_cancel"))}</button>
            <button type="button" class="btn btn-primary js-smartlink-apply">${esc(kind === "gallery" && route ? ui(strings, "picker_add_selected") : ui(strings, "picker_apply"))}</button>
          </div>` : ""}
        </div>
      `;

      const valueField = dialog.querySelector(".js-smartlink-value");
      const frame = dialog.querySelector(".smartlink-picker-dialog__frame");
      const selectionList = dialog.querySelector(".js-smartlink-selection-list");
      const applyButton = dialog.querySelector(".js-smartlink-apply");

      const removeHandlers = () => {
        window.removeEventListener("message", onMessage);
        document.removeEventListener("onMediaFileSelected", onMediaSelected);
        if (frame) {
          frame.removeEventListener("load", onFrameLoad);
        }
        if (frameDocument) {
          frameDocument.removeEventListener("click", onFrameClick, true);
          frameDocument = null;
        }
      };

      const close = (result) => {
        removeHandlers();
        dialog.close();
        dialog.remove();
        resolve(result);
      };

      const renderGallerySelection = () => {
        if (!selectionList) {
          return;
        }

        selectionList.classList.toggle("smartlink-picker-dialog__selection-list--tags", false);
        selectionList.innerHTML = galleryItems.length
          ? galleryItems.map((item, index) => renderGallerySelectionCard(strings, item, index)).join("")
          : `<div class="smartlink-picker-dialog__selection-empty">${esc(ui(strings, "picker_no_items_selected"))}</div>`;

        if (applyButton) {
          applyButton.disabled = !galleryItems.length;
        }
      };

      const renderTagSelection = () => {
        if (!selectionList) {
          return;
        }

        selectionList.classList.toggle("smartlink-picker-dialog__selection-list--tags", true);
        selectionList.innerHTML = tagItems.length
          ? tagItems.map((item, index) => renderTagSelectionCard(strings, item, index)).join("")
          : `<div class="smartlink-picker-dialog__selection-empty">${esc(ui(strings, "picker_no_tags_selected"))}</div>`;

        if (applyButton) {
          applyButton.disabled = !tagItems.length;
        }
      };

      const appendGallerySelection = (selection) => {
        if (!selection || !Array.isArray(selection.value) || !selection.value.length) {
          return;
        }

        const merged = galleryItems.slice();

        selection.value.forEach((item) => {
          const normalised = {
            type: item.type || "image",
            src: normaliseJoomlaMediaValue(item.src || ""),
            label: item.label || basename(item.src || ""),
            poster: normaliseJoomlaMediaValue(item.poster || "")
          };

          if (normalised.src && !merged.some((current) => current.src === normalised.src && current.type === normalised.type)) {
            merged.push(normalised);
          }
        });

        galleryItems.splice(0, galleryItems.length, ...merged);

        if (valueField) {
          valueField.value = serialiseGallery(galleryItems);
        }

        renderGallerySelection();
      };

      const appendTagSelection = (selection) => {
        if (!selection || !Array.isArray(selection.value) || !selection.value.length) {
          return;
        }

        selection.value.forEach((id) => {
          const key = String(id || "").trim();

          if (!key) {
            return;
          }

          if (!tagItems.some((item) => item.id === key)) {
            tagItems.push({
              id: key,
              label: selection.label || `Tag #${key}`
            });
          }
        });

        renderTagSelection();
      };

      const readMediaSelection = () => {
        const globalSelection = window.Joomla?.selectedMediaFile || null;

        if (globalSelection && (globalSelection.path || globalSelection.url)) {
          lastMediaSelection = globalSelection;
        }

        if (!frame || !frame.contentWindow) {
          return lastMediaSelection;
        }

        try {
          const selected = frame.contentWindow.Joomla?.selectedMediaFile || null;

          if (selected && (selected.path || selected.url)) {
            lastMediaSelection = selected;
          }
        } catch (error) {
        }

        return lastMediaSelection;
      };

      const applySelection = () => {
        if (isMediaKind(kind)) {
          const selected = normaliseMediaSelection(kind, readMediaSelection());

          if (selected && kind !== "gallery") {
            close(selected);
            return;
          }
        }

        if (kind === "gallery") {
          close({
            value: galleryItems.slice(),
            label: ""
          });
          return;
        }

        if (kind === "com_tags_tag") {
          const labels = tagItems.map((item) => item.label).filter(Boolean);
          close({
            value: tagItems.map((item) => item.id),
            label: labels.join(", "),
            items: tagItems.map((item) => ({ id: item.id, label: item.label }))
          });
          return;
        }

        const value = parse(kind, valueField?.value || "");

        if (value === "") {
          return;
        }

        close({
          value,
          label: ""
        });
      };

      const onMessage = (event) => {
        if (!frame || event.source !== frame.contentWindow) {
          return;
        }

        const data = event.data;

        if (!data || data.messageType !== "joomla:content-select") {
          return;
        }

        const selection = normaliseContentSelection(kind, data);

        if (!selection) {
          return;
        }

        if (valueField) {
          valueField.value = String(selection.value || "");
        }

        if (kind === "com_tags_tag") {
          appendTagSelection(selection);
          return;
        }

        close(selection);
      };

      const onFrameClick = (event) => {
        const selection = frameDatasetSelection(kind, event.target);

        if (!selection) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (valueField) {
          valueField.value = Array.isArray(selection.value) ? selection.value.join(",") : String(selection.value || "");
        }

        if (kind === "com_tags_tag") {
          appendTagSelection(selection);
          return;
        }

        close(selection);
      };

      const onFrameLoad = () => {
        if (!frame || isMediaKind(kind) || kind === "gallery") {
          return;
        }

        try {
          const nextDocument = frame.contentDocument || frame.contentWindow?.document || null;

          if (!nextDocument || nextDocument === frameDocument) {
            return;
          }

          if (frameDocument) {
            frameDocument.removeEventListener("click", onFrameClick, true);
          }

          frameDocument = nextDocument;
          frameDocument.addEventListener("click", onFrameClick, true);
        } catch (error) {
        }
      };

      window.addEventListener("message", onMessage);
      if (frame) {
        frame.addEventListener("load", onFrameLoad);
      }

      const onMediaSelected = (event) => {
        if (!isMediaKind(kind)) {
          return;
        }

        lastMediaSelection = event.detail || readMediaSelection();
        const selection = normaliseMediaSelection(kind, lastMediaSelection);

        if (!selection) {
          return;
        }

        if (kind === "gallery") {
          appendGallerySelection(selection);
          return;
        }

        if (valueField) {
          valueField.value = String(selection.value || "");
        }

        close(selection);
      };

      document.addEventListener("onMediaFileSelected", onMediaSelected);

      dialog.addEventListener("click", (event) => {
        const removeButton = event.target.closest(".js-smartlink-selection-remove");

        if (!removeButton) {
          return;
        }

        const index = Number(removeButton.dataset.index);

        const currentLength = kind === "com_tags_tag" ? tagItems.length : galleryItems.length;

        if (!Number.isInteger(index) || index < 0 || index >= currentLength) {
          return;
        }

        if (kind === "com_tags_tag") {
          tagItems.splice(index, 1);
          renderTagSelection();
          return;
        }

        galleryItems.splice(index, 1);

        if (valueField) {
          valueField.value = serialiseGallery(galleryItems);
        }

        renderGallerySelection();
      });

      dialog.querySelector(".js-smartlink-close").addEventListener("click", () => close(null));
      const cancelButton = dialog.querySelector(".js-smartlink-cancel");

      if (cancelButton) {
        cancelButton.addEventListener("click", () => close(null));
      }

      if (applyButton) {
        applyButton.addEventListener("click", applySelection);
      }

      document.body.appendChild(dialog);

      if (isGalleryMultiSelectPicker) {
        renderGallerySelection();
      }

      if (isTagsMultiSelectPicker) {
        renderTagSelection();
      }

      dialog.showModal();
    });
  }

  window.SuperSoftSmartLinkPickers = {
    open
  };
})();
