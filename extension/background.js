// Minimal background that injects the content script on Monkeytype pages
// (requires "scripting" permission and "content.js" in your extension).

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url || !tab.url.includes("monkeytype.com")) return;

  chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
});
