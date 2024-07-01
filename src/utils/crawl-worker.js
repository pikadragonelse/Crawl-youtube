const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const workerpool = require('workerpool');

const downloadVideo = (url, videoOutput, downloadOption) => {
  return new Promise((resolve, reject) => {
    const videoStream = ytdl(url, downloadOption);
    const videoFile = fs.createWriteStream(videoOutput);
    videoStream.pipe(videoFile);

    videoFile.on('finish', resolve);
    videoFile.on('error', reject);
  });
};

const downloadAudio = (url, audioOutput, downloadOption) => {
  return new Promise((resolve, reject) => {
    const audioStream = ytdl(url, downloadOption);
    const audioFile = fs.createWriteStream(audioOutput);
    audioStream.pipe(audioFile);

    audioFile.on('finish', resolve);
    audioFile.on('error', reject);
  });
};

// Hàm để tải video
const downloadVideoFull = async (
  videoId,
  videoOutputPath,
  audioOutputPath,
  finalOutputPath,
) => {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const tryDownload = (quality, qualityAudio) => {
    return new Promise(async (resolve, reject) => {
      console.log(
        `Trying to download ${videoId} at quality ${JSON.stringify(quality)}`,
      );

      Promise.all([
        downloadVideo(url, videoOutputPath, quality),
        downloadAudio(url, audioOutputPath, qualityAudio),
      ])
        .then(() => {
          // Dùng ffmpeg để hợp nhất video và audio
          ffmpeg()
            .input(videoOutputPath)
            .input(audioOutputPath)
            .output(finalOutputPath)
            .outputOptions('-c:v copy') // Giữ nguyên codec video
            .outputOptions('-c:a aac') // Chuyển đổi audio sang AAC
            .outputOptions('-b:a 192k') // Đặt bitrate cho audio
            .outputOptions('-shortest') // Dừng khi file ngắn hơn kết thúc
            .on('progress', (progress) => {
              console.log(`Progress: ${progress.percent}% `);
            })
            .on('end', () => {
              console.log(`Combine video ${videoId} successful!`);
              // Xóa các file tạm thời nếu cần thiết
              fs.unlinkSync(videoOutputPath);
              fs.unlinkSync(audioOutputPath);
              resolve('');
            })
            .on('error', (err) => {
              console.error(`Error when combine video ${videoId}:`, err);
              reject('');
            })
            .run();
        })
        .catch((err) => {
          console.error(`Error when download video or audio ${videoId}:`, err);
        });
    });
  };

  return tryDownload(
    { quality: 'highestvideo', filter: 'videoonly' },
    { quality: 'highestaudio', filter: 'audioonly' },
  )
    .catch((err) => {
      console.log(
        `Failed to download ${videoId} at highest quality, trying medium quality...`,
      );
      return tryDownload(
        { quality: '137', filter: 'videoonly' },
        { quality: '141', filter: 'audioonly' },
      ); // Quality 137 is 1080p
    })
    .catch((err) => {
      console.log(
        `Failed to download ${videoId} at medium quality, trying lowest quality...`,
      );
      return tryDownload(
        { quality: '22', filter: 'videoonly' },
        { quality: '140', filter: 'audioonly' },
      );
    })
    .catch((err) => {
      console.error(
        `Failed to download ${videoId} at all available qualities:`,
        err,
      );
      throw err;
    });
};

const workerDownload = async (
  videoDir,
  videoId,
  videoPath,
  audioPath,
  finalPath,
) => {
  await downloadVideoFull(videoId, videoPath, audioPath, finalPath);
};

workerpool.worker({
  workerDownload: workerDownload,
});
