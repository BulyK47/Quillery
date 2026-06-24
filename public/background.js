// MV3 service worker.
// Clicking the toolbar icon opens Quillery in the browser side panel.
// The side panel stays open while you interact with the page — it does NOT
// close when you click outside it (unlike a popup), and it docks to the side
// of the window so it's larger and out of the way.

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error("setPanelBehavior failed:", err));
});

// Fallback for browsers/versions where openPanelOnActionClick is unavailable:
// explicitly open the panel for the clicked tab's window.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (tab.windowId != null) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (err) {
    console.error("sidePanel.open failed:", err);
  }
});
