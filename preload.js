const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomodoroAPI', {
  sendNotification: (title, body) => ipcRenderer.invoke('send-notification', { title, body }),
  updateTrayTitle: (title) => ipcRenderer.invoke('update-tray-title', title),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  onTrayToggle: (callback) => ipcRenderer.on('tray-toggle', callback),
  onTraySkip: (callback) => ipcRenderer.on('tray-skip', callback),
});