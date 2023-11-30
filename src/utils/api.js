import fetch from 'node-fetch';

async function fetchServers() {
    return await fetch('https://raw.githubusercontent.com/CS2Browser/Launcher/main/SERVERLIST.json' + "?nocache=" + (new Date).getTime())
        .then(res => res.json())
        .then(json => {
            return json['servers'];
        });
}

export { fetchServers };