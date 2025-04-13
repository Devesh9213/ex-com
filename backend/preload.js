const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  logout: () => ipcRenderer.invoke('auth:logout'),
  
  // Employees
  getEmployees: () => ipcRenderer.invoke('employees:getAll'),
  addEmployee: (employee) => ipcRenderer.invoke('employees:add', employee),
  deleteEmployee: (id) => ipcRenderer.invoke('employees:delete', id)
})