import React, { useEffect, useState } from 'react';
import { VideoInfo } from '../../models/manage-page';
import { ItemList } from '../../components/item-list';
import { useNavigate, useParams } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';

export const ManageVideo = () => {
  const { channelName } = useParams();
  const [listVideoInfo, setListVideoInfo] = useState<VideoInfo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (channelName != null && channelName !== '') {
      window.electron.ipcRenderer.sendMessage('get-video-channel', channelName);

      window.electron.ipcRenderer.once('get-video-channel', (res) => {
        const listVideo = res as VideoInfo[];
        setListVideoInfo(listVideo);
      });
    }
  }, [channelName]);

  return (
    <div className="flex-1 h-full p-4 overflow-auto">
      <div
        className="inline-flex text-lg font-medium transition-all gap-2 items-center cursor-pointer hover:text-red-600"
        onClick={() => navigate('/manage-page')}
      >
        <span className="">
          <LeftOutlined />
        </span>
        <span>Quay lại</span>
      </div>
      <div className="">
        <div className="w-fit mx-auto">
          <h1 className="text-3xl font-medium mb-10 bg-gradient-to-r from-red-600 to-orange-600 inline-block text-transparent bg-clip-text pb-1">
            Tổng hợp video của kênh {channelName}
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap justify-between">
          {listVideoInfo.map((videoInfo, index) => (
            <ItemList key={index} type="video" video={videoInfo} />
          ))}
        </div>
      </div>
    </div>
  );
};
