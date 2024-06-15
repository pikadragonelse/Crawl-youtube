import { BrowserWindow, ipcMain } from 'electron';
import { JSDOM } from 'jsdom';
import axios from 'axios';
import { ArgCrawlData } from '../models/crawl-page';
import path from 'path';
import workerpool from 'workerpool';
import log from 'electron-log';
import { sleep } from './util';
import fs from 'fs';
import { downloadImage, getVideosFromChannel } from './crawl-page-util';
import { Channels } from './preload';
import { mainWindowId } from './main';

export const getMainWindow = () => {
  const ID = mainWindowId * 1;
  return BrowserWindow.fromId(ID);
};

export const sendMsgToRenderer = (channel: Channels, data: any) => {
  const mainWindow = getMainWindow();

  if (mainWindow != null) {
    mainWindow.webContents.send(channel, data);
  }
};

const downloadAllVideosFromChannel = async (
  channelId: string,
): Promise<void> => {
  const pool = workerpool.pool(
    path.join(path.resolve(), 'src/utils/crawl-worker.js'),
  );
  try {
    const { videos, channelInfo } = await getVideosFromChannel(channelId);

    const channelDir = 'channels';
    if (!fs.existsSync(channelDir)) {
      fs.mkdirSync(channelDir);
    }
    if (!fs.existsSync(`${channelDir}/${channelInfo.name}`)) {
      fs.mkdirSync(`${channelDir}/${channelInfo.name}`);
    }
    if (!fs.existsSync(`${channelDir}/${channelInfo.name}/channel-info`)) {
      fs.mkdirSync(`${channelDir}/${channelInfo.name}/channel-info`);
    }

    const avtPath = `${channelDir}/${channelInfo.name}/channel-info/${channelInfo.name}-avt.jpg`;
    const bannerPath = `${channelDir}/${channelInfo.name}/channel-info/${channelInfo.name}-banner.jpg`;

    await sleep(2000);
    await downloadImage(channelInfo.avatar, avtPath);
    await downloadImage(channelInfo.banner, bannerPath);

    if (!fs.existsSync(`${channelDir}/${channelInfo.name}/videos`)) {
      fs.mkdirSync(`${channelDir}/${channelInfo.name}/videos`);
    }

    for (const video of videos) {
      // Tạo thư mục con cho mỗi video
      if (video.videoId !== '' && video.videoId != null) {
        const videoDir = `${channelDir}/${channelInfo.name}/videos/${video.videoId}`;
        if (!fs.existsSync(videoDir)) {
          fs.mkdirSync(videoDir);
        }

        // Tải video
        const videoPath = `${videoDir}/${video.videoId}.mp4`;
        const audioPath = `${videoDir}/${video.videoId}.mp3`;
        const finalPath = `${videoDir}/full-${video.videoId}.mp4`;

        pool
          .exec('workerDownload', [
            videoDir,
            video.videoId,
            videoPath,
            audioPath,
            finalPath,
            video.thumbnail,
            video.title,
          ])
          .then(() => {
            console.log(`Downloaded video: ${video.title}`);
          })
          .catch((error) => {
            console.error(`Error when download video: ${video.title}`, error);
          });
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
    const response = await axios.get(channelInput, {});
    const html = new JSDOM(response.data);
    const linkIdChannel = html.window.document.querySelector(
      'link[rel="canonical"]',
    );
    let channelUrl = '';
    let channelId = '';

    if (linkIdChannel != null) {
      channelUrl = linkIdChannel.getAttribute('href') || '';
    }
    if (channelUrl !== '') {
      const listPath = channelUrl.split('/');
      channelId = listPath[listPath.length - 1];
    }
    await downloadAllVideosFromChannel(channelId);
  } catch (error) {
    console.error('Error when get channel ID:', error);
  }
});
