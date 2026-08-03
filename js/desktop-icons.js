const addShortcutButton = document.querySelector("#add-shortcut");
const shortcutDialog = document.querySelector("#shortcut-dialog");
const closeShortcutDialogButton = document.querySelector(
  "#close-shortcut-dialog"
);
const cancelShortcutButton = document.querySelector("#cancel-shortcut");
const shortcutForm = document.querySelector("#shortcut-form");
const shortcutNameInput = document.querySelector("#shortcut-name");
const shortcutUrlInput = document.querySelector("#shortcut-url");
const shortcutIconInput = document.querySelector("#shortcut-icon");
const shortcutIconPreview = document.querySelector("#shortcut-icon-preview");
const shortcutIconStatus = document.querySelector("#shortcut-icon-status");
const openProjectIconPickerButton = document.querySelector(
  "#open-project-icon-picker"
);
const projectIconPicker = document.querySelector("#project-icon-picker");
const useAutomaticIconButton = document.querySelector("#use-automatic-icon");
const submitShortcutButton = document.querySelector("#submit-shortcut");
const shortcutDialogTitle = document.querySelector("#shortcut-dialog-title");
const shortcutError = document.querySelector("#shortcut-error");
const desktopIconArea = document.querySelector(".icon-base");

const SHORTCUT_STORAGE_KEY = "desktopShortcuts";
const DEFAULT_SHORTCUT_ICON = "css/icon/msie1-2.png";
const SHORTCUT_ICON_SIZE = 35;
const MAX_ICON_FILE_SIZE = 2 * 1024 * 1024;
const SUPPORTED_ICON_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];
const PROJECT_SHORTCUT_ICONS = [
  { name: "Camera", src: "css/icon/camera-0.png" },
  { name: "Video Camera", src: "css/icon/camera3_vid-2.png" },
  { name: "My Computer", src: "css/icon/computer_explorer_cool-0.png" },
  { name: "Desktop", src: "css/icon/desktop-3.png" },
  { name: "Key", src: "css/icon/key_win_alt-2.png" },
  { name: "Agent File", src: "css/icon/msagent_file-1.png" },
  { name: "Agent", src: "css/icon/msagent-4.png" },
  { name: "Internet", src: "css/icon/msie1-2.png" },
  { name: "Internet Alternate", src: "css/icon/msie1-4.png" },
  { name: "Notepad", src: "css/icon/notepad-5.png" },
  { name: "Mail", src: "css/icon/outlook_express-2.png" },
  { name: "Mail Alternate", src: "css/icon/outlook_express-4.png" },
  { name: "Recycle Bin", src: "css/icon/recycle_bin_full-4.png" },
  { name: "Clock", src: "css/icon/time_and_date-0.png" },
  { name: "Windows", src: "css/icon/windows-0.png" },
];
const PROJECT_SHORTCUT_ICON_PATHS = new Set(
  PROJECT_SHORTCUT_ICONS.map((icon) => icon.src)
);

let desktopShortcuts = loadShortcuts();
let selectedShortcutIcon = DEFAULT_SHORTCUT_ICON;
let hasExplicitShortcutIcon = false;
let isSiteIconPreview = false;
let iconProcessingId = 0;
let editingShortcutId = null;

function loadShortcuts() {
  try {
    const storedShortcuts = JSON.parse(
      localStorage.getItem(SHORTCUT_STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(storedShortcuts)) {
      return [];
    }

    return storedShortcuts
      .filter(
        (shortcut) =>
          shortcut &&
          typeof shortcut.id === "string" &&
          typeof shortcut.name === "string" &&
          typeof shortcut.url === "string"
      )
      .map((shortcut) => {
        const usesSiteIcon =
          shortcut.iconMode === "automatic" ||
          isSiteFaviconUrl(shortcut.icon, shortcut.url);
        const hasValidIcon =
          typeof shortcut.icon === "string" &&
          (shortcut.icon.startsWith("data:image/png;base64,") ||
            PROJECT_SHORTCUT_ICON_PATHS.has(shortcut.icon) ||
            isSiteFaviconUrl(shortcut.icon, shortcut.url));

        return {
          ...shortcut,
          icon: hasValidIcon ? shortcut.icon : DEFAULT_SHORTCUT_ICON,
          iconMode: usesSiteIcon ? "automatic" : "custom",
        };
      });
  } catch (error) {
    return [];
  }
}

function saveShortcuts() {
  try {
    localStorage.setItem(
      SHORTCUT_STORAGE_KEY,
      JSON.stringify(desktopShortcuts)
    );
    return true;
  } catch (error) {
    showShortcutError("This browser could not save the shortcut.");
    return false;
  }
}

function createShortcutId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeShortcutUrl(value) {
  const trimmedValue = value.trim();
  const valueWithProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const url = new URL(valueWithProtocol);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.href;
  } catch (error) {
    return null;
  }
}

