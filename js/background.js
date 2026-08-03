const desktopBackground = document.body;

const RANDOM_WALLPAPER_STORAGE_KEY = "randomWallpaperEnabled";
const LAST_WALLPAPER_STORAGE_KEY = "lastRandomWallpaper";
const DEFAULT_WALLPAPER = "css/backgroundImage/bg3.jpg";
const WALLPAPERS = [
  "css/backgroundImage/bg1.jpg",
  "css/backgroundImage/bg2.jpg",
  "css/backgroundImage/bg3.jpg",
  "css/backgroundImage/bg4.jpg",
  "css/backgroundImage/bg5.jpg",
];

let randomWallpaperEnabled = loadRandomWallpaperSetting();
let currentWallpaper = DEFAULT_WALLPAPER;

function loadRandomWallpaperSetting() {
  try {
    return localStorage.getItem(RANDOM_WALLPAPER_STORAGE_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function loadLastWallpaper() {
  try {
    const lastWallpaper = localStorage.getItem(LAST_WALLPAPER_STORAGE_KEY);
    return WALLPAPERS.includes(lastWallpaper) ? lastWallpaper : null;
  } catch (error) {
    return null;
  }
}

function saveWallpaperSetting() {
  try {
    localStorage.setItem(
      RANDOM_WALLPAPER_STORAGE_KEY,
      String(randomWallpaperEnabled)
    );
    localStorage.setItem(LAST_WALLPAPER_STORAGE_KEY, currentWallpaper);
  } catch (error) {
    // Random wallpaper still works for the current page when storage is blocked.
  }
}

function chooseRandomWallpaper() {
  const previousWallpaper = loadLastWallpaper() || currentWallpaper;
  const availableWallpapers = WALLPAPERS.filter(
    (wallpaper) => wallpaper !== previousWallpaper
  );
  const wallpaperPool =
    availableWallpapers.length > 0 ? availableWallpapers : WALLPAPERS;

  return wallpaperPool[Math.floor(Math.random() * wallpaperPool.length)];
}

function applyWallpaper(wallpaper) {
  currentWallpaper = wallpaper;

  if (wallpaper === DEFAULT_WALLPAPER && !randomWallpaperEnabled) {
    desktopBackground.style.backgroundImage = "";
  } else {
    desktopBackground.style.backgroundImage = `url("${wallpaper}")`;
  }
}

function notifyWallpaperChange() {
  document.dispatchEvent(
    new CustomEvent("wallpaper:change", {
      detail: window.wallpaperController.getState(),
    })
  );
}

function setRandomWallpaperEnabled(enabled) {
  randomWallpaperEnabled = Boolean(enabled);

  if (randomWallpaperEnabled) {
    applyWallpaper(chooseRandomWallpaper());
  } else {
    applyWallpaper(DEFAULT_WALLPAPER);
  }

  saveWallpaperSetting();
  notifyWallpaperChange();
}

function changeRandomWallpaper() {
  if (!randomWallpaperEnabled) {
    return;
  }

  applyWallpaper(chooseRandomWallpaper());
  saveWallpaperSetting();
  notifyWallpaperChange();
}

window.wallpaperController = {
  getState() {
    return {
      enabled: randomWallpaperEnabled,
      wallpaper: currentWallpaper,
    };
  },
  setEnabled: setRandomWallpaperEnabled,
  toggle() {
    setRandomWallpaperEnabled(!randomWallpaperEnabled);
  },
  change: changeRandomWallpaper,
};

if (randomWallpaperEnabled) {
  applyWallpaper(chooseRandomWallpaper());
  saveWallpaperSetting();
}
