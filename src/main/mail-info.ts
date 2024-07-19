import { ipcMain } from 'electron';
import path from 'path';
import { MailInfo, MailInfoServer, ResGetMail } from '../models/mail';
import { loadJSONFile } from '../utils/load-file';
import { writeFileSync } from 'fs';
import log from 'electron-log';
import { updateMailInfo } from './util/mail-info-utils';
import { apiInstance } from '../plugin/apiInstance';

ipcMain.on('get-list-mail', async (event, args) => {
  const { currentPage, pageSize } = args;
  try {
    const response = await apiInstance.get('mails', {
      params: { page: currentPage, pageSize },
    });
    const data: MailInfoServer[] = response.data.mails;

    const listMail: MailInfo[] = data.map((mail, index) => {
      return {
        key: (currentPage - 1) * pageSize + (index + 1),
        id: mail.id,
        mail: mail.address,
        password: mail.password,
        recoverMail: mail.recover_mail,
        status: mail.status,
        video_links: mail.video_links,
      };
    });

    event.reply('get-list-mail', {
      mails: listMail,
      currentPage: currentPage,
      totalPages: response.data.totalPages,
      totalMails: response.data.totalMails,
    } as ResGetMail);
  } catch (e) {
    log.error('Get list mail info error: ', e);
  }
});

ipcMain.on('add-multiple-mail', async (event, listMailInfo: MailInfo[]) => {
  const listMailAdd = listMailInfo.map((mail) => {
    return {
      address: mail.mail,
      password: mail.password,
      recover_mail: mail.recoverMail,
      video_links: [],
    };
  });

  try {
    const response = await apiInstance.post('mails', { mailInfo: listMailAdd });
    log.info('Add mail response: ', response);
  } catch (err) {
    log.error('Add mail to server error: ', err);
  }

  event.reply('add-multiple-mail');
});

ipcMain.on('delete-mail', (event, mailInfo: MailInfo) => {
  const dataFilePath = path.join(path.resolve(), 'Data-JSON/mail-info.json');
  let listMail: MailInfo[] = loadJSONFile(dataFilePath) || [];
  listMail = listMail.filter((mail) => mail.mail !== mailInfo.mail);
  writeFileSync(dataFilePath, JSON.stringify(listMail, null, 2));
  event.reply('delete-mail', listMail);
});

ipcMain.on('get-link-video-mail', (event, mail) => {
  const dataFilePath = path.join(
    path.resolve(),
    'Data-JSON/uploaded-channel.json',
  );
  let mailMap: Record<string, Array<string>> = loadJSONFile(dataFilePath) || {};
  event.reply('get-link-video-mail', mailMap[mail]);
});

ipcMain.on('update-mail', async (event, mailInfo: MailInfo) => {
  try {
    const newListMail = await updateMailInfo(mailInfo);
    event.reply('update-mail', newListMail);
  } catch (e) {
    log.error('Update mail info error: ', e);
  }
});
