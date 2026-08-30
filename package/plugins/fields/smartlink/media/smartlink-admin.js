(() => {
  const FEATURE_COLUMNS = [
    ["behavior", "download", "show_thumbnail", "show_icon", "show_text", "view_on_page", "label", "attributes", "structure"],
    ["preview", "image_override", "thumbnail", "gallery", "video", "linked_parts"]
  ];

  function radioGroup(name) {
    return Array.from(document.querySelectorAll('input[type="radio"]'))
      .filter((input) => input.name === name);
  }

  function fieldRow(input) {
    return input?.closest(".control-group, .mb-3") || null;
  }

  function updateVisibility(profileInputs, block) {
    const selected = profileInputs.find((input) => input.checked)?.value || "all";
    block.hidden = selected !== "custom";
  }

  function initialiseProfile(profileInput) {
    const profileName = profileInput.name;
    const fieldNamePrefix = profileName.replace(/\[authoring_profile\]$/, "");

    if (fieldNamePrefix === profileName) {
      return;
    }

    const profileInputs = radioGroup(profileName);
    const profileRow = fieldRow(profileInput);

    if (!profileInputs.length || !profileRow) {
      return;
    }

    if (profileRow._smartlinkPresentationBlock) {
      updateVisibility(profileInputs, profileRow._smartlinkPresentationBlock);
      return;
    }

    const featureRows = FEATURE_COLUMNS.map((features) => features.map((feature) => {
      const inputs = radioGroup(`${fieldNamePrefix}[author_feature_${feature}]`);
      return inputs.length ? fieldRow(inputs[0]) : null;
    }));

    if (!featureRows.some((column) => column.some(Boolean))) {
      return;
    }

    const block = document.createElement("div");
    block.className = "smartlink-presentation-custom";
    block.setAttribute("role", "group");

    const columns = document.createElement("div");
    columns.className = "smartlink-presentation-custom__columns";

    featureRows.forEach((rows) => {
      const column = document.createElement("div");
      column.className = "smartlink-presentation-custom__column";

      rows.filter(Boolean).forEach((row) => {
        row.classList.add("smartlink-presentation-control-row");
        column.appendChild(row);
      });

      columns.appendChild(column);
    });

    block.appendChild(columns);
    profileRow.insertAdjacentElement("afterend", block);
    profileRow._smartlinkPresentationBlock = block;

    profileInputs.forEach((input) => {
      if (input.dataset.smartlinkPresentationBound === "1") {
        return;
      }

      input.dataset.smartlinkPresentationBound = "1";
      input.addEventListener("change", () => updateVisibility(profileInputs, block));
    });

    updateVisibility(profileInputs, block);
  }

  function initialise() {
    const profileInputs = Array.from(document.querySelectorAll('input[type="radio"]'))
      .filter((input) => input.name.endsWith("[authoring_profile]"));
    const seen = new Set();

    profileInputs.forEach((input) => {
      if (seen.has(input.name)) {
        return;
      }

      seen.add(input.name);
      initialiseProfile(input);
    });
  }

  let queued = false;
  const scheduleInitialise = () => {
    if (queued) {
      return;
    }

    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      initialise();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleInitialise, { once: true });
  } else {
    scheduleInitialise();
  }

  new MutationObserver(scheduleInitialise).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
