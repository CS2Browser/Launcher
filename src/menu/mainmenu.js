const { Menu } = require('electron')
const electron = require('electron')
const app = electron.app

const template = [
  {
    label: 'Settings',
    click: function() {
      app.emit('openSettingsWindow');
    }
  },
  {
    label: "About",
    click: function() {
      app.emit('openAboutWindow');
    }
  }
]

module.exports.mainMenu = Menu.buildFromTemplate(template);