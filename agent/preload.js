const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of safe IPC channels
const validChannels = ['login', 'get-device-id', 'get-hostname', 'get-version', 'set-auto-launch', 'get-auto-launch'];

contextBridge.exposeInMainWorld('electronAPI', {
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  getDeviceId: () => ipcRenderer.invoke('get-device-id'),
  getHostname: () => ipcRenderer.invoke('get-hostname'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('set-auto-launch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
});
