document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle");
  const threshold = document.getElementById("threshold");
  const thresholdValue = document.getElementById("thresholdValue");
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");
  const overlayToggle = document.getElementById("overlayToggle");
  const analyticsBtn = document.getElementById("analyticsBtn");

  chrome.storage.sync.get(
    ["enabled", "threshold", "showAccuracyOverlay"],
    (data) => {
      toggle.checked = data.enabled ?? true;
      threshold.value = data.threshold ?? 100;
      thresholdValue.textContent = `${threshold.value}%`;
      overlayToggle.checked = data.showAccuracyOverlay ?? false;
    }
  );

  threshold.addEventListener("input", () => {
    thresholdValue.textContent = `${threshold.value}%`;
  });

  saveBtn.addEventListener("click", () => {
    chrome.storage.sync.set(
      {
        enabled: toggle.checked,
        threshold: parseFloat(threshold.value),
        showAccuracyOverlay: overlayToggle.checked,
      },
      () => {
        status.textContent = "Saved!";
        status.style.color = "limegreen";
        setTimeout(() => (status.textContent = ""), 1500);
      }
    );
  });

  analyticsBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://monkey-refresh.vercel.app" });
  });
});