function createSiteFaviconUrl(shortcutUrl) {
  try {
    const parsedShortcutUrl = new URL(shortcutUrl);
    return new URL("/favicon.ico", parsedShortcutUrl.origin).href;
  } catch (error) {
    return DEFAULT_SHORTCUT_ICON;
  }
}

function isSiteFaviconUrl(iconUrl, shortcutUrl) {
  try {
    const parsedIconUrl = new URL(iconUrl);
    const parsedShortcutUrl = new URL(shortcutUrl);

    return (
      parsedIconUrl.origin === parsedShortcutUrl.origin &&
      parsedIconUrl.pathname === "/favicon.ico"
    );
  } catch (error) {
    return false;
  }
}

function showShortcutError(message) {
  shortcutError.innerText = message;
  shortcutError.classList.remove("hidden");
}

function clearShortcutError() {
  shortcutError.innerText = "";
  shortcutError.classList.add("hidden");
}

function updateProjectIconSelection() {
  useAutomaticIconButton.setAttribute(
    "aria-pressed",
    String(!hasExplicitShortcutIcon)
  );
  projectIconPicker
    .querySelectorAll(".project-icon-option")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(
          hasExplicitShortcutIcon &&
            button.dataset.iconSrc === selectedShortcutIcon
        )
      );
    });
}

function selectAutomaticShortcutIcon() {
  iconProcessingId += 1;
  hasExplicitShortcutIcon = false;
  isSiteIconPreview = false;
  selectedShortcutIcon = DEFAULT_SHORTCUT_ICON;
  shortcutIconInput.value = "";
  submitShortcutButton.disabled = false;
  clearShortcutError();
  closeProjectIconPicker();
  updateProjectIconSelection();
  updateAutomaticShortcutIconPreview();

  if (!normalizeShortcutUrl(shortcutUrlInput.value)) {
    shortcutIconStatus.innerText =
      "Enter a destination URL to preview its website icon.";
  }
}

function closeProjectIconPicker() {
  projectIconPicker.classList.add("hidden");
  openProjectIconPickerButton.setAttribute("aria-expanded", "false");
}

function toggleProjectIconPicker() {
  const shouldOpen = projectIconPicker.classList.contains("hidden");

  projectIconPicker.classList.toggle("hidden", !shouldOpen);
  openProjectIconPickerButton.setAttribute(
    "aria-expanded",
    String(shouldOpen)
  );

  if (shouldOpen) {
    updateProjectIconSelection();
  }
}

function selectProjectIcon(icon) {
  iconProcessingId += 1;
  hasExplicitShortcutIcon = true;
  isSiteIconPreview = false;
  selectedShortcutIcon = icon.src;
  shortcutIconInput.value = "";
  shortcutIconPreview.src = icon.src;
  shortcutIconStatus.innerText = `${icon.name} selected.`;
  submitShortcutButton.disabled = false;
  clearShortcutError();
  updateProjectIconSelection();
  closeProjectIconPicker();
  openProjectIconPickerButton.focus();
}

function renderProjectIconPicker() {
  projectIconPicker.innerHTML = "";

  PROJECT_SHORTCUT_ICONS.forEach((icon) => {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.className = "project-icon-option";
    button.type = "button";
    button.dataset.iconSrc = icon.src;
    button.title = icon.name;
    button.setAttribute("aria-label", `Use ${icon.name} icon`);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectProjectIcon(icon));

    image.src = icon.src;
    image.alt = "";
    button.appendChild(image);
    projectIconPicker.appendChild(button);
  });

  updateProjectIconSelection();
}

