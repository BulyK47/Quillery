// Minimal, hardened preload. The app is a self-contained renderer that uses
// localStorage for persistence, so no privileged bridge is required yet.
// Exposing app metadata lets the UI detect the desktop build if needed later.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  isElectron: true,
  platform: process.platform,
});
