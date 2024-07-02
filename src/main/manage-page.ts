import * as fs from 'fs';
import * as path from 'path';
import { VideoInfo } from '../models/manage-page';
import { ipcMain } from 'electron';
import { currentSettingsGlobal } from './settings';
import { ChannelInfo } from '../models/crawl-page';
import log from 'electron-log';

// Đường dẫn tới folder 'channels'

export const baseUrl = 'http://localhost:3001/channels';

// Hàm lấy thông tin của một kênh
const getChannelInfo = (channelName: string): ChannelInfo | null => {
  const { folderPath } = currentSettingsGlobal;
  const channelsPath = path.join(
    folderPath !== '' && folderPath != null ? folderPath : path.resolve(),
    'channels',
  );
  const channelPath = path.join(channelsPath, channelName);
  const channelInfoPath = path.join(channelPath, 'channel-info');

  const avtPath = `${baseUrl}/${channelName}/channel-info/${channelName}-avt.jpg`;
  const bannerPath = `${baseUrl}/${channelName}/channel-info/${channelName}-banner.jpg`;

  if (!fs.existsSync(path.join(channelInfoPath, `${channelName}-avt.jpg`))) {
    log.error(`Không tìm thấy AVT hoặc Banner cho kênh ${channelName}`);
    return null;
  }

  return {
    name: channelName,
    avatar: avtPath,
    banner: bannerPath,
  };
};

export const getVideoOfChannel = (channelName: string): VideoInfo[] | null => {
  const { folderPath } = currentSettingsGlobal;
  const channelsPath = path.join(
    folderPath !== '' && folderPath != null ? folderPath : path.resolve(),
    'channels',
  );
  const channelPath = path.join(channelsPath, channelName);
  const videosPath = path.join(channelPath, 'videos');
  const videoIds = fs.readdirSync(videosPath);
  const videos: VideoInfo[] = videoIds
    .map((videoId) => {
      const videoPath = path.join(videosPath, videoId);
      const thumbnailPath = `${baseUrl}/${channelName}/videos/${videoId}/${videoId}.jpg`;
      const videoInfoPath = path.join(videoPath, `${videoId}.txt`);
      const fullVideoPath = `${baseUrl}/${channelName}/videos/${videoId}/full-${videoId}.mp4`;

      if (
        fs.existsSync(path.join(videoPath, `${videoId}.jpg`)) &&
        fs.existsSync(videoInfoPath) &&
        fs.existsSync(path.join(videoPath, `full-${videoId}.mp4`))
      ) {
        const title = fs.readFileSync(videoInfoPath, 'utf8');
        return {
          id: videoId,
          title,
          thumbnailPath,
          videoPath: path.join(videoPath, `full-${videoId}.mp4`),
          videoLinkToShow: fullVideoPath,
        };
      } else {
        log.error(
          `Không tìm thấy đủ thông tin cho video ID ${videoId} trong kênh ${channelName}`,
        );
        return null;
      }
    })
    .filter((video) => video !== null) as VideoInfo[];

  return videos;
};

ipcMain.on('get-info-channel', (event, args) => {
  const { folderPath } = currentSettingsGlobal;
  const channelsPath = path.join(
    folderPath !== '' && folderPath != null ? folderPath : path.resolve(),
    'channels',
  );
  const channels = fs.readdirSync(channelsPath);
  const channelsInfo = channels
    .map((channelName) => getChannelInfo(channelName))
    .filter((channel) => channel !== null) as ChannelInfo[];

  event.reply('get-info-channel', channelsInfo);
});

ipcMain.on('get-video-channel', (event, channelName) => {
  const listVideo = getVideoOfChannel(channelName);
  event.reply('get-video-channel', listVideo);
});
