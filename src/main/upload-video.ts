import { execSync } from 'child_process';
import { IpcMainEvent, ipcMain, screen } from 'electron';
import path from 'path';
import { UploadVideoArgs } from '../models/upload-video';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { createProfile, fakeLocation } from '../utils/profile';
import { ProfileItem } from '../models/profile';
import puppeteer from 'puppeteer';

import axios from 'axios';
import { currentSettingsGlobal } from './settings';
import { parseProxyModel, stringifyProxy } from '../utils/proxy';
import log from 'electron-log';
import { loginYoutube } from '../utils/login-youtube';
import { uploadVideo } from '../utils/upload-video';
import { getVideoOfChannel } from './manage-page';
import { sleep } from './util';
import { MailInfo } from '../models/mail';
import { loadJSONFile } from '../utils/load-file';
import { VideoInfo } from '../models/manage-page';
import fs from 'fs';
import { updateMailInfo } from './util/mail-info-utils';
import { getNextPosition } from '../utils/window-position';
import { generateString } from '../utils/generate-string';

const APP_DATA_PATH = execSync('echo %APPDATA%').toString().trim();
// puppeteer.use(StealthPlugin());
let messageTMProxy = '';
let codeResTMproxy = 0;

export const getProxy: (
  typeProxy: 'ip2world' | 'tmproxy',
) => Promise<string | undefined> = async (typeProxy) => {
  log.info(
    currentSettingsGlobal.proxy.link,
    currentSettingsGlobal.proxy.password,
  );

  switch (typeProxy) {
    case 'ip2world': {
      return `${currentSettingsGlobal.proxy.link}-${generateString(12)}-sessTime-60:${currentSettingsGlobal.proxy.password}`;
    }
    case 'tmproxy': {
      const runGet = async () => {
        try {
          let resp = await axios.post(
            `https://tmproxy.com/api/proxy/get-new-proxy`,
            {
              api_key: currentSettingsGlobal.proxy.key,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
          messageTMProxy = resp.data.message;
          codeResTMproxy = resp.data.code;

          return resp.data.data.https;
        } catch (e) {
          log.info(e);
          return undefined;
        }
      };
      return await runGet();
    }
    default: {
      return undefined;
    }
  }
};

const getListVideoByListId = (listVideoId: string[], channelName: string) => {
  const listVideo: VideoInfo[] = [];
  const { folderPath } = currentSettingsGlobal;
  const channelsPath = path.join(
    folderPath !== '' && folderPath != null ? folderPath : path.resolve(),
    'channels',
  );
  const channelPath = path.join(channelsPath, channelName);
  const videosPath = path.join(channelPath, 'videos');
  listVideoId.map((id) => {
    const videoPath = path.join(videosPath, id);
    const videoInfoPath = path.join(videoPath, `${id}.txt`);

    if (
      fs.existsSync(videoInfoPath) &&
      fs.existsSync(path.join(videoPath, `full-${id}.mp4`))
    ) {
      const title = fs.readFileSync(videoInfoPath, 'utf8');
      listVideo.push({
        id: id,
        title,
        thumbnailPath: '',
        videoPath: path.join(videoPath, `full-${id}.mp4`),
        videoLinkToShow: '',
        duration: 0,
      });
    } else {
      log.error(
        `Không tìm thấy đủ thông tin cho video ID ${id} trong kênh ${channelName}`,
      );
      return null;
    }
  });
  return listVideo;
};

const runProcessUpload = async (
  event: IpcMainEvent,
  profile: ProfileItem,
  profilePath: string,
  pathToExtension: string,
  channelName: string,
  mail: MailInfo,
  type: 'byId' | 'full' = 'full',
  listVideoId: string[] = [],
) => {
  log.info('Profile info: ', profile);

  try {
    await fakeLocation(profile, true);
  } catch (error) {
    log.error('Fake location error: ', error);
    event.reply('upload-video', {
      message: `Thử lại sau vài giây, nếu không được vui lòng kiểm tra lại thông tin proxy và thử lại!`,
    });
    return;
  }

  const browser = await puppeteer.launch({
    userDataDir: profilePath,
    args: [
      `--window-size=900,800`,
      `--window-position=${profile.position}`,
      `--proxy-server=http://${profile.parsedProxy != null ? profile.parsedProxy.ip : ''}:${profile.parsedProxy != null ? profile.parsedProxy.port : ''}`,
      `--load-extension=${pathToExtension}`,
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    headless: false,
    ignoreHTTPSErrors: true,
    executablePath: `${path.join(path.resolve(), 'Data/Chrome/chrome.exe')}`,
  });

  const page = await browser.newPage();

  await page.authenticate({
    username: profile.parsedProxy?.username || '',
    password: profile.parsedProxy?.password || '',
  });
  page.setViewport({ width: 900, height: 600 });
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);

  if (type !== 'byId') {
    const dataFilePath = path.join(
      path.resolve(),
      'Data-JSON/uploaded-channel.json',
    );
    let mailMap: Record<string, Record<string, number>> = loadJSONFile(
      dataFilePath,
    ) || {};

    const historyUploadOfMail: Record<string, number> = mailMap[mail.mail];
    if (historyUploadOfMail[channelName] === undefined) {
      historyUploadOfMail[channelName] = 0;
    }

    browser.on('disconnected', () => {
      log.info('Browser has been closed or disconnected');
      writeFileSync(dataFilePath, JSON.stringify(mailMap, null, 2));
    });

    try {
      await loginYoutube(page, mail);

      const listVideo = getVideoOfChannel(channelName);

      if (historyUploadOfMail[channelName] === listVideo?.length) {
        log.info('All videos have been uploaded');
        await browser.close();
        return;
      }

      if (listVideo != null) {
        for (
          ;
          historyUploadOfMail[channelName] <
          currentSettingsGlobal.quantityUpload;
          historyUploadOfMail[channelName]++
        ) {
          if (historyUploadOfMail[channelName] === listVideo?.length) {
            log.info('All videos have been uploaded');
            await browser.close();
            return;
          }
          const video = listVideo[historyUploadOfMail[channelName]];
          await uploadVideo(page, video.videoPath, video.title, channelName);
          await sleep(5000);
        }
      }
      await browser.close();
    } catch (error) {
      log.error(error);
    }
  } else {
    try {
      const message = await loginYoutube(page, mail);
      if (message === 'mail dead') {
        await browser.close();
        mail.status = 'dead';
        updateMailInfo(mail);
        event.reply('reload-list-mail');
        return;
      }
      const listVideo = getListVideoByListId(listVideoId, channelName);

      if (listVideo != null) {
        for (let index = 0; index < listVideo.length; index++) {
          if (index === listVideo?.length) {
            log.info('All videos have been uploaded');
            await browser.close();
            return;
          }
          const video = listVideo[index];
          const message = await uploadVideo(
            page,
            video.videoPath,
            video.title,
            mail.mail,
          );
          if (message === 'mail dead') {
            await browser.close();
            mail.status = 'dead';
            updateMailInfo(mail);
            event.reply('reload-list-mail');
            return;
          } else if (message === 'unclickable') {
            await browser.close();
            mail.status = 'errorUploading';
            updateMailInfo(mail);
            event.reply('reload-list-mail');
            return;
          }
          await sleep(5000);
        }
      }
      await browser.close();
      mail.status = 'uploaded';
      updateMailInfo(mail);
      event.reply('reload-list-mail');
    } catch (error) {
      log.error(error);
    }
  }
};

ipcMain.on('upload-video', async (event, args: UploadVideoArgs) => {
  const { mail, channelName, type, listVideoId, multipleUpload, listMail } =
    args;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  let [x, y] = [0, 0];

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
  let proxyKey = await getProxy(currentSettingsGlobal.proxy.type);
  if (proxyKey != null && proxyKey != '') {
    if (multipleUpload !== true) {
      const proxy = proxyKey;

      if (existsSync(PROFILE_PATH)) {
        log.info('Exist profile: ');

        [x, y] = getNextPosition(x, y, width, height);
        const profile: ProfileItem = {
          email: mail.mail,
          proxy: proxy,
          parsedProxy: parseProxyModel(proxy, 'http'),
          position: `${x},${y}`,
        };
        if (type === 'byId') {
          await runProcessUpload(
            event,
            profile,
            PROFILE_PATH,
            pathToExtension,
            channelName,
            mail,
            type,
            listVideoId,
          );
        } else {
          await runProcessUpload(
            event,
            profile,
            PROFILE_PATH,
            pathToExtension,
            channelName,
            mail,
          );
        }
      } else {
        log.info('Dont exist profile: ');
        const profile = await createProfile(mail.mail);

        if (profile != null) {
          profile.proxy = proxy;
          profile.parsedProxy = parseProxyModel(proxy, 'http');

          [x, y] = getNextPosition(x, y, width, height);
          profile.position = `${x},${y}`;
          if (type === 'byId') {
            await runProcessUpload(
              event,
              profile,
              PROFILE_PATH,
              pathToExtension,
              channelName,
              mail,
              type,
              listVideoId,
            );
          } else {
            await runProcessUpload(
              event,
              profile,
              PROFILE_PATH,
              pathToExtension,
              channelName,
              mail,
            );
          }
        }
      }
    } else {
      let count = 0;
      event.reply('upload-video', {
        message: `Đợi 5s để bắt đầu!`,
      });
      const timer = setInterval(async () => {
        if (listMail != null) {
          if (count < listMail.length) {
            const mail = listMail[count];
            count++;
            const PROFILE_PATH = path.join(
              APP_DATA_PATH,
              'Youtube-Profiles/' + mail.mail,
            );
            const proxy = proxyKey;

            if (existsSync(PROFILE_PATH)) {
              log.info('Exist profile: ');
              if (count > 1) [x, y] = getNextPosition(x, y, width, height);

              const profile: ProfileItem = {
                email: mail.mail,
                proxy: proxy,
                parsedProxy: parseProxyModel(proxy, 'http'),
                position: `${x},${y}`,
              };
              if (type === 'byId') {
                await runProcessUpload(
                  event,
                  profile,
                  PROFILE_PATH,
                  pathToExtension,
                  channelName,
                  mail,
                  type,
                  listVideoId,
                );
              } else {
                await runProcessUpload(
                  event,
                  profile,
                  PROFILE_PATH,
                  pathToExtension,
                  channelName,
                  mail,
                );
              }
            } else {
              log.info('Dont exist profile: ');
              const profile = await createProfile(mail.mail);
              if (count > 1) [x, y] = getNextPosition(x, y, width, height);
              if (profile != null) {
                profile.proxy = proxy;
                profile.parsedProxy = parseProxyModel(proxy, 'http');
                profile.position = `${x},${y}`;
                if (type === 'byId') {
                  await runProcessUpload(
                    event,
                    profile,
                    PROFILE_PATH,
                    pathToExtension,
                    channelName,
                    mail,
                    type,
                    listVideoId,
                  );
                } else {
                  await runProcessUpload(
                    event,
                    profile,
                    PROFILE_PATH,
                    pathToExtension,
                    channelName,
                    mail,
                  );
                }
              }
            }
          } else {
            clearInterval(timer);
          }
        } else {
          clearInterval(timer);
        }
      }, 5000);
    }
  } else {
    const messageTMProxyErrorMap: Record<number, string> = {
      11: 'TMProxy Key không tồn tại!',
      14: 'Vui lòng nhập TMProxy key',
      5: `Thử lại sau ${messageTMProxy.split(' ')[2]} giây để lấy proxy mới!`,
      6: 'Gói TMProxy hết hạn, vui lòng gia hạn gói!',
    };
    event.reply('upload-video', {
      message:
        currentSettingsGlobal.proxy.type !== 'tmproxy'
          ? `Thông tin proxy không đúng, vui lòng kiểm tra và thử lại!`
          : messageTMProxyErrorMap[codeResTMproxy],
    });
  }
});
