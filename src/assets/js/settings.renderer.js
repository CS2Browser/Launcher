import 'bootstrap';
import './../../scss/app.scss';

let steamExecutableField = document.getElementById('steamExecutable');
let cs2DirectoryField = document.getElementById('cs2Directory');
const saveSettingsButton = document.getElementById('saveSettings');

const loadFields = async () => {
  const steamExecutable = await window.settingsAPI.steamExecutable();
  const cs2Directory = await window.settingsAPI.cs2Directory();
  steamExecutableField.value = steamExecutable;
  cs2DirectoryField.value = cs2Directory;
}
loadFields();

saveSettingsButton.addEventListener('click', () => {
  window.settingsAPI.saveSettings(steamExecutableField.value, cs2DirectoryField.value);
});