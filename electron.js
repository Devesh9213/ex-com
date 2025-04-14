const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Configuration
const isDevelopment = process.env.NODE_ENV === 'development';
let mainWindow = null;
let backendProcess = null;

// 1. Backend Process Management
function startBackend() {
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'server.js')
    : path.join(__dirname, 'backend', 'server.js');

  if (!fs.existsSync(backendPath)) {
    dialog.showErrorBox('Error', 'Backend server not found at: ' + backendPath);
    app.quit();
    return null;
  }

  const processEnv = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NODE_ENV: process.env.NODE_ENV || 'production'
  };

  const backend = spawn(process.execPath, [backendPath], {
    env: processEnv,
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  });

  backend.stdout.on('data', (data) => console.log(`[Backend] ${data}`));
  backend.stderr.on('data', (data) => console.error(`[Backend Error] ${data}`));

  backend.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0) {
      dialog.showErrorBox('Error', `Backend crashed with code ${code}`);
      app.quit();
    }
  });

  return backend;
}

// 2. Main Window Creation
function createMainWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load frontend
  if (isDevelopment) {
    window.loadURL('http://localhost:5173');
    window.webContents.openDevTools();
  } else {
    window.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  return window;
}

// 3. App Lifecycle Management
app.whenReady().then(() => {
  try {
    backendProcess = startBackend();
    if (!backendProcess) return;

    mainWindow = createMainWindow();
  } catch (error) {
    dialog.showErrorBox('Startup Error', error.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// 4. Error Handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Error', `Uncaught Exception: ${error.message}`);
  if (backendProcess) backendProcess.kill();
  app.quit();
});