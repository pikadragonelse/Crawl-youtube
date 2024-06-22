import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { JSDOM } from 'jsdom';
import axios from 'axios';
import {
  ArgCrawlData,
  CrawlChannelInfoResponse,
  InfoVideo,
} from '../models/crawl-page';
import path from 'path';
import workerpool from 'workerpool';
import log from 'electron-log';
import { sleep } from './util';
import fs from 'fs';
import { downloadImage, getVideosFromChannel } from './crawl-page-util';
import { Channels } from './preload';
import { mainWindowId } from './main';
import { baseUrl } from './manage-page';
import { currentSettingsGlobal } from './settings';

// export const getMainWindow = () => {
//   const ID = mainWindowId * 1;
//   return BrowserWindow.fromId(ID);
// };

// export const sendMsgToRenderer = (channel: Channels, data: any) => {
//   const mainWindow = getMainWindow();

//   if (mainWindow != null) {
//     mainWindow.webContents.send(channel, data);
//   }
// };

const listCrawling: Record<string, InfoVideo> = {};

const downloadAllVideosFromChannel = async (
  event: IpcMainEvent,
  channelId: string,
): Promise<void> => {
  const pool = workerpool.pool(
    path.join(path.resolve(), 'src/utils/crawl-worker.js'),
    { maxWorkers: 2 },
  );
  try {
    const { videos, channelInfo } = await getVideosFromChannel(channelId);

    // Create necessary folder
    const { folderPath } = currentSettingsGlobal;
    const channelDir = path.join(
      folderPath != null && folderPath !== '' ? folderPath : '',
      'channels',
    );
    if (!fs.existsSync(channelDir)) {
      fs.mkdirSync(channelDir);
    }
    if (!fs.existsSync(`${channelDir}/${channelInfo.name}`)) {
      fs.mkdirSync(`${channelDir}/${channelInfo.name}`);
    }
    if (!fs.existsSync(`${channelDir}/${channelInfo.name}/channel-info`)) {
      fs.mkdirSync(`${channelDir}/${channelInfo.name}/channel-info`);
    }
    if (!fs.existsSync(`${channelDir}/${channelInfo.name}/videos`)) {
      fs.mkdirSync(`${channelDir}/${channelInfo.name}/videos`);
    }

    // Get channel info path
    const avtPath = `${channelDir}/${channelInfo.name}/channel-info/${channelInfo.name}-avt.jpg`;
    const bannerPath = `${channelDir}/${channelInfo.name}/channel-info/${channelInfo.name}-banner.jpg`;

    // Waiting for create folder done and download avt and banner
    await sleep(2000);
    await downloadImage(channelInfo.avatar, avtPath);
    await downloadImage(channelInfo.banner, bannerPath);

    event.reply('crawl-channel-info', {
      channelName: channelInfo.name,
      avt: ` ${baseUrl}/${channelInfo.name}/channel-info/${channelInfo.name}-avt.jpg`,
      banner: `${baseUrl}/${channelInfo.name}/channel-info/${channelInfo.name}-banner.jpg`,
      totalVideo: videos.length,
    } as CrawlChannelInfoResponse);

    let countKey = 1;
    for (const video of videos) {
      // Tạo thư mục con cho mỗi video
      if (video.videoId !== '' && video.videoId != null) {
        const videoDir = `${channelDir}/${channelInfo.name}/videos/${video.videoId}`;
        if (!fs.existsSync(videoDir)) {
          fs.mkdirSync(videoDir);
        }

        // Lưu tên video vào file văn bản
        const textPath = `${videoDir}/${video.videoId}.txt`;
        fs.writeFileSync(textPath, video.title);
        listCrawling[video.videoId] = {
          key: countKey,
          status: 'waiting',
          title: video.title,
          urlImage: '',
        };

        event.reply('crawl-channel-process', Object.values(listCrawling));
        await sleep(1000);

        // Tải ảnh thumbnail
        const thumbnailPath = `${videoDir}/${video.videoId}.jpg`;
        await downloadImage(video.thumbnail, thumbnailPath);
        const thumbnailToShow = `${baseUrl}/${channelInfo.name}/videos/${video.videoId}/${video.videoId}.jpg`;

        listCrawling[video.videoId] = {
          ...listCrawling[video.videoId],
          urlImage: thumbnailToShow,
        };
        event.reply('crawl-channel-process', Object.values(listCrawling));
        await sleep(1000);
        // Tải video
        const videoPath = `${videoDir}/${video.videoId}.mp4`;
        const audioPath = `${videoDir}/${video.videoId}.mp3`;
        const finalPath = `${videoDir}/full-${video.videoId}.mp4`;

        listCrawling[video.videoId] = {
          ...listCrawling[video.videoId],
          status: 'downloading',
        };
        event.reply('crawl-channel-process', Object.values(listCrawling));
        await sleep(1000);
        // Use worker for each video -> improve speed download
        pool
          .exec('workerDownload', [
            videoDir,
            video.videoId,
            videoPath,
            audioPath,
            finalPath,
          ])
          .then(async () => {
            console.log(`Downloaded video: ${video.title}`);
            listCrawling[video.videoId] = {
              ...listCrawling[video.videoId],
              status: 'done',
            };
            event.reply('crawl-channel-process', Object.values(listCrawling));
            await sleep(1000);
          })
          .catch(async (error) => {
            console.error(`Error when download video: ${video.title}`, error);
            listCrawling[video.videoId] = {
              ...listCrawling[video.videoId],
              status: 'error',
            };
            event.reply('crawl-channel-process', Object.values(listCrawling));
            await sleep(1000);
          });
        countKey++;
      } else {
        log.error('Video not found');
      }

      await sleep(5000);
    }
  } catch (err) {
    console.error('Got the error when download video from:', err);
  }
};

// IPC handler để bắt đầu quá trình tải video
ipcMain.on('crawl-channel', async (event, args: ArgCrawlData) => {
  const { channelInput } = args;
  try {
    // const response = await axios.get(channelInput, {});
    // const html = new JSDOM(response.data);
    // const linkIdChannel = html.window.document.querySelector(
    //   'link[rel="canonical"]',
    // );
    // let channelUrl = '';
    // let channelId = '';

    // if (linkIdChannel != null) {
    //   channelUrl = linkIdChannel.getAttribute('href') || '';
    // }
    // if (channelUrl !== '') {
    //   const listPath = channelUrl.split('/');
    //   channelId = listPath[listPath.length - 1];
    // }
    await downloadAllVideosFromChannel(event, channelInput);
  } catch (error) {
    console.error('Error when get channel ID:', error);
  }
});
