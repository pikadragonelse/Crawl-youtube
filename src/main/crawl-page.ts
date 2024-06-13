import axios from 'axios';
import { ipcMain } from 'electron';
import fs from 'fs';
import { google } from 'googleapis';
import ytdl, { downloadOptions } from 'ytdl-core';
import { JSDOM } from 'jsdom';
import ffmpeg from 'fluent-ffmpeg';
require('dotenv').config();

// API Key từ biến môi trường
const API_KEY = process.env.GOOGLE_API_KEY;

// Hàm để lấy danh sách video từ kênh
const getVideosFromChannel = async (channelId: string): Promise<any[]> => {
  const youtube = google.youtube({
    version: 'v3',
    auth: API_KEY,
  });

  try {
    const res = await youtube.search.list({
      channelId: channelId,
      part: ['id', 'snippet'],
      maxResults: 50,
      order: 'date',
    });

    return (
      res.data.items?.map((item: any) => {
        const thumbnails = item.snippet?.thumbnails;
        const maxresThumbnail = thumbnails?.maxres?.url;
        const highThumbnail = thumbnails?.high?.url;
        return {
          videoId: item.id?.videoId ?? '',
          title: item.snippet?.title ?? '',
          thumbnail: maxresThumbnail ?? highThumbnail ?? '',
        };
      }) || []
    );
  } catch (error) {
    console.error('Error when get video from:', error);
    return [];
  }
};

// Hàm để tải video
const downloadVideo = async (
  videoId: string,
  outputPath: string,
): Promise<unknown> => {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const tryDownload = (quality: downloadOptions) => {
    return new Promise((resolve, reject) => {
      console.log(
        `Trying to download ${videoId} at quality ${JSON.stringify(quality)}`,
      );
      const video = ytdl(url, quality);
      const audioStream = ytdl(url, { quality: 'highestaudio' });

      let totalSize = 0;
      let downloadedSize = 0;

      video.on('response', (res) => {
        totalSize = parseInt(res.headers['content-length'], 10);
        console.log(`Total size of video ${videoId}: ${totalSize}`);
      });

      video.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percent = ((downloadedSize / totalSize) * 100).toFixed(2);
        console.log(`Downloading ${videoId}: ${percent}%`);
      });

      ffmpeg()
        .input(video)
        .input(audioStream)
        .outputOptions('-c:v', 'copy')
        .outputOptions('-c:a', 'aac')
        .save(outputPath)
        .on('end', () => {
          console.log(`Video ${videoId} download successful!`);
          resolve('');
        })
        .on('error', (err) => {
          console.error(`Failed to download ${videoId}:`, err);
          reject(err);
        });

      // video
      //   .pipe(fs.createWriteStream(outputPath))
      //   .on('finish', () => {
      //     console.log(
      //       `Video ${videoId} download successful at quality ${JSON.stringify(quality)}!`,
      //     );
      //     resolve('');
      //   })
      //   .on('error', (err) => {
      //     console.error(
      //       `Got error when download video ${videoId} at quality ${JSON.stringify(quality)}:`,
      //       err,
      //     );
      //     reject(err);
      //   });

      video.on('error', (err) => {
        console.error(
          `Error event for video ${videoId} at quality ${JSON.stringify(quality)}:`,
          err,
        );
        reject(err);
      });
    });
  };

  return tryDownload({ quality: 'highest' })
    .catch((err) => {
      console.log(
        `Failed to download ${videoId} at highest quality, trying medium quality...`,
      );
      return tryDownload({ quality: '137' }); // Quality 137 is 1080p
    })
    .catch((err) => {
      console.log(
        `Failed to download ${videoId} at medium quality, trying lowest quality...`,
      );
      return tryDownload({ quality: '22' });
    })
    .catch((err) => {
      console.error(
        `Failed to download ${videoId} at all available qualities:`,
        err,
      );
      throw err;
    });
};

// Hàm để tải ảnh
// Cập nhật hàm downloadImage để sử dụng retryRequest
const downloadImage = async (
  url: string,
  outputPath: string,
): Promise<void> => {
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
    console.error(`Error when download img from ${url}:`, error);
  }
};

// Hàm chính để tải toàn bộ video từ kênh
const downloadAllVideosFromChannel = async (
  channelId: string,
): Promise<void> => {
  try {
    const videos = await getVideosFromChannel(channelId);

    if (!fs.existsSync('videos')) {
      fs.mkdirSync('videos');
    }

    for (const video of videos) {
      // Tạo thư mục con cho mỗi video
      const videoDir = `videos/${video.videoId}`;
      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir);
      }

      // Tải video
      const videoPath = `${videoDir}/${video.videoId}.mp4`;
      await downloadVideo(video.videoId, videoPath);

      // Lưu tên video vào file văn bản
      const textPath = `${videoDir}/${video.videoId}.txt`;
      fs.writeFileSync(textPath, video.title);

      // Tải ảnh thumbnail
      const thumbnailPath = `${videoDir}/${video.videoId}.jpg`;
      await downloadImage(video.thumbnail, thumbnailPath);

      // Giãn cách thời gian giữa các lần tải xuống (ví dụ: 5 giây)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (err) {
    console.error('Got the error when download video from:', err);
  }
};

// IPC handler để bắt đầu quá trình tải video
ipcMain.on('crawl-channel', async (event, args) => {
  try {
    const response = await axios.get('https://www.youtube.com/@wistfulfox4627');
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
