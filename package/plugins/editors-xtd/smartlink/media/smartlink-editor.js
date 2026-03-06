import { JoomlaEditorButton } from "editor-api";

(() => {
  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
        preview_alt: "",
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

  JoomlaEditorButton.registerAction("supersoft-smartlink", (editor, options = {}) => {
      const activeEditor = editor || null;
      const selection = getSelection(activeEditor).trim();
      const config = {
        ...(options.config || {}),
        anchor_suggestions: collectAnchorSuggestions(activeEditor, options.config?.anchor_suggestions || [])
      };
      const builder = window.SuperSoftSmartLinkBuilder;
      const action = builder
        ? builder.openDialog({ config })
        : Promise.resolve(fallbackResult(selection));

      action.then((result) => {
        if (!result) {
          return;
        }

        const canWrap = result.payload.action !== "embed" && selection !== "";
        const markup = canWrap
          ? (builder ? builder.buildMarkup(config, result.payload, selection) : result.markup)
          : result.markup;

        insertMarkup(activeEditor, markup);
      });
    });
})();
