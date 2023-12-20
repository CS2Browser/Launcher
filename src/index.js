const axios = require('axios');
import "@fortawesome/fontawesome-free/js/all";

$('.table').on('click', 'tbody tr', function(event) {
    $(this).addClass('highlight').siblings().removeClass('highlight');
});

const enterServerStatusElem = document.getElementById('enterServerStatus');
const serverListMain = document.getElementById('serverListMain');
const serverListElem = document.getElementById('serverList');
const refreshServerListElem = document.getElementById('refreshServerList');
const chevronDown = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">\
<path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>\
</svg>';
const chevronUp = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">\
<path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>\
</svg>';

window.electronAPI.handleServerList((event, servers, serverListSorter, sortDesc) => {
    vueInstance.serverListInfo = servers;
    //const tbody = serverListElem.getElementsByTagName('tbody')[0];
    //tbody.innerHTML = '';
    //
    //servers.forEach(server => {
    //    const row = tbody.insertRow();
    //    // add id to row
    //    row.id = server.id;
    //    const hostnameCell = row.insertCell(0);
    //    const mapCell = row.insertCell(1);
    //    const playersCell = row.insertCell(2);
    //    hostnameCell.innerText = server.hostname;
    //    mapCell.innerText = server.map;
    //    playersCell.innerText = server.players + '/' + server.maxPlayers;
    //    // add classes to cells
    //    hostnameCell.classList.add('columnHostname');
    //    mapCell.classList.add('columnMap');
    //    playersCell.classList.add('columnPlayers');
    //});
//
    ////check serverListSorter
    //let headerElem;
    //switch (serverListSorter) {
    //    case 'hostname':
    //        headerElem = serverListSortByServerElem;
    //        break;
    //    case 'map':
    //        headerElem = serverListSortByMapElem;
    //        break;
    //    case 'players':
    //        headerElem = serverListSortByPlayersElem;
    //        break;
    //}
    //if (!headerElem) {
    //    return;
    //}
//
    ////find all .chevron
    //const chevrons = document.querySelectorAll('.chevron');
    //chevrons.forEach(chevron => {
    //    chevron.innerHTML = '';//remove chevron
    //});
    //const chevron = headerElem.querySelector('.chevron');
    ////add chevron
    //chevron.innerHTML = sortDesc ? chevronDown : chevronUp;
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

var vueInstance = new Vue({
  el: '#vueapp',
  data: {
    serverListInfo: [],
    currentlySelectedServer: null,
    filterText: '',
    filterTypes: [
        'hostname',
        'map'
    ],
    filterType: 'hostname',
    serverListSorter: 'players',
  },
  watch: {
    filterText: function (newFilterText) {
      window.electronAPI.filterServerList(newFilterText, this.filterType);
    },
    filterType: function (newFilterType) {
      window.electronAPI.filterServerList(this.filterText, newFilterType);
    }
  },
  methods: {
    highlightOrNot: function(server) {
        return this.currentlySelectedServer !== null && server.id === this.currentlySelectedServer.id ? 'highlight' : '';
    },
    selectServer: function(event, server) {
        window.electronAPI.selectServer(server.id);
        enterServerStatusElem.disabled = false;
        this.currentlySelectedServer = server;
    },
    doubleClickHandler: function(event, server) {
        window.electronAPI.selectServer(server.id);
        window.electronAPI.openServerInfo();
    },
    changeServerListSorter: function(sortBy) {
        this.serverListSorter = sortBy;
        window.electronAPI.changeServerListSorter(sortBy);
    }
  }
});