function resetShortcutIcon() {
  iconProcessingId += 1;
  hasExplicitShortcutIcon = false;
  isSiteIconPreview = false;
  selectedShortcutIcon = DEFAULT_SHORTCUT_ICON;
  shortcutIconPreview.src = DEFAULT_SHORTCUT_ICON;
  shortcutIconStatus.innerText = "";
  submitShortcutButton.disabled = false;
  updateProjectIconSelection();
  closeProjectIconPicker();
}

function loadShortcutIconForEditing(shortcut) {
  iconProcessingId += 1;
  shortcutIconInput.value = "";
  closeProjectIconPicker();

  if (
    shortcut.iconMode === "automatic" ||
    isSiteFaviconUrl(shortcut.icon, shortcut.url)
  ) {
    hasExplicitShortcutIcon = false;
    selectedShortcutIcon = DEFAULT_SHORTCUT_ICON;
    updateAutomaticShortcutIconPreview();
  } else {
    hasExplicitShortcutIcon = true;
    isSiteIconPreview = false;
    selectedShortcutIcon = shortcut.icon || DEFAULT_SHORTCUT_ICON;
    shortcutIconPreview.src = selectedShortcutIcon;
    shortcutIconStatus.innerText = selectedShortcutIcon.startsWith("data:")
      ? "Uploaded icon selected."
      : "Project icon selected.";
  }

  submitShortcutButton.disabled = false;
  updateProjectIconSelection();
}

function updateAutomaticShortcutIconPreview() {
  if (hasExplicitShortcutIcon) {
    return;
  }

  const shortcutUrl = normalizeShortcutUrl(shortcutUrlInput.value);

  if (!shortcutUrl) {
    isSiteIconPreview = false;
    shortcutIconPreview.src = DEFAULT_SHORTCUT_ICON;
    shortcutIconStatus.innerText = "";
    return;
  }

  isSiteIconPreview = true;
  shortcutIconPreview.src = createSiteFaviconUrl(shortcutUrl);
  shortcutIconStatus.innerText = "Using the website icon when available.";
}

function onShortcutIconPreviewError() {
  if (!isSiteIconPreview) {
    return;
  }

  isSiteIconPreview = false;
  shortcutIconPreview.src = DEFAULT_SHORTCUT_ICON;
  shortcutIconStatus.innerText =
    "Website icon unavailable. The default icon will be used.";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("read-failed")));
    reader.readAsDataURL(file);
  });
}

function loadLocalImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("image-failed")));
    image.src = source;
  });
}

async function resizeShortcutIcon(file) {
  const source = await readFileAsDataUrl(file);
  const image = await loadLocalImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const scale = Math.min(
    SHORTCUT_ICON_SIZE / image.naturalWidth,
    SHORTCUT_ICON_SIZE / image.naturalHeight
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const x = Math.round((SHORTCUT_ICON_SIZE - width) / 2);
  const y = Math.round((SHORTCUT_ICON_SIZE - height) / 2);

  canvas.width = SHORTCUT_ICON_SIZE;
  canvas.height = SHORTCUT_ICON_SIZE;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, SHORTCUT_ICON_SIZE, SHORTCUT_ICON_SIZE);
  context.drawImage(image, x, y, width, height);

  return canvas.toDataURL("image/png");
}

