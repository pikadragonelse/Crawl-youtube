import { execSync } from 'child_process';
import { IpcMainEvent, ipcMain } from 'electron';
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
import { MailInfo } from '../models/mail';
import { ResGetTMProxy } from '../models/proxy';
import { loadJSONFile } from '../utils/load-file';
import { VideoInfo } from '../models/manage-page';
import fs from 'fs';
import { updateMailInfo } from './util/mail-info-utils';

const APP_DATA_PATH = execSync('echo %APPDATA%').toString().trim();

export const getProxy: () => Promise<ResGetTMProxy> = async () => {
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

    return resp.data;
  } catch (e) {
    log.info(e);
    return undefined;
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

  const page = await browser.newPage();
  page.setViewport({ width: 900, height: 500 });
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(60000);

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
      await loginYoutube(page, mail);
      const listVideo = getListVideoByListId(listVideoId, channelName);

      if (listVideo != null) {
        for (let index = 0; index < listVideo.length; index++) {
          if (index === listVideo?.length) {
            log.info('All videos have been uploaded');
            await browser.close();
            return;
          }
          const video = listVideo[index];
          await uploadVideo(page, video.videoPath, video.title, mail.mail);
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

  let response = await getProxy();

  if (response.data.https !== '') {
    if (multipleUpload !== true) {
      const proxy = response.data.https;

      if (existsSync(PROFILE_PATH)) {
        log.info('Exist profile: ');

        const profile: ProfileItem = {
          email: mail.mail,
          proxy: proxy,
          parsedProxy: parseProxyModel(proxy, 'http'),
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
      log.info('Come here!!');
      let count = 0;
      const timer = setInterval(async () => {
        if (listMail != null) {
          if (count < listMail.length) {
            const mail = listMail[count];
            count++;
            const PROFILE_PATH = path.join(
              APP_DATA_PATH,
              'Youtube-Profiles/' + mail.mail,
            );
            const proxy = response.data.https;

            if (existsSync(PROFILE_PATH)) {
              log.info('Exist profile: ');

              const profile: ProfileItem = {
                email: mail.mail,
                proxy: proxy,
                parsedProxy: parseProxyModel(proxy, 'http'),
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
    event.reply('upload-video', {
      message: `Thử lại sau ${response.message.split(' ')[2]} giây để lấy proxy mới!`,
    });
  }
});
