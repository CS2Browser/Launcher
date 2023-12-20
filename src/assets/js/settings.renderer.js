import 'bootstrap';
import './../../scss/app.scss';

let steamExecutableField = document.getElementById('steamExecutable');
let cs2DirectoryField = document.getElementById('cs2Directory');
const saveSettingsButton = document.getElementById('saveSettings');
let cs2ServerListUrlField = document.getElementById('cs2ServerListUrl');
let autoDownloadAssetsField = document.getElementById('autoDownloadAssets');

const loadFields = async () => {
  const steamExecutable = await window.settingsAPI.steamExecutable();
  const cs2Directory = await window.settingsAPI.cs2Directory();
  const cs2ServerListUrl = await window.settingsAPI.cs2ServerListUrl();
  const autoDownloadAssets = await window.settingsAPI.autoDownloadAssets();

  steamExecutableField.value = steamExecutable;
  cs2DirectoryField.value = cs2Directory;
  cs2ServerListUrlField.value = cs2ServerListUrl;
  autoDownloadAssetsField.checked = autoDownloadAssets;
}
loadFields();

saveSettingsButton.addEventListener('click', () => {
  window.settingsAPI.saveSettings(steamExecutableField.value, cs2DirectoryField.value, cs2ServerListUrlField.value, autoDownloadAssetsField.checked);
});