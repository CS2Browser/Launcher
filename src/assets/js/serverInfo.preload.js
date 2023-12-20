const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serverInfoAPI', {
    downloadAssets: (serverId) => ipcRenderer.send('downloadAssets', serverId),
    serverSelected: () => ipcRenderer.invoke('serverSelected'),
    downloadFile: (fastdl, file) => ipcRenderer.invoke('downloadFile', fastdl, file),
    downloadFiles: (files) => ipcRenderer.invoke('downloadFiles', files),
    launchGame: (serverIP, appId) => ipcRenderer.invoke('launchGame', serverIP, appId),
    handleDownloadFile: (callback) => ipcRenderer.on('handleDownloadFile', callback),
    handleProgressDownloadFile: (callback) => ipcRenderer.on('handleProgressDownloadFile', callback),
    handleServerResponse: (callback) => ipcRenderer.on('handleServerResponse', callback),
    gameIsAlreadyRunning: () => ipcRenderer.invoke('gameIsAlreadyRunning'),
    connectToServer: (serverIP) => ipcRenderer.invoke('connectToServer', serverIP),
    log: (type, message) => ipcRenderer.invoke('log', type, message),
    steamExecutable: () => ipcRenderer.invoke('steamExecutable'),
    cs2Directory: () => ipcRenderer.invoke('cs2Directory'),
    handleServerPlayerResponse: (callback) => ipcRenderer.on('handleServerPlayerResponse', callback),
})