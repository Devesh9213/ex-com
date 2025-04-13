const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow;

function startBackendServer() {
  const isPackaged = app.isPackaged;
  const serverPath = isPackaged
    ? path.join(process.resourcesPath, 'backend', 'server.js')
    : path.join(__dirname, 'backend', 'server.js');

  if (!fs.existsSync(serverPath)) {
    console.error('Backend server.js not found at:', serverPath);
    return;
  }

  const backend = spawn('node', [serverPath], {
    stdio: 'inherit',
    shell: true,
  });

  backend.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
}

function waitForBackend(retries = 10, delay = 500) {
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      http.get('http://localhost:3001', (res) => {
        res.statusCode < 500 ? resolve() : retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (--retries <= 0) return reject(new Error('Backend not responding'));
      setTimeout(tryConnect, delay);
    };
    tryConnect();
  });
}

async function createWindow() {
  startBackendServer();

  try {
    await waitForBackend();
    console.log('✅ Backend is ready');
  } catch (err) {
    console.error('❌ Backend did not start in time:', err);
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    }
  });

  const indexPath = app.isPackaged
    ? path.join(__dirname, 'frontend', 'dist', 'index.html')
    : 'http://localhost:5173';

  if (app.isPackaged) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL(indexPath);
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
