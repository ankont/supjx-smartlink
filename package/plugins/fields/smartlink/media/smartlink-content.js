(() => {
  if (window.SuperSoftSmartLinkContent) {
    return;
  }

  function isElement(value) {
    return Boolean(value) && value.nodeType === 1 && typeof value.closest === "function";
  }

  function syncToggleButtons(root, targetId, expanded) {
    if (!isElement(root) && root !== document) {
      return;
    }

    Array.from(root.querySelectorAll('[data-toggle-view="1"]'))
      .forEach((button) => {
        if (isElement(button) && String(button.getAttribute("aria-controls") || "").trim() === String(targetId || "").trim()) {
          button.setAttribute("aria-expanded", expanded ? "true" : "false");
        }
      });
  }

  function deferredMediaSelector() {
    return [
      ".smartlink-view[data-src]",
      ".smartlink-view iframe[data-src]",
      ".smartlink-view img[data-src]",
      ".smartlink-view video[data-src]"
    ].join(", ");
  }

  function dataAttribute(node, name) {
    return String(node?.getAttribute?.(`data-${name}`) || "").trim();
  }

  function deferredMediaNodes(root) {
    const scope = root?.body || root;

    if (!isElement(scope)) {
      return [];
    }

    const nodes = [];
    const selector = deferredMediaSelector();

    if (scope.matches(selector)) {
      nodes.push(scope);
    }

    scope.querySelectorAll(selector).forEach((node) => {
      if (isElement(node)) {
        nodes.push(node);
      }
    });

    return nodes;
  }

  function activateDeferredMedia(root) {
    const nodes = deferredMediaNodes(root);

    if (!nodes.length) {
      return;
    }

    nodes.forEach((node) => {
      const src = dataAttribute(node, "src");

      if (!src) {
        return;
      }

      if (node.matches(".smartlink-view[data-src]")) {
        const embed = dataAttribute(node, "embed") || "iframe";

        if (embed === "iframe") {
          let iframe = node.querySelector(":scope > iframe");

          if (!isElement(iframe)) {
            iframe = node.ownerDocument.createElement("iframe");
            node.appendChild(iframe);
          }

          if (!iframe.getAttribute("src")) {
            iframe.setAttribute("src", src);
          }

          if (dataAttribute(node, "allowfullscreen") === "1") {
            iframe.setAttribute("allowfullscreen", "");
          }
        }

        return;
      }

      if (!node.getAttribute("src")) {
        node.setAttribute("src", src);
      }
    });
  }

  function hydrateVisibleMedia(root = document) {
    deferredMediaNodes(root).forEach((node) => {
      if (node.hasAttribute("hidden") || node.closest("[hidden]")) {
        return;
      }

      activateDeferredMedia(node);
    });
  }

  function watchDeferredMedia(root = document) {
    if (root !== document || !window.MutationObserver) {
      return;
    }

    const scope = document.documentElement;

    if (!isElement(scope)) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!isElement(node)) {
            return;
          }

          if (node.matches(deferredMediaSelector()) || node.querySelector?.(deferredMediaSelector())) {
            hydrateVisibleMedia(node);
          }
        });
      });
    });

    observer.observe(scope, { childList: true, subtree: true });
  }

  function scheduleHydration(root = document) {
    const run = () => hydrateVisibleMedia(root);

    run();

    if (root !== document) {
      return;
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    }

    window.addEventListener("load", run, { once: true });

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(run);
    } else {
      window.setTimeout(run, 0);
    }
  }

  function toggleView(button) {
    if (!isElement(button)) {
      return;
    }

    const targetId = String(button.getAttribute("aria-controls") || "").trim();

    if (!targetId) {
      return;
    }

    const owner = button.ownerDocument || document;
    const target = owner.getElementById(targetId);

    if (!isElement(target)) {
      return;
    }

    const expanded = target.hasAttribute("hidden");

    if (expanded) {
      activateDeferredMedia(target);
      target.removeAttribute("hidden");
    } else {
      target.setAttribute("hidden", "hidden");
    }

    syncToggleButtons(owner, targetId, expanded);
  }

  function galleryItems(gallery) {
    try {
      const items = JSON.parse(String(gallery.getAttribute("data-gallery-items") || "[]"));
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }

  function providerEmbedUrl(src) {
    try {
      const url = new URL(src, window.location.href);
      const host = url.hostname.toLowerCase();

      if (host.includes("youtu.be")) {
        return `https://www.youtube.com/embed/${encodeURIComponent(url.pathname.replace(/^\//, ""))}`;
      }

      if (host.includes("youtube.com")) {
        const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop() || "";
        return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : "";
      }

      if (host.includes("vimeo.com")) {
        const id = url.pathname.split("/").filter(Boolean).pop() || "";
        return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : "";
      }
    } catch (error) {
    }

    return "";
  }

  function showGalleryItem(gallery, requestedIndex) {
    const items = galleryItems(gallery);
    const stage = gallery.querySelector("[data-gallery-stage]");

    if (!items.length || !isElement(stage)) {
      return;
    }

    const index = (Number(requestedIndex) + items.length) % items.length;
    const item = items[index] || {};
    const src = String(item.src || "").trim();
    const label = String(item.display_name || "").trim();
    let media;

    if (item.type === "video") {
      const embedUrl = String(item.media?.embed_url || "").trim() || providerEmbedUrl(src);

      if (embedUrl) {
        media = stage.ownerDocument.createElement("iframe");
        media.src = embedUrl;
        media.allowFullscreen = true;
        media.title = label || "Video";
      } else {
        media = stage.ownerDocument.createElement("video");
        media.src = src;
        media.controls = true;
        media.poster = String(item.poster || "");
        media.setAttribute("aria-label", label || "Video");
      }
    } else {
      media = stage.ownerDocument.createElement("img");
      media.src = src;
      media.alt = label;
      media.loading = "lazy";
    }

    stage.replaceChildren(media);
    gallery.setAttribute("data-gallery-current", String(index));
    gallery.querySelectorAll("[data-gallery-index]").forEach((button) => {
      button.classList.toggle("is-active", Number(button.getAttribute("data-gallery-index")) === index);
    });
  }

  function install(root = document) {
    scheduleHydration(root);
    watchDeferredMedia(root);

    root.addEventListener("click", (event) => {
      const target = event.target;

      if (!isElement(target)) {
        return;
      }

      const galleryControl = target.closest("[data-gallery-previous], [data-gallery-next], [data-gallery-index]");

      if (isElement(galleryControl)) {
        const gallery = galleryControl.closest("[data-smartlink-gallery='1']");

        if (isElement(gallery)) {
          event.preventDefault();
          const current = Number(gallery.getAttribute("data-gallery-current") || 0);
          const requested = galleryControl.hasAttribute("data-gallery-previous")
            ? current - 1
            : (galleryControl.hasAttribute("data-gallery-next") ? current + 1 : Number(galleryControl.getAttribute("data-gallery-index") || 0));
          showGalleryItem(gallery, requested);
          return;
        }
      }

      const button = target.closest('[data-toggle-view="1"]');

      if (!isElement(button)) {
        return;
      }

      event.preventDefault();
      toggleView(button);
    });
  }

  window.SuperSoftSmartLinkContent = { install, toggleView };
  install(document);
})();
