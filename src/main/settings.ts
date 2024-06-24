import { dialog, ipcMain } from 'electron';
import log from 'electron-log';
import path from 'path';
import fs from 'fs';
import { DataSettings } from '../models/settings';
import { ResponseElectron } from '../models/response';
import { loadSettings } from './settings-utils';

const dataFilePath = path.join(path.resolve(), 'settings.json');
export let currentSettingsGlobal: DataSettings = loadSettings(dataFilePath);

ipcMain.on('select-path-save-data', async (event, args) => {
  try {
    const response = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    event.reply('select-path-save-data', response.filePaths[0]);
  } catch (error) {
    log.error('Settings > Select directory error: ', error);
  }
});

ipcMain.on('save-settings', (event, args: DataSettings) => {
  const { folderPath, tmProxyKey } = args;

  const dataFilePath = path.join(path.resolve(), 'settings.json');
  let currentSettings: DataSettings = loadSettings(dataFilePath);
  currentSettings = {
    ...currentSettings,
    folderPath,
    tmProxyKey,
  };
  currentSettingsGlobal = {
    ...currentSettingsGlobal,
    folderPath,
    tmProxyKey,
  };
  currentSettingsGlobal['folderPath'] = folderPath;
  fs.writeFileSync(dataFilePath, JSON.stringify(currentSettings, null, 2));

  event.reply('save-settings', {
    status: 'success',
    message: 'Lưu thông tin cài đặt thành công!',
  } as ResponseElectron);
});

ipcMain.on('get-settings', (event, args) => {
  const dataFilePath = path.join(path.resolve(), 'settings.json');
  let currentSettings: DataSettings = loadSettings(dataFilePath);
  event.reply('get-settings', currentSettings);
});
