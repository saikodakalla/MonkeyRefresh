const API_BASE = "http://localhost:5050";

let currentUserId = null;

function getOrCreateUserId(callback) {
  chrome.storage.local.get(["userId"], (data) => {
    if (data.userId) {
      currentUserId = data.userId;
      callback(data.userId);
    } else {
      const newId = crypto.randomUUID();
      chrome.storage.local.set({ userId: newId }, () => {
        currentUserId = newId;
        callback(newId);
      });
    }
  });
}

function loadSettings() {
  chrome.storage.sync.get(["enabled", "threshold"], (data) => {
    const toggle = document.getElementById("toggle");
    const thresholdInput = document.getElementById("threshold");

    toggle.checked = data.enabled ?? true;
    thresholdInput.value = data.threshold ?? "100";
  });
}

function saveSettings() {
  const toggle = document.getElementById("toggle");
  const thresholdInput = document.getElementById("threshold");
  const statusEl = document.getElementById("status");

  const threshold = Number(thresholdInput.value) || 100;

  chrome.storage.sync.set(
    {
      enabled: toggle.checked,
      threshold,
    },
    () => {
      statusEl.textContent = "Settings saved ✓";
      statusEl.style.color = "#4ade80";
      setTimeout(() => {
        statusEl.textContent = "";
      }, 1500);
    }
  );
}

function ensureUserOnBackend(userId) {
  const usernameSpan = document.getElementById("usernameValue");

  fetch(`${API_BASE}/ensure-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data && data.username) {
        usernameSpan.textContent = data.username;
      } else {
        usernameSpan.textContent = "Unknown";
      }
    })
    .catch(() => {
      usernameSpan.textContent = "Offline";
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();

  getOrCreateUserId((userId) => {
    ensureUserOnBackend(userId);
  });

  document.getElementById("saveBtn").addEventListener("click", saveSettings);

  document.getElementById("analyticsBtn").addEventListener("click", () => {
    if (!currentUserId) return;
    const url = `http://localhost:5173/?userId=${encodeURIComponent(
      currentUserId
    )}`;
    chrome.tabs.create({ url });
  });
});
