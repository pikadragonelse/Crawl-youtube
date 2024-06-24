import { execSync } from 'child_process';
import { ipcMain } from 'electron';
import path from 'path';
import { UploadVideoArgs } from '../models/upload-video';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { createProfile, fakeLocation } from '../utils/profile';
import { ProfileItem } from '../models/profile';
import puppeteer from 'puppeteer';
import axios from 'axios';
import { currentSettingsGlobal } from './settings';
import { parseProxyModel } from '../utils/proxy';
import log from 'electron-log';
import { loginYoutube } from '../utils/login-youtube';
import { uploadVideo } from '../utils/upload-video';
import { getVideoOfChannel } from './manage-page';
import { sleep } from './util';
import { loadSettings } from './settings-utils';
import { MailInfo } from '../models/mail';

const APP_DATA_PATH = execSync('echo %APPDATA%').toString().trim();

export const getProxy = async () => {
  try {
    let resp = await axios.post(
      `https://tmproxy.com/api/proxy/get-new-proxy`,
      {
        api_key: currentSettingsGlobal.tmProxyKey,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return resp.data.data.https;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

const runProcessUpload = async (
  profile: ProfileItem,
  profilePath: string,
  pathToExtension: string,
  channelName: string,
  mail: MailInfo,
) => {
  await fakeLocation(profile, true);

  const browser = await puppeteer.launch({
    userDataDir: profilePath,
    args: [
      `--window-size=900,800`,
      `--window-position=${profile.position}`,
      `--proxy-server=http://${profile.proxy}`,
      `--load-extension=${pathToExtension}`,
    ],
    headless: false,

    ignoreDefaultArgs: ['--enable-automation'],
    ignoreHTTPSErrors: true,
    executablePath: `${path.join(path.resolve(), 'Data/Chrome/chrome.exe')}`,
  });

  const dataFilePath = path.join(path.resolve(), 'uploaded-channel.json');
  let mapHistoryUploadChannel: Record<string, number> =
    loadSettings(dataFilePath);
  if (mapHistoryUploadChannel[channelName] === undefined) {
    mapHistoryUploadChannel[channelName] = 0;
  }

  browser.on('disconnected', () => {
    console.log('Browser has been closed or disconnected');
    writeFileSync(
      dataFilePath,
      JSON.stringify(mapHistoryUploadChannel, null, 2),
    );
  });

  const page = await browser.newPage();
  page.setViewport({ width: 900, height: 800 });
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(60000);

  try {
    await loginYoutube(page, mail);
    const listVideo = getVideoOfChannel(channelName);

    if (listVideo != null) {
      for (
        ;
        mapHistoryUploadChannel[channelName] < listVideo?.length;
        mapHistoryUploadChannel[channelName]++
      ) {
        const video = listVideo[mapHistoryUploadChannel[channelName]];
        await uploadVideo(page, video.videoPath, video.title);
        await sleep(5000);
      }
    }
    await browser.close();
  } catch (error) {
    console.log(error);
  }
};

ipcMain.on('upload-video', async (event, args: UploadVideoArgs) => {
  const { mail, channelName } = args;
  const rootPath = path.join(APP_DATA_PATH, 'Youtube-Profiles');
  if (!existsSync(rootPath)) {
    mkdirSync(rootPath);
  }
  const PROFILE_PATH = path.join(
    APP_DATA_PATH,
    'Youtube-Profiles/' + mail.mail,
  );
  const pathToExtension = path.join(
    path.resolve(),
    'Data/Extension/always_active',
  );

  let proxy = await getProxy();

  while (proxy === null || proxy === '' || proxy === undefined) {
    event.reply('upload-video', { message: 'Wait to get new proxy' });
    await sleep(30000);
    proxy = await getProxy();
    log.info('Wait to get new proxy');
  }

  if (existsSync(PROFILE_PATH)) {
    log.info('Exist profile: ');

    const profile: ProfileItem = {
      email: mail.mail,
      proxy: proxy,
      parsedProxy: parseProxyModel(proxy, 'http'),
    };

    await runProcessUpload(
      profile,
      PROFILE_PATH,
      pathToExtension,
      channelName,
      mail,
    );
  } else {
    log.info('Dont exist profile: ');
    const profile = await createProfile(mail.mail);

    if (profile != null) {
      profile.proxy = proxy;
      profile.parsedProxy = parseProxyModel(proxy, 'http');

      await runProcessUpload(
        profile,
        PROFILE_PATH,
        pathToExtension,
        channelName,
        mail,
      );
    }
  }
});
