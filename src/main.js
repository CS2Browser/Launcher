const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const log = require('electron-log');
const fs = require('fs');
const Store = require('electron-store');
const electronDl = require('electron-dl');
const { download } = require('electron-dl');

const { mainMenu } = require('./menu/mainmenu');

import { spawn } from 'child_process';
import { getGamePath } from 'steam-game-path';
import { queryGameServerInfo, queryGameServerRules } from 'steam-server-query';
import { checkProcessIsRunning } from './utils/windows-cmd';

import { fetchServers } from './utils/api';

let mainWindow = null;
let settingsWindow = null;

let serverInfo = null;
let serverList = [];
let serverSelected = null;
let serverRefreshingEnabled = true;
let timerRefreshServer = null;

const store = new Store();

log.info('App starting...');

require('update-electron-app')({
    updateInterval: '5 minutes',
    logger: require('electron-log')
})

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: false,
        backgroundColor: '#343841',
        fullscreenable: false,
        resizable: false,
        icon: './assets/images/icon.ico',
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: true,
        },
    });

    // Set version on title
    const appVersion = app.getVersion();
    mainWindow.setTitle(`CS2Browser Launcher ${appVersion}`);

    Menu.setApplicationMenu(mainMenu);

    mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
        (details, callback) => {
            callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
        },
    );

    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                'Access-Control-Allow-Origin': ['*'],
                ...details.responseHeaders,
            },
        });
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Find steam directory and CS2 directory
    const data = getGamePath(730);

    if (data) {
        // Save steam directory
        if (store.get('steamExecutable') == null) {
            // Check if steam.exe exists in steam directory
            const steamExecutable = data.steam.path + '\\steam.exe';
            if (!fs.existsSync(steamExecutable)) {
                log.error('Steam executable not found');
                store.set('steamExecutable', null);
            } else {
                log.info('Steam executable found');
                store.set('steamExecutable', steamExecutable);
            }
        }
        // Save CS2 directory
        if (store.get('cs2Directory') == null) {
            let cs2Directory = data.game.path + '\\game\\csgo';
            // Check if gameinfo.gi exists in CS2 directory
            if (!fs.existsSync(cs2Directory + '\\gameinfo.gi')) {
                log.error('CS2 directory not found');
                store.set('cs2Directory', null);
            } else {
                log.info('CS2 directory found');
                store.set('cs2Directory', cs2Directory);
            }
        }
    }

    ipcMain.handle('steamExecutable', () => store.get('steamExecutable'));
    ipcMain.handle('cs2Directory', () => store.get('cs2Directory'));

    ipcMain.handle('saveSettings', (event, steamExecutable, cs2Directory) => {
        let somethingWrong = false;
        if (!fs.existsSync(steamExecutable.replace(/\\/g, '\\\\'))) {
            log.error('Steam executable not found in: ' + steamExecutable);
            somethingWrong = true;
        } else {
            log.info('Steam executable found in: ' + steamExecutable);
            store.set('steamExecutable', steamExecutable);
        }
        if (!fs.existsSync(cs2Directory.replace(/\\/g, '\\\\') + '\\gameinfo.gi')) {
            log.error('CS2 directory not found in ' + cs2Directory);
            somethingWrong = true;
        } else {
            log.info('CS2 directory found in ' + cs2Directory);
            store.set('cs2Directory', cs2Directory);
        }
        if (!somethingWrong) {
            settingsWindow.close();
            settingsWindow = null;
        }
    });

    // if steam directory is not set, open window to set it
    if (!store.get('steamExecutable') || !store.get('cs2Directory')) {
        createSettingsWindow();
    }

    if (isDev()) {
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    }

    // Populate servers list from API when window is ready
    mainWindow.webContents.once('dom-ready', () => {
        loadServers(mainWindow);
    });

    ipcMain.handle('launchGame', (event, serverIP) => {
        // const webContents = event.sender;
        // const win = BrowserWindow.fromWebContents(webContents)
        launchGame(serverIP);
    });

    ipcMain.on('openServerInfo', (event, url) => {
        createServerInfoWindow();
    });

    ipcMain.on('selectServer', (event, serverId) => {
        serverSelected = serverId;
    });

    ipcMain.handle('serverSelected', () => getServerById(serverSelected));

    ipcMain.handle('downloadFile', (event, fastdlURL, file) => {
        downloadFile(fastdlURL, file);
    });

    ipcMain.handle('downloadFiles', (event, files) => {
        downloadFiles(files);
    });

    ipcMain.handle('gameIsAlreadyRunning', async () => await checkGameIsAlreadyRunning());

    ipcMain.handle('connectToServer', (event, serverIP) => {
        connectToTheServer(serverIP);
    });

    ipcMain.on('refreshServerList', async (event) => {
        refreshAllServers();
    });

    ipcMain.handle('log', (event, type, message) => {
        switch(type) {
            case 'info':
                log.info(message);
                break;
            case 'warn':
                log.warn(message);
                break;
            case 'error':
                log.error(message);
                break;
            case 'verbose':
                log.verbose(message);
                break;
            case 'debug':
                log.debug(message);
                break;
            case 'silly':
                log.silly(message);
                break;
            default:
                log.info(message);
        }
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function launchGame(serverIP) {
    const execArguments = ['-gameidlaunch 730', '-insecure', '+connect ' + serverIP];
    log.info('Launching game with params: ' + execArguments);

    let path = "";
    if (store.get('steamExecutable')) {
        path = store.get('steamExecutable');
    } else {
        log.error('Steam executable not set');
        return;
    }

    path = `"${path}"`;

    try {
        const spawnedProcess = spawn(path, execArguments, { detached: true, shell: true, stdio: 'ignore' });
        spawnedProcess.unref();
    } catch (error1) {
        log.error('Launching game error: ' + error1);
        return;
    }
}

async function getFileSize(url) {
    const response = await fetch(url, {
        method: 'HEAD'
    });
    return response.headers.get('content-length');
}

async function downloadFile(fastdlURL, file) {
    log.info("downloading file:", fastdlURL + file);
    const url = fastdlURL + file;
    let downloadfile = true;
    const win = serverInfo;

    // First we need to check if the file exists on destination folder and the file is different
    const fileDestination = store.get('cs2Directory') + "\\" + file;
    if (fs.existsSync(fileDestination)) {
        // Check if file is different
        const fileDestinationStats = fs.statSync(fileDestination);
        const fileDestinationSize = fileDestinationStats.size;
        // Get file size from server
        const fileServerSize = await getFileSize(url);
        // Check if file size is different
        if (fileDestinationSize != fileServerSize) {
            // Download file
            downloadfile = true;
        } else {
            // File is the same, don't download
            log.info("file is the same, don't download");
            downloadfile = false;
            win.webContents.send('handleProgressDownloadFile', {url: url, filename: file, progress: 1.0});
            win.webContents.send('handleDownloadFile', {status: 2, url: url, filename: file});
        }
    }

    if (!downloadfile) {
        return downloadfile;
    }

    try {
        await download(win, url, {
                directory: store.get('cs2Directory'),
                filename: file,
                onStarted: (handle) => {
                    log.info("download started");
                    win.webContents.send('handleDownloadFile', {status: 0, url: url, filename: file, fileSize: handle.getTotalBytes()});
                    updateCurrentDownloadItem(handle);
                },
                onProgress: (progress) => {
                    win.webContents.send('handleProgressDownloadFile', {url: url, filename: file, progress: progress.percent});
                },
                onCompleted: (downloadItem, downloadPath, error) => {
                    log.info("download completed");
                    win.webContents.send('handleDownloadFile', {status: 3, url: url, filename: file});
                },
                overwrite: true
            }
        );
    } catch (error) {
        if (error instanceof electronDl.CancelError) {
            log.info('item.cancel() was called');
        } else {
            log.error(error);
        }
    }

    return downloadfile;
}

let curDownloadItem = null;
const updateCurrentDownloadItem = (item) => {
    curDownloadItem = item;
}

async function downloadFiles(files) {
    // Wait 3.5 seconds
    await new Promise(r => setTimeout(r, 3500));
    const fastdlURL = getServerById(serverSelected).fastdl;
    // download file per file and wait until it's finished
    for (const file of files) {
        // Check if server info window is opened
        if (serverInfo) {
            const downloadNeeded = await downloadFile(fastdlURL, file);
            // wait 0.5 seconds per file if download is needed
            if (downloadNeeded) {
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }
}

function createSettingsWindow() {
    if (settingsWindow != null) {
        settingsWindow.focus();
        return;
    }
    settingsWindow = new BrowserWindow({
        width: 600,
        height: 270,
        autoHideMenuBar: true,
        parent: mainWindow,
        fullscreenable: false,
        resizable: false,
        backgroundColor: '#343841',
        webPreferences: {
            preload: SETTINGS_WINDOW_PRELOAD_WEBPACK_ENTRY
        },
    });

    settingsWindow.loadURL(SETTINGS_WINDOW_WEBPACK_ENTRY);

    settingsWindow.on('close', function () {
        settingsWindow = null;
    });
}

app.on('openSettingsWindow', () => { createSettingsWindow() });

function createAboutWindow() {
    // TODO: create about window
}

app.on('openAboutWindow', () => { createAboutWindow() });

async function loadServers(window) {
    await fetchServers().then((servers) => {
        addServers(servers);
        initRefreshServers();
    });
}

function addServers(servers) {
    for (const server of servers) {
        addServer(server);
    }
    mainWindow.webContents.send('handleServerList', serverList);
}

function addServer(server) {
    if (serverList.includes(server)) {
        return;
    }
    serverList.push(server);
}

function createServerInfoWindow() {
    if (serverInfo != null) {
        serverInfo.focus();
        return;
    }
    serverInfo = new BrowserWindow({
        width: 600,
        height: 377,
        autoHideMenuBar: true,
        parent: mainWindow,
        fullscreenable: false,
        resizable: false,
        backgroundColor: '#343841',
        webPreferences: {
            preload: SERVER_INFO_WINDOW_PRELOAD_WEBPACK_ENTRY
        },
    });

    // Disable server refreshing when server info window is open
    serverRefreshingEnabled = false;
    // Start refreshing server info
    initRefreshServer(serverSelected);

    serverInfo.loadURL(SERVER_INFO_WINDOW_WEBPACK_ENTRY);

    serverInfo.on('close', async function (e) {
        // Prevent window from closing with dialog
        e.preventDefault();
        const choice = await dialog.showMessageBox(
            this.serverInfo,
            {
              type: 'warning',
              buttons: ['Yes', 'No'],
              title: 'Confirm your actions',
              message: 'Are you sure you want to close the window?',
              detail: 'If the map is changed, it will not be downloaded automatically.\nYou should leave the window open until you finish playing on the server.',
            }
        );
        // If user clicks on No, we don't close the window
        if (choice.response > 0) {
            return;
        }
        // Close the window
        serverInfo.destroy();
        serverInfo = null;

        // Enable server refreshing when server info window is closed
        serverRefreshingEnabled = true;
        // Stop refreshing server info
        clearInterval(timerRefreshServer);
        // Stop downloading files
        if(curDownloadItem) {
            curDownloadItem.cancel();
        }
    });

    if (isDev()) {
        // Open the DevTools.
        serverInfo.openDevTools();
    }
}

function getServerById(serverIP) {
    for (const server of serverList) {
        if (server.id == serverIP) {
            return server;
        }
    }
}

function initRefreshServers() {
    setInterval(async () => {
        if (!serverRefreshingEnabled) {
            return;
        }
        // we go through the list of servers
        for (const server of serverList) {
            // we get the status of the server
            queryServer(server.ip);
            // wait 1 seconds per server
            await new Promise(r => setTimeout(r, 1000));
        }
    }, 5000);
}

async function refreshAllServers() {
    for (const server of serverList) {
        // we get the status of the server
        queryServer(server.ip);
        // wait 1 seconds per server
        await new Promise(r => setTimeout(r, 500));
    }
    mainWindow.webContents.send('handleRefreshServerListFinished', serverList);
}

function initRefreshServer(serverIP) {
    timerRefreshServer = setInterval(() => {
        queryServer(serverIP)
    }, 5000);
}

function queryServer(serverIP) {
    queryGameServerInfo(serverIP).then(infoResponse => {
        // send event to update server info on server list
        mainWindow.webContents.send('handleServerResponse', serverIP, infoResponse);
        // send event to update server info on server info window if it's open
        if (serverInfo != null) {
            serverInfo.webContents.send('handleServerResponse', serverIP, infoResponse);
        }
    }).catch((err) => {
        console.error(err);
    });
};

function isDev() {
    try {
        return process.mainModule.filename.indexOf('app.asar') === -1;
    } catch (e) {
        return false;
    }
}

async function checkGameIsAlreadyRunning() {
    log.info('Checking if game is already running');
    const gameRunning = checkProcessIsRunning('cs2.exe');

    if (gameRunning) {
        log.info('Game found');
        return true;
    }
    log.info('Game not found');
    return false;
}

function connectToTheServer(serverIP) {
    shell.openExternal('steam://connect/' + serverIP);
}