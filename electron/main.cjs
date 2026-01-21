const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

// __dirname is available in CommonJS

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.platform === 'win32') {
  if (process.argv.includes('--squirrel-firstrun')) app.quit();
}

let mainWindow;
let serverProcess = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'AssetGuard Desktop',
    backgroundColor: '#0f172a', // Matches slate-900
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Simplifying for this example; use preload in strict production
      webSecurity: false // sometimes needed for local asset loading in dev
    },
    autoHideMenuBar: true, // Hides the ugly file menu
  });

  // Check if we are in development mode
  const isDev = !app.isPackaged;

  if (isDev) {
    // Load local vite server
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    // In packaged mode we spawn the bundled server (server files are unpacked by electron-builder)
    try {
      const unpackedServerPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'server', 'index.cjs');
      serverProcess = spawn(process.execPath, [unpackedServerPath], {
        cwd: path.join(process.resourcesPath, 'app.asar.unpacked', 'server'),
        detached: true,
        stdio: 'ignore'
      });
      serverProcess.unref();
    } catch (e) {
      console.warn('Failed to spawn bundled server:', e);
    }
    // Load built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

    });
app.whenReady().then(() => {
