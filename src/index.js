const axios = require('axios');
import "@fortawesome/fontawesome-free/js/all";

$('.table').on('click', 'tbody tr', function(event) {
    $(this).addClass('highlight').siblings().removeClass('highlight');
});

const enterServerStatusElem = document.getElementById('enterServerStatus');
const serverListMain = document.getElementById('serverListMain');
const serverListElem = document.getElementById('serverList');
const refreshServerListElem = document.getElementById('refreshServerList');
const serverListSortByServerElem = document.getElementById('serverListSortByServer');
const serverListSortByMapElem = document.getElementById('serverListSortByMap');
const serverListSortByPlayersElem = document.getElementById('serverListSortByPlayers');
const filterTextElem = document.getElementById('filterText');
const filterTypeElem = document.getElementById('filterType');
const chevronDown = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">\
<path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>\
</svg>';
const chevronUp = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">\
<path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>\
</svg>';

window.electronAPI.handleServerList((event, servers, serverListSorter, sortDesc) => {
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
        mapCell.innerText = server.map;
        playersCell.innerText = server.players + '/' + server.maxPlayers;
        // add classes to cells
        hostnameCell.classList.add('columnHostname');
        mapCell.classList.add('columnMap');
        playersCell.classList.add('columnPlayers');
    });

    //check serverListSorter
    let headerElem;
    switch (serverListSorter) {
        case 'hostname':
            headerElem = serverListSortByServerElem;
            break;
        case 'map':
            headerElem = serverListSortByMapElem;
            break;
        case 'players':
            headerElem = serverListSortByPlayersElem;
            break;
    }
    if (!headerElem) {
        return;
    }

    //find all .chevron
    const chevrons = document.querySelectorAll('.chevron');
    chevrons.forEach(chevron => {
        chevron.innerHTML = '';//remove chevron
    });
    const chevron = headerElem.querySelector('.chevron');
    //add chevron
    chevron.innerHTML = sortDesc ? chevronDown : chevronUp;
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

//handle when clicking on the sort by server button
serverListSortByServerElem.addEventListener('click', () => {
    window.electronAPI.changeServerListSorter('hostname');
});

//handle when clicking on the sort by map button
serverListSortByMapElem.addEventListener('click', () => {
    window.electronAPI.changeServerListSorter('map');
});

//handle when clicking on the sort by players button
serverListSortByPlayersElem.addEventListener('click', () => {
    window.electronAPI.changeServerListSorter('players');
});

filterTextElem.addEventListener('input', () => {
    window.electronAPI.filterServerList(filterTextElem.value, filterTypeElem.value);
});

filterTypeElem.addEventListener('change', () => {
    window.electronAPI.filterServerList(filterTextElem.value, filterTypeElem.value);
});

window.electronAPI.handleRefreshServerListFinished((event, servers) => {
    $('#refreshIcon').removeClass('fa-spin');
});

serverListMain.addEventListener("scroll", (event) => {
    // get the visible rows on table
    serverListElem.querySelectorAll("tbody tr").forEach((row) => {
        // get the row position
        const rowPos = row.getBoundingClientRect();
        // if the row is visible, add the class "visible"
        if (rowPos.top >= 0 && rowPos.bottom <= serverListElem.offsetHeight) {
            window.electronAPI.serverVisible(row.id, true);
        } else {
            window.electronAPI.serverVisible(row.id, false);
        }
    });
});