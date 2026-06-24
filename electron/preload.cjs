// Minimal, hardened preload. The renderer uses localStorage for its working
// state; this bridge adds an optional "sync folder" so the desktop app can keep
// a JSON copy in e.g. a OneDrive folder for cross-device sync.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  isElectron: true,
  platform: process.platform,
  sync: {
    getFolder: () => ipcRenderer.invoke("sync:getFolder"),
    chooseFolder: () => ipcRenderer.invoke("sync:chooseFolder"),
    clearFolder: () => ipcRenderer.invoke("sync:clearFolder"),
    read: () => ipcRenderer.invoke("sync:read"),
    write: (text) => ipcRenderer.invoke("sync:write", text),
    onChange: (cb) => {
      const listener = () => cb();
      ipcRenderer.on("sync:changed", listener);
      return () => ipcRenderer.removeListener("sync:changed", listener);
    },
  },
});
