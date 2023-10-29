import 'bootstrap';
import './../../scss/app.scss';
const axios = require('axios');

// click button downloadAssets
const downloadAssetsButton = document.getElementById('downloadAssets');
const launchGameButton = document.getElementById('launchGame');
const outputDownloadProcess = document.getElementById('outputDownloadProcess');
const downloadProcessBar = document.getElementById('downloadProcessBar');
const downloadFileProcessBar = document.getElementById('downloadFileProcessBar');

const { allowedExtensions } = require('./../../utils/globals.js');

const serverSelected = await window.serverInfoAPI.serverSelected();
const steamExecutable = await window.serverInfoAPI.steamExecutable();
const cs2Directory = await window.serverInfoAPI.cs2Directory();

let files = [];
let countFiles = 1;
let totalFiles = 0;
let barProcess = 0;

let mapsChecked = [];

let downloadMap = false;
let alreadyDownloading = false;
let assetsAlreadyChecked  = false;
let launchGameOnFinish = false;

function log(type, message) {
    window.serverInfoAPI.log(type, message);
}

// click button downloadAssets
downloadAssetsButton.addEventListener('click', () => {
    launchAssetsDownload();
});

launchGameButton.addEventListener('click', async () => {
    log('info', 'click on launchGameButton');
    // if already downloading, return
    if (alreadyDownloading) {
        log('info', 'Already downloading, return');
        return;
    }

    // if steam executable is not set or cs2 directory is not set, return
    if (!steamExecutable || !cs2Directory) {
        log('info', 'Steam executable or CS2 directory not set, return');
        return;
    }

    const gameIsAlreadyRunning = await window.serverInfoAPI.gameIsAlreadyRunning();
    log('info', 'gameIsAlreadyRunning: ' + gameIsAlreadyRunning);

    // if assets not checked, return
    if (!assetsAlreadyChecked) {
        log('info', 'Assets not checked');
        launchAssetsDownload();
        launchGameOnFinish = true;
        log('info', 'launchGameOnFinish: ' + launchGameOnFinish);
    } else {
        if (gameIsAlreadyRunning) {
            log('info', 'Game is already running, connecting to server');
            window.serverInfoAPI.connectToServer(serverSelected.ip);
        } else {
            log('info', 'Game is not running, launching game');
            window.serverInfoAPI.launchGame(serverSelected.ip);
        }
    }
});

function loadFastdlData(fastdlURL) {
    log('info', 'Loading FastDL data');

    axios.get(fastdlURL + serverSelected.ip + '.txt' + "?nocache=" + (new Date).getTime())
    .then(response => {
        // Check if is valid a TXT file
        if (response.data) {
            // Check if the TXT file is empty
            if (response.data.length === 0) {
                console.log('TXT file is empty');
                return;
            }

            // Load files, every line is a file, exclude if line start with character different to letter
            const filesTXT = response.data.split('\n').filter(line => line.match(/^[a-zA-Z]/));

            // Remove break lines and spaces
            for (const fileTXT of filesTXT) {
                filesTXT[filesTXT.indexOf(fileTXT)] = fileTXT.replace(/\r?\n|\r/g, '').trim();
            }

            files = [];
            // Check if files field has the required fields
            for (const fileTXT of filesTXT) {
                // We filter out files that are not in the list of allowed extensions
                if (allowedExtensions.includes(fileTXT.split('.').pop())) {
                    files.push(fileTXT);
                }
            }

            countFiles = 1;
            totalFiles = files.length;

            window.serverInfoAPI.downloadFiles(files);
        }
    })
    .catch(error => {
        console.error('There was a problem with the request:', error);
    });
}

function CheckIfMapIsDownloaded(mapName) {
    const mapFile =  'maps/' + mapName + ".vpk";
    window.serverInfoAPI.downloadFile(serverSelected.fastdl, mapFile);
    mapsChecked.push(mapName);
}