async function onShortcutIconChange() {
  const file = shortcutIconInput.files[0];
  const processingId = ++iconProcessingId;

  clearShortcutError();
  closeProjectIconPicker();
  hasExplicitShortcutIcon = false;
  isSiteIconPreview = false;
  selectedShortcutIcon = DEFAULT_SHORTCUT_ICON;
  shortcutIconPreview.src = DEFAULT_SHORTCUT_ICON;
  shortcutIconStatus.innerText = "";
  updateProjectIconSelection();

  if (!file) {
    updateAutomaticShortcutIconPreview();
    return;
  }

  if (!SUPPORTED_ICON_TYPES.includes(file.type)) {
    shortcutIconInput.value = "";
    updateAutomaticShortcutIconPreview();
    showShortcutError("Choose a PNG, JPG, WebP, or GIF image.");
    return;
  }

  if (file.size > MAX_ICON_FILE_SIZE) {
    shortcutIconInput.value = "";
    updateAutomaticShortcutIconPreview();
    showShortcutError("Choose an image smaller than 2 MB.");
    return;
  }

  submitShortcutButton.disabled = true;
  shortcutIconStatus.innerText = "Preparing 35 × 35 px icon...";

  try {
    const resizedIcon = await resizeShortcutIcon(file);

    if (processingId !== iconProcessingId) {
      return;
    }

    hasExplicitShortcutIcon = true;
    isSiteIconPreview = false;
    selectedShortcutIcon = resizedIcon;
    shortcutIconPreview.src = resizedIcon;
    shortcutIconStatus.innerText = "Custom icon ready.";
    updateProjectIconSelection();
  } catch (error) {
    if (processingId === iconProcessingId) {
      shortcutIconInput.value = "";
      updateAutomaticShortcutIconPreview();
      showShortcutError("The selected image could not be loaded.");
      shortcutIconStatus.innerText = "";
    }
  } finally {
    if (processingId === iconProcessingId) {
      submitShortcutButton.disabled = false;
    }
  }
}

function showShortcutDialog() {
  clearShortcutError();
  shortcutDialog.classList.remove("hidden");
  shortcutNameInput.focus();
}

function openShortcutDialog() {
  editingShortcutId = null;
  shortcutForm.reset();
  resetShortcutIcon();
  shortcutDialogTitle.innerText = "Add Desktop Shortcut";
  submitShortcutButton.innerText = "Add";
  addShortcutButton.setAttribute("aria-expanded", "true");
  showShortcutDialog();
}

function openShortcutEditor(shortcutId) {
  const shortcut = desktopShortcuts.find((item) => item.id === shortcutId);

  if (!shortcut) {
    return;
  }

  editingShortcutId = shortcutId;
  shortcutForm.reset();
  shortcutNameInput.value = shortcut.name;
  shortcutUrlInput.value = shortcut.url;
  shortcutDialogTitle.innerText = "Edit Desktop Shortcut";
  submitShortcutButton.innerText = "Save";
  addShortcutButton.setAttribute("aria-expanded", "false");
  loadShortcutIconForEditing(shortcut);
  showShortcutDialog();
}

function closeShortcutDialog() {
  shortcutDialog.classList.add("hidden");
  addShortcutButton.setAttribute("aria-expanded", "false");
  shortcutForm.reset();
  resetShortcutIcon();
  editingShortcutId = null;
  shortcutDialogTitle.innerText = "Add Desktop Shortcut";
  submitShortcutButton.innerText = "Add";
  clearShortcutError();
  addShortcutButton.focus();
}

function removeShortcut(shortcutId) {
  const shortcut = desktopShortcuts.find((item) => item.id === shortcutId);

  if (!shortcut) {
    return;
  }

  const shouldRemove = window.confirm(`Remove “${shortcut.name}” from the desktop?`);

  if (!shouldRemove) {
    return;
  }

  desktopShortcuts = desktopShortcuts.filter((item) => item.id !== shortcutId);
  saveShortcuts();
  renderShortcuts();
}

