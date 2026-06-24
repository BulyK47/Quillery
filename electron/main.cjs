const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const isDev = process.env.ELECTRON_DEV === "1";

function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 780,
    minWidth: 380,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#ffffff",
    title: "Quillery",
    // Vite copies public/ into dist/, and only dist/ + electron/ are packaged,
    // so reference the packed copy (the public/ path doesn't exist in app.asar).
    icon: path.join(__dirname, "..", "dist", "icons", "icon256.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  // Default-deny: only http(s) links open in the user's browser; every other
  // scheme is refused rather than spawning an uncontrolled in-app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:") || url.startsWith("http:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Lock the main window to the bundled app — never let it navigate away.
  win.webContents.on("will-navigate", (event, url) => {
    const current = win.webContents.getURL();
    if (url !== current) {
      event.preventDefault();
      if (url.startsWith("https:") || url.startsWith("http:")) {
        shell.openExternal(url);
      }
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
