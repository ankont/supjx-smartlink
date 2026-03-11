(() => {
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

  function basename(value) {
    const parts = String(value || "").split(/[\\/]/);
    return parts[parts.length - 1] || "";
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

    const relative = mediaPathToRelative(selected.path || "");

    if (!relative) {
      return null;
    }

    const label = basename(relative);

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
      label
    };
  }

  function normaliseContentSelection(kind, data) {
    const id = String(data.id || "").trim();
    const title = String(data.title || data.name || data.label || "").trim();
    const summary = String(data.summary || data.description || data.introtext || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const image = String(data.image || data.image_intro || data.thumb_image || "").trim();
    const imageAlt = String(data.image_alt || data.image_intro_alt || title).trim();

    switch (kind) {
      case "com_content_article":
      case "com_content_category":
      case "com_tags_tag":
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
      default:
        return null;
    }
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
    const seed = kind === "gallery" ? serialiseGallery(options.currentValue) : String(options.currentValue || "");
    const supportsManualEntry = kind === "gallery" || !route;

    if (!window.HTMLDialogElement) {
      const answer = window.prompt(
        route
          ? `Use the Joomla core picker here:\n\n${route}\n\nPaste the selected value below.`
          : "Paste the selected value below.",
        seed
      );

      return Promise.resolve(answer === null ? null : parse(kind, answer));
    }

    return new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      let lastMediaSelection = null;

      dialog.className = "smartlink-picker-dialog";
      dialog.innerHTML = `
        <div class="smartlink-picker-dialog__shell">
          <div class="smartlink-picker-dialog__header">
            <strong>Joomla Picker</strong>
            <button type="button" class="btn-close js-smartlink-close" aria-label="Close"></button>
          </div>
          <div class="smartlink-picker-dialog__body">
            ${route ? `<iframe class="smartlink-picker-dialog__frame" src="${route}" loading="lazy"></iframe>` : ""}
            ${supportsManualEntry ? `<label class="smartlink-builder__field smartlink-picker-dialog__value">
              <span>${kind === "gallery" ? "One item per line: type|src|label|poster" : "Paste the selected value"}</span>
              ${kind === "gallery"
                ? `<textarea class="form-control js-smartlink-value" rows="6">${seed}</textarea>`
                : `<input class="form-control js-smartlink-value" type="text" value="${seed.replace(/"/g, "&quot;")}">`}
            </label>` : ""}
          </div>
          <div class="smartlink-picker-dialog__footer">
            <button type="button" class="btn btn-secondary js-smartlink-cancel">Cancel</button>
            ${supportsManualEntry ? `<button type="button" class="btn btn-primary js-smartlink-apply">${kind === "gallery" && route ? "Add selected" : "Apply"}</button>` : ""}
          </div>
        </div>
      `;

      const valueField = dialog.querySelector(".js-smartlink-value");
      const frame = dialog.querySelector(".smartlink-picker-dialog__frame");

      const removeHandlers = () => {
        window.removeEventListener("message", onMessage);
        document.removeEventListener("onMediaFileSelected", onMediaSelected);
      };

      const close = (result) => {
        removeHandlers();
        dialog.close();
        dialog.remove();
        resolve(result);
      };

      const appendGallerySelection = (selection) => {
        if (!selection || !Array.isArray(selection.value) || !selection.value.length || !valueField) {
          return;
        }

        const existing = parseGallery(valueField.value);
        const merged = existing.slice();

        selection.value.forEach((item) => {
          if (!merged.some((current) => current.src === item.src && current.type === item.type)) {
            merged.push(item);
          }
        });

        valueField.value = serialiseGallery(merged);
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

        const value = parse(kind, valueField?.value || "");

        if (kind === "gallery") {
          close({
            value,
            label: ""
          });
          return;
        }

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

        close(selection);
      };

      window.addEventListener("message", onMessage);

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
          if (!valueField) {
            return;
          }

          appendGallerySelection(selection);
          return;
        }

        if (valueField) {
          valueField.value = String(selection.value || "");
        }

        close(selection);
      };

      document.addEventListener("onMediaFileSelected", onMediaSelected);

      dialog.querySelector(".js-smartlink-close").addEventListener("click", () => close(null));
      dialog.querySelector(".js-smartlink-cancel").addEventListener("click", () => close(null));
      const applyButton = dialog.querySelector(".js-smartlink-apply");

      if (applyButton) {
        applyButton.addEventListener("click", applySelection);
      }

      document.body.appendChild(dialog);
      dialog.showModal();
    });
  }

  window.SuperSoftSmartLinkPickers = {
    open
  };
})();
