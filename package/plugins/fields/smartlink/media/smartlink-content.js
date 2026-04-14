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
      ".smartlink-view img[data-src]"
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

  function install(root = document) {
    scheduleHydration(root);
    watchDeferredMedia(root);

    root.addEventListener("click", (event) => {
      const target = event.target;

      if (!isElement(target)) {
        return;
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
