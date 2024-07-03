import fs from 'fs';
import { google } from 'googleapis';
require('dotenv').config();
import log from 'electron-log';

import axios from 'axios';
import { ChannelInfo, Video } from '../../models/crawl-page';

// API Key từ biến môi trường
const API_KEY = process.env.GOOGLE_API_KEY;

// Hàm để lấy danh sách video từ kênh
export const getVideosFromChannel = async (
  channelId: string,
): Promise<{ channelInfo: ChannelInfo; videos: Video[] }> => {
  const youtube = google.youtube({
    version: 'v3',
    auth: API_KEY,
  });

  const channelResponse = await youtube.channels.list({
    part: ['snippet', 'brandingSettings', 'contentDetails'],
    id: [channelId],
    maxResults: 10,
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
    name: channelItem.snippet?.title || '',
    avatar: channelItem.snippet?.thumbnails?.high?.url || '',
    banner: channelItem.brandingSettings?.image?.bannerExternalUrl || '',
  };

  let videos: Video[] = [];
  let nextPageToken: string | undefined = undefined;

  while (true) {
    const playlistResponse: any = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken: nextPageToken,
    });

    playlistResponse.data.items?.forEach((item: any) => {
      const videoId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;
      const thumbnails = item.snippet?.thumbnails;
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

      if (videoId && title) {
        videos.push({ videoId, title, thumbnail: thumbnailUrl });
      }
    });

    nextPageToken = playlistResponse.data.nextPageToken;
    if (!nextPageToken) {
      break;
    }
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
