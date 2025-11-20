// ===============================
// Typing Auto-Refresh + Overlay
// ===============================
const API_URL = "https://monkeyrefresh.onrender.com";

// SETTINGS
let settings = {
  enabled: true,
  threshold: 100,
  showAccuracyOverlay: false,
};

// USER ID + USERNAME
let userId = null;
let username = null;

// LOAD USER ID
chrome.storage.local.get(["userId"], (data) => {
  if (!data.userId) {
    const newId = crypto.randomUUID();
    chrome.storage.local.set({ userId: newId });
    userId = newId;
  } else {
    userId = data.userId;
  }
});

// LOAD USERNAME
chrome.storage.local.get(["username"], (data) => {
  username = data.username || null;
});

// REGISTER USER WITH BACKEND
function registerUserWithBackend() {
  if (!userId) return;

  fetch(`${API_URL}/ensure-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
    .then((res) => res.json())
    .then((data) => {
      username = data.username;
      chrome.storage.local.set({ username });
    })
    .catch((err) => console.error("ensure-user error:", err));
}

setTimeout(registerUserWithBackend, 800);

// LOAD SETTINGS
chrome.storage.sync.get(
  ["enabled", "threshold", "showAccuracyOverlay"],
  (data) => {
    settings.enabled = data.enabled ?? true;
    settings.threshold = parseFloat(data.threshold ?? 100);
    settings.showAccuracyOverlay = data.showAccuracyOverlay ?? false;
  }
);

// LISTEN FOR SETTINGS CHANGES
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) settings.enabled = changes.enabled.newValue;
  if (changes.threshold)
    settings.threshold = parseFloat(changes.threshold.newValue);
  if (changes.showAccuracyOverlay)
    settings.showAccuracyOverlay = changes.showAccuracyOverlay.newValue;
});

// ===============================
// OVERLAY (DRAGGABLE)
// ===============================

let overlay = null;
let dragging = false;
let offsetX = 0,
  offsetY = 0;

function createOverlay() {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 80px;
    left: 20px;
    padding: 10px 16px;
    background: rgba(0,0,0,0.55);
    color: #fff;
    border-radius: 10px;
    font-size: 18px;
    backdrop-filter: blur(6px);
    cursor: move;
    z-index: 999999;
    user-select: none;
  `;
  overlay.innerText = "Accuracy: --%";

  document.body.appendChild(overlay);

  overlay.addEventListener("mousedown", (e) => {
    dragging = true;
    offsetX = e.clientX - overlay.offsetLeft;
    offsetY = e.clientY - overlay.offsetTop;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    overlay.style.left = `${e.clientX - offsetX}px`;
    overlay.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });
}

function removeOverlay() {
  if (overlay) overlay.remove();
  overlay = null;
}

// ===============================
// SEND REFRESH LOG
// ===============================
function sendRefreshLog() {
  if (!userId) return Promise.resolve(); // makes it awaitable even if no user

  return fetch(`${API_URL}/log-refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, username }),
  }).catch((err) => console.error("log-refresh error:", err));
}

// ===============================
// MAIN WATCHER
// ===============================

function startWatcher() {
  const typingArea = document.querySelector("#words");

  if (!typingArea) return setTimeout(startWatcher, 300);

  let lastRefresh = 0;

  const observer = new MutationObserver(() => {
    if (settings.showAccuracyOverlay) createOverlay();
    else removeOverlay();

    const incorrect = document.querySelectorAll(".incorrect").length;
    const total = document.querySelectorAll(".correct, .incorrect").length;

    if (total === 0) return;

    const accuracy = (1 - incorrect / total) * 100;

    if (overlay) overlay.innerText = `Accuracy: ${accuracy.toFixed(2)}%`;

    if (!settings.enabled) return;

    if (accuracy < settings.threshold) {
      const now = Date.now();
      if (now - lastRefresh > 500) {
        lastRefresh = now;
        sendRefreshLog().finally(() => {
          setTimeout(() => location.reload(), 150);
        });
      }
    }
  });

  observer.observe(typingArea, { childList: true, subtree: true });
}

startWatcher();
