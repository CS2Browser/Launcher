const { contextBridge, ipcRenderer } = require('electron');

console.log("load preload");

contextBridge.exposeInMainWorld('settingsAPI', {
  steamExecutable: () => ipcRenderer.invoke('steamExecutable'),
  cs2Directory: () => ipcRenderer.invoke('cs2Directory'),
  cs2ServerListUrl: () => ipcRenderer.invoke('cs2ServerListUrl'),
  saveSettings: (steamExecutable, cs2Directory, cs2ServerListUrl) => ipcRenderer.invoke('saveSettings', steamExecutable, cs2Directory, cs2ServerListUrl)
})