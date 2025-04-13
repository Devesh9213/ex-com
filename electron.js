const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

// GPU Process Error Prevention
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');

let mainWindow;
let backendProcess;

function startBackendServer() {
  const isPackaged = app.isPackaged;
  const serverPath = isPackaged
    ? path.join(process.resourcesPath, 'backend', 'server.js')
    : path.join(__dirname, 'backend', 'server.js');

  if (!fs.existsSync(serverPath)) {
    console.error('Backend server.js not found at:', serverPath);
    return null;
  }

  const backend = spawn('node', [serverPath], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1'
    }
  });

  backend.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  backend.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0 && !backendProcess.killed) {
      console.log('Restarting backend...');
      backendProcess = startBackendServer();
    }
  });

  return backend;
}

async function waitForBackend(retries = 10, delay = 500) {
  return new Promise((resolve, reject) => {
    const tryConnect = (attempt = 1) => {
      const request = http.get('http://localhost:3001', (res) => {
        if (res.statusCode < 500) {
          console.log(`Backend connected after ${attempt} attempts`);
          request.destroy();
          resolve();
        } else {
          request.destroy();
          retry(attempt);
        }
      }).on('error', () => retry(attempt));
    };

    const retry = (attempt) => {
      if (attempt >= retries) {
        reject(new Error(`Backend not responding after ${retries} attempts`));
        return;
      }
      setTimeout(() => tryConnect(attempt + 1), delay);
    };

    tryConnect();
  });
}

async function createWindow() {
  try {
    backendProcess = startBackendServer();
    if (!backendProcess) {
      throw new Error('Failed to initialize backend process');
    }

    await waitForBackend();
    console.log('✅ Backend is ready');
  } catch (err) {
    console.error('❌ Backend initialization failed:', err);
    if (backendProcess) backendProcess.kill();
    app.quit();
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
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    backgroundColor: '#1e1e1e'
  });

  const indexPath = app.isPackaged
    ? path.join(__dirname, 'frontend', 'dist', 'index.html')
    : 'http://localhost:5173';

  try {
    if (app.isPackaged) {
      await mainWindow.loadFile(indexPath);
    } else {
      await mainWindow.loadURL(indexPath);
    }
  } catch (err) {
    console.error('Failed to load window content:', err);
    app.quit();
    return;
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Optional: Open dev tools in development
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  if (backendProcess) backendProcess.kill();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (backendProcess) backendProcess.kill();
  app.quit();
});

// Initialize the app
app.whenReady().then(createWindow).catch((err) => {
  console.error('App initialization failed:', err);
  process.exit(1);
});