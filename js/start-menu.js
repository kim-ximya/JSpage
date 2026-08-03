const startMenu = document.querySelector("#start-menu");
const startButton = document.querySelector("#start-button");
const randomWallpaperToggle = document.querySelector(
  "#random-wallpaper-toggle"
);
const randomWallpaperState = document.querySelector(
  "#random-wallpaper-state"
);
const changeWallpaperButton = document.querySelector("#change-wallpaper");

function isStartMenuOpen() {
  return startMenu.getAttribute("aria-hidden") === "false";
}

function openStartMenu() {
  startMenu.setAttribute("aria-hidden", "false");
  startButton.setAttribute("aria-expanded", "true");
  randomWallpaperToggle.focus();
}

function closeStartMenu({ returnFocus = false } = {}) {
  startMenu.setAttribute("aria-hidden", "true");
  startButton.setAttribute("aria-expanded", "false");

  if (returnFocus) {
    startButton.focus();
  }
}

function toggleStartMenu() {
  if (isStartMenuOpen()) {
    closeStartMenu();
  } else {
    openStartMenu();
  }
}

function updateWallpaperMenu(state = window.wallpaperController.getState()) {
  randomWallpaperToggle.setAttribute("aria-checked", String(state.enabled));
  randomWallpaperState.innerText = state.enabled ? "On" : "Off";
  changeWallpaperButton.disabled = !state.enabled;
}

startButton.addEventListener("click", toggleStartMenu);

randomWallpaperToggle.addEventListener("click", () => {
  window.wallpaperController.toggle();
});

changeWallpaperButton.addEventListener("click", () => {
  window.wallpaperController.change();
});

document.addEventListener("wallpaper:change", (event) => {
  updateWallpaperMenu(event.detail);
});

document.addEventListener("click", (event) => {
  if (
    isStartMenuOpen() &&
    !startMenu.contains(event.target) &&
    !startButton.contains(event.target)
  ) {
    closeStartMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isStartMenuOpen()) {
    closeStartMenu({ returnFocus: true });
  }
});

updateWallpaperMenu();
