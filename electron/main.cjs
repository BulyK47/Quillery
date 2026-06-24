const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const fsp = require("node:fs/promises");

const isDev = process.env.ELECTRON_DEV === "1";

let mainWindow = null;
let configPath = null;
let watcher = null;
// The exact text the app last wrote, so the watcher can ignore its own writes.
let lastWrittenText = null;

// ---- sync-folder storage --------------------------------------------------
const DATA_FILE = "quillery-data.json";

function readConfig() {
  try {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.error("quillery-sync.json is unreadable/corrupt:", e);
    return {};
  }
}
function writeConfig(cfg) {
  try {
    const tmp = `${configPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cfg));
    fs.renameSync(tmp, configPath); // atomic replace — never leaves a half file
  } catch (e) {
    console.error("writeConfig failed:", e);
  }
}
function dataFilePath() {
  const folder = readConfig().folder;
  return folder ? path.join(folder, DATA_FILE) : null;
}

function setupWatcher() {
  if (watcher) {
    try {
      watcher.close();
    } catch {
      /* ignore */
    }
    watcher = null;
  }
  const file = dataFilePath();
  if (!file) return;

  let debounce = null;
  const notifyIfChanged = async () => {
    try {
      const content = await fsp.readFile(file, "utf8");
      // Ignore our own writes — otherwise write → watch → reload feedback loop.
      if (content === lastWrittenText) return;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("sync:changed");
      }
    } catch {
      /* file removed / temporarily unreadable (e.g. OneDrive offline) */
    }
  };

  try {
    // The filename arg is unreliable (can be null on rename), so verify by
    // reading the data file rather than filtering on it.
    watcher = fs.watch(path.dirname(file), () => {
      clearTimeout(debounce);
      debounce = setTimeout(notifyIfChanged, 300);
    });
    watcher.on("error", (e) => {
      console.error("sync watcher error — re-arming:", e);
      try {
        watcher.close();
      } catch {
        /* ignore */
      }
      watcher = null;
      setTimeout(setupWatcher, 2000); // re-arm (handles the folder going offline)
    });
  } catch (e) {
    console.error("sync watcher setup failed:", e);
  }
}

function registerSyncIpc() {
  ipcMain.handle("sync:getFolder", () => readConfig().folder ?? null);

  ipcMain.handle("sync:chooseFolder", async () => {
    const r = await dialog.showOpenDialog(mainWindow, {
      title: "Choose a folder to sync Quillery prompts",
      properties: ["openDirectory", "createDirectory"],
    });
    if (r.canceled || !r.filePaths[0]) return readConfig().folder ?? null;
    const cfg = readConfig();
    cfg.folder = r.filePaths[0];
    writeConfig(cfg);
    setupWatcher();
    return cfg.folder;
  });

  ipcMain.handle("sync:clearFolder", () => {
    const cfg = readConfig();
    delete cfg.folder;
    writeConfig(cfg);
    setupWatcher();
    return null;
  });

  ipcMain.handle("sync:read", async () => {
    const file = dataFilePath();
    if (!file) return null;
    try {
      return await fsp.readFile(file, "utf8");
    } catch {
      return null; // file doesn't exist yet
    }
  });

  ipcMain.handle("sync:write", async (_e, text) => {
    const file = dataFilePath();
    if (!file) return { ok: false, error: "no-folder" };
    if (typeof text !== "string") return { ok: false, error: "bad-input" };
    if (text.length > 20_000_000) return { ok: false, error: "too-large" };
    try {
      await fsp.mkdir(path.dirname(file), { recursive: true });
      lastWrittenText = text; // mark self-originated so the watcher ignores it
      await fsp.writeFile(file, text, "utf8");
      return { ok: true };
    } catch (e) {
      console.error("sync write failed:", e);
      return { ok: false, error: String((e && e.message) || e) };
    }
  });
}

// ---- window ---------------------------------------------------------------
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
    icon: path.join(__dirname, "..", "dist", "icons", "icon256.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = win;

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
  configPath = path.join(app.getPath("userData"), "quillery-sync.json");
  registerSyncIpc();
  createWindow();
  setupWatcher();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (watcher) watcher.close();
  if (process.platform !== "darwin") app.quit();
});
