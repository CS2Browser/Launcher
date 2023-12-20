window.serverInfoAPI.handleServerPlayerResponse((event, serverIP, playerList) => {
    vueInstance.server.playerList = playerList.players;
});

window.serverInfoAPI.handleServerResponse((event, serverIP, serverResponse) => {
  vueInstance.server.map = serverResponse.map;
  vueInstance.server.players = serverResponse.players;
  vueInstance.server.maxPlayers = serverResponse.maxPlayers;
  vueInstance.server.name = serverResponse.name;
  vueInstance.server.appId = serverResponse.appId;
});

var vueInstance = new Vue({
    el: '#serverinfoapp',
    data: {
      message: 'Hello Vue!',
      server: {
        hostname: null,
        ip: null,
        map: null,
        players: null,
        maxPlayers: null,
        appId: null,
        playerList: [],
      },
    },
    methods: {
        formatDuration(duration) {
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(0).toString().padStart(2, '0')}`;
        }
    }
});