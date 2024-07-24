import fs from 'fs';
import { google } from 'googleapis';
require('dotenv').config();
import log from 'electron-log';

import axios from 'axios';
import { ChannelInfo, Video } from '../../models/crawl-page';
import { currentSettingsGlobal } from '../settings';
import path from 'path';
import { parseISO8601Duration } from '../../utils/parseTime';
import { apiInstance } from '../../plugin/apiInstance';

// API Key từ biến môi trường
const API_KEY = process.env.GOOGLE_API_KEY;

// Hàm để lấy danh sách video từ kênh
export const getVideosFromChannel = async (
  channelId: string,
  quantity: number,
): Promise<{ channelInfo: ChannelInfo; videos: Video[] }> => {
  const youtube = google.youtube({
    version: 'v3',
    auth: API_KEY,
  });

  const channelResponse = await youtube.channels.list({
    part: ['snippet', 'brandingSettings', 'contentDetails'],
    id: [channelId],
  });

  const channelItem = channelResponse.data.items?.[0];
  if (!channelItem) {
    throw new Error('Could not find channel');
  }

  const uploadsPlaylistId =
    channelResponse.data.items?.[0].contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error('Could not find uploads playlist ID');
  }

  const channelInfo: ChannelInfo = {
    id: channelId,
    idServer: 0,
    name: channelItem.snippet?.title || '',
    avatar: channelItem.snippet?.thumbnails?.high?.url || '',
    banner: channelItem.brandingSettings?.image?.bannerExternalUrl || '',
  };

  let videos: Video[] = [];
  let nextPageToken: string | undefined = undefined;
  let countDownloadedVideo = 0;
  const { folderPath } = currentSettingsGlobal;
  const channelsPath = path.join(
    folderPath !== '' && folderPath != null ? folderPath : path.resolve(),
    'channels',
  );
  const channelPath = path.join(channelsPath, channelItem.snippet?.title || '');
  const videosPath = path.join(channelPath, 'videos');
  const existVideoIds = fs.existsSync(videosPath)
    ? fs.readdirSync(videosPath)
    : null;

  while (true) {
    const playlistResponse: any = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      pageToken: nextPageToken,
      maxResults: 50,
    });

    const videoIds: string[] =
      playlistResponse.data.items?.map(
        (item: any) => item.snippet?.resourceId?.videoId,
      ) || [];

    if (videoIds.length === 0) break;

    const videoResponse: any = await youtube.videos.list({
      part: ['contentDetails', 'snippet'],
      id: videoIds,
    });

    for (const item of videoResponse.data.items) {
      const videoId = item.id;
      const duration = item.contentDetails?.duration;
      const title = item.snippet?.title;
      const thumbnails = item.snippet?.thumbnails;

      if (!videoId || !duration || !title) continue;

      if (existVideoIds != null) {
        if (existVideoIds.includes(videoId)) continue;
      }

      const durationInSeconds = parseISO8601Duration(duration);

      if (durationInSeconds < 180) {
        let thumbnailUrl = '';

        if (thumbnails) {
          if (thumbnails.maxres) {
            thumbnailUrl = thumbnails.maxres.url;
          } else if (thumbnails.high) {
            thumbnailUrl = thumbnails.high.url;
          } else {
            thumbnailUrl = thumbnails.default?.url || '';
          }
        }

        videos.push({
          videoId,
          title,
          thumbnail: thumbnailUrl,
          duration: durationInSeconds,
        });
        countDownloadedVideo++;
      }

      if (countDownloadedVideo >= quantity) break;
    }

    if (
      !playlistResponse.data.nextPageToken ||
      countDownloadedVideo >= quantity
    )
      break;

    nextPageToken = playlistResponse.data.nextPageToken;
  }

  return { channelInfo: channelInfo, videos: videos };
};

export const downloadImage = async (url: string, outputPath: string) => {
  try {
    const response = await axios({
      url,
      responseType: 'stream',
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    log.error(`Error when download img from ${url}:`, error);
  }
};

export const addChannel = async (name: string, channelIdYoutube: string) => {
  try {
    const response = await apiInstance.post('channels', {
      channelInfo: { name: name, id_youtube: channelIdYoutube },
    });
    log.info('Add channel response: ', response);
  } catch (error) {
    log.error('Adding channel error: ', error);
  }
};
