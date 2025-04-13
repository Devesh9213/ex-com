const { app, BrowserWindow } = require('electron');
const path = require('path');
const { initialize } = require('../backend/models');

let mainWindow;

app.whenReady().then(async () => {
  try {
    await initialize();
    
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    // Load your Vite frontend
    if (process.env.NODE_ENV === 'development') {
      await mainWindow.loadURL('http://localhost:3000');
    } else {
      await mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

  } catch (error) {
    console.error('Failed to start:', error);
    app.quit();
  }
});

// Standard Electron app lifecycle handlers...