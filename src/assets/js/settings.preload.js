const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {
  steamExecutable: () => ipcRenderer.invoke('steamExecutable'),
  cs2Directory: () => ipcRenderer.invoke('cs2Directory'),
  cs2ServerListUrl: () => ipcRenderer.invoke('cs2ServerListUrl'),
  autoDownloadAssets: () => ipcRenderer.invoke('autoDownloadAssets'),
  saveSettings: (steamExecutable, cs2Directory, cs2ServerListUrl, autoDownloadAssets) => ipcRenderer.invoke('saveSettings', steamExecutable, cs2Directory, cs2ServerListUrl, autoDownloadAssets),
})