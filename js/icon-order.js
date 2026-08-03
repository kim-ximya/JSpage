const desktopIconContainer = document.querySelector(".icon-base");
const ICON_ORDER_STORAGE_KEY = "desktopIconOrder";
const ICON_ORDER_VERSION_KEY = "desktopIconOrderVersion";
const CURRENT_ICON_ORDER_VERSION = "2";

let draggedDesktopIcon = null;

function getDesktopIcons() {
  return Array.from(desktopIconContainer.children).filter((element) =>
    element.classList.contains("desktop-icon-item")
  );
}

function loadIconOrder() {
  try {
    const storedOrder = JSON.parse(
      localStorage.getItem(ICON_ORDER_STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(storedOrder)) {
      return [];
    }

    return storedOrder.filter((iconId) => typeof iconId === "string");
  } catch (error) {
    return [];
  }
}

function saveIconOrder() {
  try {
    const iconOrder = getDesktopIcons().map(
      (iconElement) => iconElement.dataset.iconId
    );
    localStorage.setItem(ICON_ORDER_STORAGE_KEY, JSON.stringify(iconOrder));
  } catch (error) {
    // The current DOM order still works when browser storage is unavailable.
  }
}

function migrateDefaultIconOrder() {
  try {
    if (
      localStorage.getItem(ICON_ORDER_VERSION_KEY) ===
      CURRENT_ICON_ORDER_VERSION
    ) {
      return;
    }

    const previousOrder = loadIconOrder();

    if (previousOrder.length > 0) {
      const migratedOrder = [
        "add-shortcut",
        ...previousOrder.filter((iconId) => iconId !== "add-shortcut"),
      ];
      localStorage.setItem(
        ICON_ORDER_STORAGE_KEY,
        JSON.stringify(migratedOrder)
      );
    }

    localStorage.setItem(
      ICON_ORDER_VERSION_KEY,
      CURRENT_ICON_ORDER_VERSION
    );
  } catch (error) {
    // The Add Shortcut icon still comes first in the default HTML order.
  }
}

function applySavedIconOrder() {
  const savedOrder = loadIconOrder();
  const icons = getDesktopIcons();
  const iconsById = new Map(
    icons.map((iconElement) => [iconElement.dataset.iconId, iconElement])
  );

  savedOrder.forEach((iconId) => {
    const iconElement = iconsById.get(iconId);

    if (iconElement) {
      desktopIconContainer.appendChild(iconElement);
      iconsById.delete(iconId);
    }
  });

  icons.forEach((iconElement) => {
    if (iconsById.has(iconElement.dataset.iconId)) {
      desktopIconContainer.appendChild(iconElement);
    }
  });

  saveIconOrder();
}

function clearDropState() {
  getDesktopIcons().forEach((iconElement) => {
    iconElement.classList.remove("dragging");
    iconElement.classList.remove("drop-target");
  });
}

function getIconFromEvent(event) {
  const iconElement = event.target.closest(".desktop-icon-item");

  if (!iconElement || iconElement.parentElement !== desktopIconContainer) {
    return null;
  }

  return iconElement;
}

function swapDesktopIcons(firstIcon, secondIcon) {
  const icons = getDesktopIcons();
  const firstIndex = icons.indexOf(firstIcon);
  const secondIndex = icons.indexOf(secondIcon);

  if (firstIndex < 0 || secondIndex < 0 || firstIndex === secondIndex) {
    return;
  }

  [icons[firstIndex], icons[secondIndex]] = [
    icons[secondIndex],
    icons[firstIndex],
  ];
  icons.forEach((iconElement) => desktopIconContainer.appendChild(iconElement));
  saveIconOrder();
}

desktopIconContainer.addEventListener("dragstart", (event) => {
  const iconElement = getIconFromEvent(event);

  if (!iconElement) {
    return;
  }

  draggedDesktopIcon = iconElement;
  iconElement.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", iconElement.dataset.iconId);
});

desktopIconContainer.addEventListener("dragover", (event) => {
  const targetIcon = getIconFromEvent(event);

  if (!draggedDesktopIcon || !targetIcon || targetIcon === draggedDesktopIcon) {
    return;
  }

  event.preventDefault();
  getDesktopIcons().forEach((iconElement) =>
    iconElement.classList.remove("drop-target")
  );
  targetIcon.classList.add("drop-target");
  event.dataTransfer.dropEffect = "move";
});

desktopIconContainer.addEventListener("drop", (event) => {
  const targetIcon = getIconFromEvent(event);

  event.preventDefault();

  if (draggedDesktopIcon && targetIcon && targetIcon !== draggedDesktopIcon) {
    swapDesktopIcons(draggedDesktopIcon, targetIcon);
  }

  draggedDesktopIcon = null;
  clearDropState();
});

desktopIconContainer.addEventListener("dragend", () => {
  draggedDesktopIcon = null;
  clearDropState();
});

desktopIconContainer.addEventListener(
  "desktop-icons:rendered",
  applySavedIconOrder
);

migrateDefaultIconOrder();
applySavedIconOrder();
