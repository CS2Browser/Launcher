// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  handleLaunchGame: (callback) => ipcRenderer.on('handleLaunchGame', callback),
  openServerInfo: () => ipcRenderer.send('openServerInfo', []),
  handleServerList: (callback) => ipcRenderer.on('handleServerList', callback),
  selectServer: (id) => ipcRenderer.send('selectServer', id),
  serverVisible: (serverID, visible) => ipcRenderer.send('serverVisible', serverID, visible),
  handleServerResponse: (callback) => ipcRenderer.on('handleServerResponse', callback),
  refreshServerList: () => ipcRenderer.send('refreshServerList', []),
  handleRefreshServerListFinished: (callback) => ipcRenderer.on('handleRefreshServerListFinished', callback),
  log: (type, message) => ipcRenderer.invoke('log', type, message),
});