window.serverInfoAPI.handleDownloadFile(async (event, value) => {
    /*
    * 0 = Download started
    * 2 = Already downloaded
    * 3 = Download complete
    */

    const filename = value.filename;
    const status = value.status;
    let filesize = value.fileSize | 0;
    // bytes to kb
    filesize = Math.round(filesize / 1024);
    // if is more than 1mb, convert to mb
    if (filesize > 1024) {
        filesize = Math.round(filesize / 1024) + "MB";
    } else {
        filesize = filesize + "KB";
    }

    if (status > 1) {
        countFiles++;
        barProcess = Math.round((countFiles / totalFiles) * 100);
    }

    log('info', countFiles + ' ' + totalFiles + ' ' + barProcess);

    log('info', filename + ' ' + status);
    if (status == 0) {
        setStatus(filename, `${filesize} downloading...`);
    } else if (status == 2) {
        setStatus(filename, "already downloaded");
    } else if (status == 3) {
        setStatus(filename, "download complete");
    }

    // when all files are downloaded, we can download the map
    if (countFiles >= totalFiles) {
        log('info', 'All files downloaded');
        downloadMap = true;
        assetsAlreadyChecked = true;
        setAlreadyDownloading(false);
        // launch game if JOIN button was pressed
        if (launchGameOnFinish) {
            log('info', 'Launchng game on finish');
            launchGameOnFinish = false;
            window.serverInfoAPI.launchGame(serverSelected.ip);
        }
    }

    // if download file is a map, reconnect to the server if the game is already running
    if (filename.includes('maps/')) {
        if (status == 3 && assetsAlreadyChecked) {
            const gameIsAlreadyRunning = await window.serverInfoAPI.gameIsAlreadyRunning();
            if (gameIsAlreadyRunning) {
                window.serverInfoAPI.connectToServer(serverSelected.ip);
            }
        }
    }
});

window.serverInfoAPI.handleProgressDownloadFile((event, value) => {
    downloadFileProcessBar.style.width = (value.progress * 100) + "%";
});

function setStatus(filename = "", message = "") {
    if (outputDownloadProcess.value.length == 1) {
        outputDownloadProcess.value = "";
    }
    
    // fileDownloadingLabel.innerText = filename;
    
    if (barProcess > 100) {
        barProcess = 100;
    }
    downloadProcessBar.style.width = barProcess + "%";
    downloadProcessBar.innerText = barProcess + "%";

    // Add new line to textarea and scroll to bottom
    outputDownloadProcess.value += filename + " " + message + "\n";
    outputDownloadProcess.scrollTop = outputDownloadProcess.scrollHeight;
}

window.serverInfoAPI.handleServerResponse((event, serverIP, serverResponse) => {
    // wait until downloads are complete
    // if (!downloadMap) {
    //     return;
    // }

    // if steam executable is not set or cs2 directory is not set, return
    if (!steamExecutable || !cs2Directory) {
        log('info', 'Steam executable or CS2 directory not set');
        return;
    }

    serverSelected.status = serverResponse;
    // we need to check if the map is already checked
    if (mapsChecked.includes(serverSelected.status.map)) {
        return;
    }
    CheckIfMapIsDownloaded(serverSelected.status.map);
});

function launchAssetsDownload() {
    // if already downloading, return
    if (alreadyDownloading) {
        log('info', 'Already downloading');
        return;
    }

    // if steam executable is not set or cs2 directory is not set, return
    if (!steamExecutable || !cs2Directory) {
        log('info', 'Steam executable or CS2 directory not set');
        return;
    }

    setAlreadyDownloading(true);

    downloadProcessBar.style.width = "0%";
    downloadProcessBar.innerText = "0%";
    downloadFileProcessBar.style.width = "0%";
    // window.serverInfoAPI.downloadAssets(serverSelected);
    loadFastdlData(serverSelected.fastdl);
}

function setAlreadyDownloading(value) {
    alreadyDownloading = value;
    log('info', 'SetAlreadyDownloading: ' + value);
    // disable assets button
    downloadAssetsButton.disabled = value;
}