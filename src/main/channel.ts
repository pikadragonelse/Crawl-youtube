import { ipcMain } from 'electron';
import log from 'electron-log';
import { apiInstance } from '../plugin/apiInstance';
import { ChannelServer } from '../models/channel';
import { ChannelInfo } from '../models/crawl-page';
import { currentSettingsGlobal } from './settings';
import path from 'path';
import { baseUrl } from './manage-page';
import fs from 'fs';

// Hàm lấy thông tin của một kênh
export const getChannelInfo = (
  channelName: string,
  channelIdServer: number,
  channelIdYoutube: string,
): ChannelInfo | null => {
  try {
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
      id: channelIdYoutube,
      idServer: channelIdServer,
      name: channelName,
      avatar: avtPath,
      banner: bannerPath,
    };
  } catch (error) {
    log.error(error);
    return {
      id: '',
      idServer: channelIdServer,
      name: '',
      avatar: '',
      banner: '',
    };
  }
};

ipcMain.on('get-channel', async (event) => {
  try {
    const response = await apiInstance.get('channels', {
      params: {
        page: 1,
        pageSize: 10,
      },
    });
    const listChannels = response.data.channels as ChannelServer[];
    const channelsInfo = listChannels
      .map((channel) =>
        getChannelInfo(channel.name, channel.id, channel.id_youtube),
      )
      .filter((channel) => channel !== null) as ChannelInfo[];

    event.reply('get-channel', channelsInfo);
  } catch (error) {
    log.error('Error getting channel: ', error);
  }
});