function createShortcutElement(shortcut) {
  const item = document.createElement("div");
  const link = document.createElement("a");
  const icon = document.createElement("div");
  const image = document.createElement("img");
  const label = document.createElement("p");
  const editButton = document.createElement("button");
  const deleteButton = document.createElement("button");

  item.className = "desktop-shortcut-item";
  item.classList.add("desktop-icon-item");
  item.draggable = true;
  item.dataset.iconId = `shortcut:${shortcut.id}`;
  link.href = shortcut.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = `Open ${shortcut.name}`;

  icon.className = "bg-icon";
  image.src = shortcut.icon || DEFAULT_SHORTCUT_ICON;
  image.alt = "";
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", () => {
    image.src = DEFAULT_SHORTCUT_ICON;
  }, { once: true });
  label.className = "bg-icon_font";
  label.innerText = shortcut.name;

  editButton.className = "shortcut-edit";
  editButton.type = "button";
  editButton.draggable = false;
  editButton.innerText = "E";
  editButton.setAttribute("aria-label", `Edit ${shortcut.name}`);
  editButton.title = "Edit shortcut";
  editButton.addEventListener("click", () => openShortcutEditor(shortcut.id));

  deleteButton.className = "shortcut-delete";
  deleteButton.type = "button";
  deleteButton.draggable = false;
  deleteButton.innerText = "×";
  deleteButton.setAttribute("aria-label", `Remove ${shortcut.name}`);
  deleteButton.addEventListener("click", () => removeShortcut(shortcut.id));

  icon.appendChild(image);
  icon.appendChild(label);
  link.appendChild(icon);
  item.appendChild(link);
  item.appendChild(editButton);
  item.appendChild(deleteButton);

  return item;
}

function renderShortcuts() {
  desktopIconArea
    .querySelectorAll(".desktop-shortcut-item")
    .forEach((shortcutElement) => shortcutElement.remove());

  desktopShortcuts.forEach((shortcut) => {
    desktopIconArea.appendChild(createShortcutElement(shortcut));
  });

  desktopIconArea.dispatchEvent(new CustomEvent("desktop-icons:rendered"));
}

function onShortcutSubmit(event) {
  event.preventDefault();
  clearShortcutError();

  if (submitShortcutButton.disabled) {
    showShortcutError("Wait for the icon image to finish processing.");
    return;
  }

  const name = shortcutNameInput.value.trim();
  const url = normalizeShortcutUrl(shortcutUrlInput.value);

  if (!name) {
    showShortcutError("Enter a shortcut name.");
    shortcutNameInput.focus();
    return;
  }

  if (!url) {
    showShortcutError("Enter a valid HTTP or HTTPS URL.");
    shortcutUrlInput.focus();
    return;
  }

  const shortcutData = {
    id: editingShortcutId || createShortcutId(),
    name,
    url,
    icon: hasExplicitShortcutIcon
      ? selectedShortcutIcon
      : createSiteFaviconUrl(url),
    iconMode: hasExplicitShortcutIcon ? "custom" : "automatic",
  };

  if (editingShortcutId) {
    const shortcutIndex = desktopShortcuts.findIndex(
      (shortcut) => shortcut.id === editingShortcutId
    );

    if (shortcutIndex < 0) {
      showShortcutError("This shortcut no longer exists.");
      return;
    }

    const previousShortcut = desktopShortcuts[shortcutIndex];
    desktopShortcuts[shortcutIndex] = shortcutData;

    if (!saveShortcuts()) {
      desktopShortcuts[shortcutIndex] = previousShortcut;
      return;
    }
  } else {
    desktopShortcuts.push(shortcutData);

    if (!saveShortcuts()) {
      desktopShortcuts.pop();
      return;
    }
  }

  renderShortcuts();
  closeShortcutDialog();
}

addShortcutButton.addEventListener("click", openShortcutDialog);
closeShortcutDialogButton.addEventListener("click", closeShortcutDialog);
cancelShortcutButton.addEventListener("click", closeShortcutDialog);
shortcutForm.addEventListener("submit", onShortcutSubmit);
shortcutIconInput.addEventListener("change", onShortcutIconChange);
shortcutUrlInput.addEventListener("blur", updateAutomaticShortcutIconPreview);
shortcutIconPreview.addEventListener("error", onShortcutIconPreviewError);
useAutomaticIconButton.addEventListener("click", selectAutomaticShortcutIcon);
openProjectIconPickerButton.addEventListener(
  "click",
  toggleProjectIconPicker
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !shortcutDialog.classList.contains("hidden")) {
    if (!projectIconPicker.classList.contains("hidden")) {
      closeProjectIconPicker();
      openProjectIconPickerButton.focus();
    } else {
      closeShortcutDialog();
    }
  }
});

renderProjectIconPicker();
renderShortcuts();
