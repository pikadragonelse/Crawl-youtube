import { ipcMain, IpcMainEvent } from 'electron';
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
import { baseUrl } from './manage-page';
import { currentSettingsGlobal } from './settings';
import {
  addChannel,
  downloadImage,
  getVideosFromChannel,
} from './util/crawl-page-util';

const downloadAllVideosFromChannel = async (
  event: IpcMainEvent,
  data: ArgCrawlData,
): Promise<void> => {
  const listCrawling: Record<string, InfoVideo> = {};
  const { channelId, quantity } = data;
  const pool = workerpool.pool(
    path.join(path.resolve(), 'worker/crawl-worker.js'),
    { maxWorkers: 2 },
  );
  try {
    const { videos, channelInfo } = await getVideosFromChannel(
      channelId,
      quantity,
    );

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
    const idChannelPath = `${channelDir}/${channelInfo.name}/channel-info/${channelInfo.name}-id.txt`;
    const avtPath = `${channelDir}/${channelInfo.name}/channel-info/${channelInfo.name}-avt.jpg`;
    const bannerPath = `${channelDir}/${channelInfo.name}/channel-info/${channelInfo.name}-banner.jpg`;

    // Waiting for create folder done and download avt and banner
    await sleep(2000);
    fs.writeFileSync(idChannelPath, channelId);
    await downloadImage(channelInfo.avatar, avtPath);
    await downloadImage(channelInfo.banner, bannerPath);

    await addChannel(channelInfo.name, channelId);

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
        const durationPath = `${videoDir}/${video.videoId}-duration.txt`;
        fs.writeFileSync(textPath, video.title);
        fs.writeFileSync(durationPath, video.duration.toString());

        listCrawling[video.videoId] = {
          key: countKey,
          status: 'waiting',
          title: video.title,
          duration: video.duration,
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
            log.info(`Downloaded video: ${video.title}`);
            listCrawling[video.videoId] = {
              ...listCrawling[video.videoId],
              status: 'done',
            };
            event.reply('crawl-channel-process', Object.values(listCrawling));
            await sleep(1000);
          })
          .catch(async (error) => {
            log.error(`Error when download video: ${video.title}`, error);
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
    log.error('Got the error when download video from:', err);
  }
};

// IPC handler để bắt đầu quá trình tải video
ipcMain.on('crawl-channel', async (event, args: ArgCrawlData) => {
  try {
    await downloadAllVideosFromChannel(event, args);
  } catch (error) {
    log.error('Error when get channel ID:', error);
  }
});
