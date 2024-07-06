import { ipcMain, shell } from 'electron';

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});
