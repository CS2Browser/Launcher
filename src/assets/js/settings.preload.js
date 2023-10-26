const { contextBridge, ipcRenderer } = require('electron');

console.log("load preload");

contextBridge.exposeInMainWorld('settingsAPI', {
  steamExecutable: () => ipcRenderer.invoke('steamExecutable'),
  cs2Directory: () => ipcRenderer.invoke('cs2Directory'),
  saveSettings: (steamExecutable, cs2Directory) => ipcRenderer.invoke('saveSettings', steamExecutable, cs2Directory)
})