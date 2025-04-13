const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth methods
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  register: (userData) => ipcRenderer.invoke('auth:register', userData),
  
  // Employee methods
  getEmployees: () => ipcRenderer.invoke('employees:getAll'),
  
  // App methods
  quit: () => ipcRenderer.send('app:quit')
});