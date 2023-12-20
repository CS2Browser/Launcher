import fetch from 'node-fetch';

var serverListUrl = 'https://raw.githubusercontent.com/CS2Browser/Launcher/main/SERVERLIST.json';

async function fetchServers() {
    return await fetch(serverListUrl + "?nocache=" + (new Date).getTime())
        .then(res => res.json())
        .then(json => {
            return json['servers'];
        });
}

//make getter and setter for serverListUrl
function setServerListUrl(url) {
    serverListUrl = url;
}

export { fetchServers, serverListUrl, setServerListUrl };