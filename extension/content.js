// Monkeytype Auto-Refresh content script
// Watches accuracy in real-time and refreshes as soon as it drops
// below the configured threshold, while logging to the backend.

const API_BASE = "http://localhost:5050";

// Prevent multiple initializations
if (!window.__mt_auto_refresh_started) {
  window.__mt_auto_refresh_started = true;

  let settings = {
    enabled: true,
    threshold: 100,
  };

  let userId = null;

  // ---- USER ID ----
  chrome.storage.local.get(["userId"], (data) => {
    if (data.userId) {
      userId = data.userId;
    } else {
      const newId = crypto.randomUUID();
      chrome.storage.local.set({ userId: newId });
      userId = newId;
    }
  });

  // ---- SETTINGS ----
  function loadSettings() {
    chrome.storage.sync.get(["enabled", "threshold"], (data) => {
      settings.enabled = data.enabled ?? true;
      settings.threshold = Number(data.threshold ?? 100);
      if (Number.isNaN(settings.threshold)) settings.threshold = 100;
    });
  }

  loadSettings();

  chrome.storage.sync.onChanged.addListener((changes) => {
    if (changes.enabled) {
      settings.enabled = changes.enabled.newValue;
    }
    if (changes.threshold) {
      const v = Number(changes.threshold.newValue);
      settings.threshold = Number.isNaN(v) ? 100 : v;
    }
  });

  // ---- LOGGING ----
  function sendRefreshLog() {
    if (!userId) return;

    fetch(`${API_BASE}/log-refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).catch((err) => {
      console.error("Error sending refresh log:", err);
    });
  }

  // ---- ACCURACY CALC ----
  function computeAccuracy() {
    const incorrect = document.querySelectorAll(".incorrect").length;
    const correct = document.querySelectorAll(".correct").length;
    const total = correct + incorrect;

    if (total === 0) return 100;

    return (correct / total) * 100;
  }

  // ---- WATCHER ----
  function startWatcher() {
    const typingArea = document.querySelector("#words");

    if (!typingArea) {
      setTimeout(startWatcher, 300);
      return;
    }

    console.log("[Monkeytype Auto-Refresh] watcher started");

    let lastRefreshTime = 0;

    const observer = new MutationObserver(() => {
      if (!settings.enabled) return;

      const accuracy = computeAccuracy();

      if (accuracy < settings.threshold) {
        const now = Date.now();

        // prevent double refreshes within 150ms
        if (now - lastRefreshTime < 150) return;
        lastRefreshTime = now;

        console.log(
          `[Monkeytype Auto-Refresh] accuracy ${accuracy.toFixed(2)}% < ${
            settings.threshold
          }% — refreshing`
        );

        sendRefreshLog();
        location.reload();
      }
    });

    observer.observe(typingArea, {
      childList: true,
      subtree: true,
    });
  }

  startWatcher();
}
