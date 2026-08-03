const openNotepadButton = document.querySelector("#open-notepad");
const notepadWindow = document.querySelector("#window-screen");
const notepadTitleBar = document.querySelector("#notepad-title-bar");
const minimizeNotepadButton = document.querySelector("#minimize-notepad");
const closeNotepadButton = document.querySelector("#close-notepad");

const NOTEPAD_BOTTOM_MARGIN = 36;
const NOTEPAD_STATE_STORAGE_KEY = "notepadWindowState";

let isDraggingNotepad = false;
let notepadDragOffsetX = 0;
let notepadDragOffsetY = 0;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function loadNotepadState() {
  try {
    const savedState = JSON.parse(
      localStorage.getItem(NOTEPAD_STATE_STORAGE_KEY) || "null"
    );

    if (!savedState || typeof savedState !== "object") {
      return { isOpen: false, left: null, top: null };
    }

    const hasSavedPosition =
      Number.isFinite(savedState.left) && Number.isFinite(savedState.top);

    return {
      isOpen: savedState.isOpen === true,
      left: hasSavedPosition ? savedState.left : null,
      top: hasSavedPosition ? savedState.top : null,
    };
  } catch (error) {
    return { isOpen: false, left: null, top: null };
  }
}

function saveNotepadState(isOpen) {
  const savedLeft = Number.parseFloat(notepadWindow.style.left);
  const savedTop = Number.parseFloat(notepadWindow.style.top);
  const hasPosition =
    notepadWindow.style.position === "fixed" &&
    Number.isFinite(savedLeft) &&
    Number.isFinite(savedTop);

  try {
    localStorage.setItem(
      NOTEPAD_STATE_STORAGE_KEY,
      JSON.stringify({
        isOpen,
        left: hasPosition ? savedLeft : null,
        top: hasPosition ? savedTop : null,
      })
    );
  } catch (error) {
    // The window continues to work without persistence when storage is blocked.
  }
}

function constrainNotepadToViewport() {
  if (notepadWindow.style.position !== "fixed") {
    return;
  }

  const windowBounds = notepadWindow.getBoundingClientRect();
  const currentLeft = Number.parseFloat(notepadWindow.style.left);
  const currentTop = Number.parseFloat(notepadWindow.style.top);
  const maximumLeft = Math.max(0, window.innerWidth - windowBounds.width);
  const maximumTop = Math.max(
    0,
    window.innerHeight - windowBounds.height - NOTEPAD_BOTTOM_MARGIN
  );
  const nextLeft = clamp(
    Number.isFinite(currentLeft) ? currentLeft : windowBounds.left,
    0,
    maximumLeft
  );
  const nextTop = clamp(
    Number.isFinite(currentTop) ? currentTop : windowBounds.top,
    0,
    maximumTop
  );

  notepadWindow.style.left = `${nextLeft}px`;
  notepadWindow.style.top = `${nextTop}px`;
}

function moveNotepadTo(clientX, clientY) {
  const maximumLeft = Math.max(0, window.innerWidth - notepadWindow.offsetWidth);
  const maximumTop = Math.max(
    0,
    window.innerHeight - notepadWindow.offsetHeight - NOTEPAD_BOTTOM_MARGIN
  );
  const nextLeft = clamp(clientX - notepadDragOffsetX, 0, maximumLeft);
  const nextTop = clamp(clientY - notepadDragOffsetY, 0, maximumTop);

  notepadWindow.style.left = `${nextLeft}px`;
  notepadWindow.style.top = `${nextTop}px`;
}

function startNotepadDrag(event) {
  if (event.button !== 0 || event.target.closest(".title-bar-controls")) {
    return;
  }

  const windowBounds = notepadWindow.getBoundingClientRect();

  isDraggingNotepad = true;
  notepadDragOffsetX = event.clientX - windowBounds.left;
  notepadDragOffsetY = event.clientY - windowBounds.top;
  notepadWindow.style.position = "fixed";
  notepadWindow.style.left = `${windowBounds.left}px`;
  notepadWindow.style.top = `${windowBounds.top}px`;
  notepadWindow.classList.add("is-dragging");
  notepadTitleBar.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function continueNotepadDrag(event) {
  if (!isDraggingNotepad) {
    return;
  }

  moveNotepadTo(event.clientX, event.clientY);
}

function stopNotepadDrag(event) {
  if (!isDraggingNotepad) {
    return;
  }

  isDraggingNotepad = false;
  notepadWindow.classList.remove("is-dragging");

  if (notepadTitleBar.hasPointerCapture(event.pointerId)) {
    notepadTitleBar.releasePointerCapture(event.pointerId);
  }

  saveNotepadState(true);
}

function openNotepad({ shouldFocus = true, shouldSave = true } = {}) {
  notepadWindow.classList.remove("hidden");
  notepadWindow.setAttribute("aria-hidden", "false");
  openNotepadButton.setAttribute("aria-expanded", "true");
  constrainNotepadToViewport();

  if (shouldFocus) {
    notepadWindow.focus();
  }

  if (shouldSave) {
    saveNotepadState(true);
  }
}

function hideNotepad({ shouldFocus = true, shouldSave = true } = {}) {
  notepadWindow.classList.add("hidden");
  notepadWindow.setAttribute("aria-hidden", "true");
  openNotepadButton.setAttribute("aria-expanded", "false");

  if (shouldFocus) {
    openNotepadButton.focus();
  }

  if (shouldSave) {
    saveNotepadState(false);
  }
}

function restoreNotepadState() {
  const savedState = loadNotepadState();

  if (savedState.left !== null && savedState.top !== null) {
    notepadWindow.style.position = "fixed";
    notepadWindow.style.left = `${savedState.left}px`;
    notepadWindow.style.top = `${savedState.top}px`;
  }

  if (savedState.isOpen) {
    openNotepad({ shouldFocus: false, shouldSave: false });
    saveNotepadState(true);
  } else {
    hideNotepad({ shouldFocus: false, shouldSave: false });
  }
}

function onViewportResize() {
  if (
    notepadWindow.classList.contains("hidden") ||
    notepadWindow.style.position !== "fixed"
  ) {
    return;
  }

  constrainNotepadToViewport();
  saveNotepadState(true);
}

openNotepadButton.addEventListener("click", () => openNotepad());
minimizeNotepadButton.addEventListener("click", () => hideNotepad());
closeNotepadButton.addEventListener("click", () => hideNotepad());
notepadTitleBar.addEventListener("pointerdown", startNotepadDrag);
notepadTitleBar.addEventListener("pointermove", continueNotepadDrag);
notepadTitleBar.addEventListener("pointerup", stopNotepadDrag);
notepadTitleBar.addEventListener("pointercancel", stopNotepadDrag);
window.addEventListener("resize", onViewportResize);

restoreNotepadState();
