import * as fs from 'fs';
import * as path from 'path';
import { VideoInfo } from '../models/manage-page';
import { ipcMain } from 'electron';
import { currentSettingsGlobal } from './settings';
import { ChannelInfo } from '../models/crawl-page';
import log from 'electron-log';

// Đường dẫn tới folder 'channels'

export const baseUrl = 'http://localhost:3001/channels';

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
      const videoDurationPath = path.join(videoPath, `${videoId}-duration.txt`);
      const fullVideoPath = `${baseUrl}/${channelName}/videos/${videoId}/full-${videoId}.mp4`;

      if (
        fs.existsSync(path.join(videoPath, `${videoId}.jpg`)) &&
        fs.existsSync(videoInfoPath) &&
        fs.existsSync(videoDurationPath) &&
        fs.existsSync(path.join(videoPath, `full-${videoId}.mp4`))
      ) {
        const title = fs.readFileSync(videoInfoPath, 'utf8');
        const duration = fs.readFileSync(videoDurationPath, 'utf8');

        return {
          id: videoId,
          title,
          thumbnailPath,
          videoPath: path.join(videoPath, `full-${videoId}.mp4`),
          videoLinkToShow: fullVideoPath,
          duration: Number(duration),
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

ipcMain.on('get-video-channel', (event, channelName) => {
  const listVideo = getVideoOfChannel(channelName);
  event.reply('get-video-channel', listVideo);
});
