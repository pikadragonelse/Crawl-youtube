import React, { useEffect, useState } from 'react';
import { ItemList } from '../../components/item-list';
import { ChannelInfo } from '../../models/manage-page';

export const ManageChannel = () => {
  const [listChannelInfo, setListChannelInfo] = useState<ChannelInfo[]>([]);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('get-info-channel');

    window.electron.ipcRenderer.once('get-info-channel', (res) => {
      const listChannelInfo = res as ChannelInfo[];
      setListChannelInfo(listChannelInfo);
    });
  }, []);

  return (
    <div className="flex-1 h-full p-4 overflow-auto">
      <div className="">
        <div className="w-fit mx-auto">
          <h1 className="text-3xl font-medium mb-10 bg-gradient-to-r from-red-600 to-orange-600 inline-block text-transparent bg-clip-text pb-1">
            Tổng hợp kênh
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap justify-around">
          {listChannelInfo.map((channelInfo, index) => (
            <ItemList key={index} type="channel" channel={channelInfo} />
          ))}
        </div>
      </div>
    </div>
  );
};
