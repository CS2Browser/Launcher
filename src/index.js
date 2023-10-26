const axios = require('axios');
import "@fortawesome/fontawesome-free/js/all";

$('.table').on('click', 'tbody tr', function(event) {
    $(this).addClass('highlight').siblings().removeClass('highlight');
});

const enterServerStatusElem = document.getElementById('enterServerStatus');
const serverListElem = document.getElementById('serverList');
const refreshServerListElem = document.getElementById('refreshServerList');

window.electronAPI.handleServerList((event, servers) => {
    // populate table with json of servers
    const tbody = serverListElem.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    servers.forEach(server => {
        const row = tbody.insertRow();
        // add id to row
        row.id = server.id;
        const hostnameCell = row.insertCell(0);
        const mapCell = row.insertCell(1);
        const playersCell = row.insertCell(2);
        hostnameCell.innerText = server.hostname;
        mapCell.innerText = '';
        playersCell.innerText = 'loading...';
        // add classes to cells
        hostnameCell.classList.add('columnHostname');
        mapCell.classList.add('columnMap');
        playersCell.classList.add('columnPlayers');
    });
});

window.electronAPI.handleServerResponse((event, serverIP, serverResponse) => {
    const tbody = serverListElem.getElementsByTagName('tbody')[0];
    const row = document.getElementById(serverIP) ? document.getElementById(serverIP) : tbody.insertRow();
    row.id = serverIP;
    row.onclick = ClickOnServerRow(row);

    const hostnameCell = row.getElementsByTagName('td')[0] ? row.getElementsByTagName('td')[0] : row.insertCell(0);
    const mapCell = row.getElementsByTagName('td')[1] ? row.getElementsByTagName('td')[1] : row.insertCell(1);
    const playersCell = row.getElementsByTagName('td')[2] ? row.getElementsByTagName('td')[2] : row.insertCell(2);

    hostnameCell.innerText = serverResponse.name;
    mapCell.innerText = serverResponse.map;
    playersCell.innerText = serverResponse.players + '/' + serverResponse.maxPlayers;
});

enterServerStatusElem.addEventListener('click', () => {
    openServerInfo();
});

// Detect double click on server row
function ClickOnServerRow(row) {
    var clicks = 0, timeout;
    return function() {
        clicks++;
        if (clicks == 1) {
            timeout = setTimeout(function() { clicks = 0; }, 400);
        } else {
            timeout && clearTimeout(timeout);
            openServerInfo();
            clicks = 0;
        }
    };
}

serverListElem.addEventListener("click", function() {
    if (!document.querySelector(".highlight")) {
        return;
    }
    window.electronAPI.selectServer(document.querySelector(".highlight").id);
    enterServerStatusElem.disabled = false;
});

function openServerInfo() {
    window.electronAPI.openServerInfo();
}

refreshServerListElem.addEventListener('click', () => {
    $('#refreshIcon').addClass('fa-spin');
    window.electronAPI.refreshServerList();
});

window.electronAPI.handleRefreshServerListFinished((event, servers) => {
    $('#refreshIcon').removeClass('fa-spin');
});