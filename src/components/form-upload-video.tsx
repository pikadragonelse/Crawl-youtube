import { Button, message, Row, Select, Space, Table, TableProps } from 'antd';
import React, { useEffect, useState } from 'react';
import { MailInfo, defaultMailInfo } from '../models/mail';
import { ChannelInfo } from '../models/crawl-page';
import { DefaultOptionType } from 'antd/es/select';
import { VideoInfo } from '../models/manage-page';
import { UploadVideoArgs } from '../models/upload-video';

const columns: TableProps<VideoInfo>['columns'] = [
  {
    title: 'video',
    render: (_, record) => (
      <div className="flex gap-2">
        <div className="w-16 h-16 rounded-xl overflow-hidden">
          <img
            src={record.thumbnailPath}
            className="w-full h-full object-cover"
          />
        </div>
        <span>{record.title}</span>
      </div>
    ),
  },
];

export type FormUploadVideo = {
  mailInfo?: MailInfo;
  onDeny?: () => void;
  onSubmit?: (channelName: string) => void;
};
export const FormUploadVideo: React.FC<FormUploadVideo> = ({
  mailInfo = defaultMailInfo,
  onDeny,
  onSubmit = () => {},
}) => {
  const [listChannelInfo, setListChannelInfo] = useState<ChannelInfo[]>([]);
  const [channelInfoMap, setChannelInfoMap] =
    useState<Record<string, ChannelInfo>>();
  const [selectedKeyChannel, setSelectedKeyChannel] = useState('');
  const [listVideo, setListVideo] = useState<VideoInfo[]>([]);
  const [listSelectedVideo, setListSelectedVideo] = useState<VideoInfo[]>([]);

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: VideoInfo[]) => {
      setListSelectedVideo(selectedRows);
    },
  };

  const uploadById = () => {
    if (listSelectedVideo.length < 1) {
      message.info('Vui lòng chọn video để tải lên!');
      return;
    }
    const args: UploadVideoArgs = {
      channelName: channelInfoMap?.[selectedKeyChannel]?.name || '',
      mail: mailInfo,
      type: 'byId',
      listVideoId: listSelectedVideo.map((video) => video.id),
    };

    window.electron.ipcRenderer.sendMessage('upload-video', args);
  };

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('get-info-channel');

    window.electron.ipcRenderer.once('get-info-channel', (res) => {
      const listChannelInfo = res as ChannelInfo[];
      const channelInfoMap: Record<string, ChannelInfo> = {};

      channelInfoMap[listChannelInfo[0].id] = listChannelInfo[0];

      setChannelInfoMap(channelInfoMap);
      setListChannelInfo(listChannelInfo);
      setSelectedKeyChannel(listChannelInfo[0].id);
    });
  }, []);

  const getListVideoByChannel = (channelName: string) => {
    window.electron.ipcRenderer.sendMessage('get-video-channel', channelName);
  };

  useEffect(() => {
    if (channelInfoMap != null) {
      getListVideoByChannel(channelInfoMap[selectedKeyChannel].name);
    }
  }, [selectedKeyChannel, channelInfoMap]);

  useEffect(() => {
    const removeGetVideoChannelEvent = window.electron.ipcRenderer.on(
      'get-video-channel',
      (res) => {
        const listVideo = res as VideoInfo[];
        const addKeyList = listVideo.map((video, index) => {
          video.key = (index + 1).toString();
          return video;
        });
        setListVideo(addKeyList);
      },
    );
    return () => {
      removeGetVideoChannelEvent();
    };
  }, []);

  return (
    <div className="">
      Đăng tải video từ kênh
      <div className="">
        <Select
          value={selectedKeyChannel}
          onChange={(value) => setSelectedKeyChannel(value)}
          className="w-full my-1"
          optionRender={(option) =>
            channelInfoMap != null ? (
              <div className="flex gap-2 items-center py-2">
                <img
                  src={channelInfoMap[(option.value as any) || 0].avatar}
                  className="w-20 h-20 rounded-xl"
                />
                <span>{channelInfoMap[(option.value as any) || 0].name}</span>
              </div>
            ) : undefined
          }
          options={listChannelInfo.map((channel) => {
            return {
              label: channel.name,
              value: channel.id,
            } as DefaultOptionType;
          })}
        />
        lên kênh youtube của{' '}
        <span className="text-red-600">{mailInfo?.mail}</span>?
        <Table
          columns={columns}
          dataSource={listVideo}
          rowSelection={{
            ...rowSelection,
          }}
          scroll={{ y: 250 }}
          className="mt-4"
        />
        <Row justify={'end'} className="mt-4">
          <Space>
            <Button onClick={onDeny}>Từ chối</Button>
            <Button
              type="primary"
              onClick={() =>
                // onSubmit(
                //   channelInfoMap != null
                //     ? channelInfoMap[selectedKeyChannel].name
                //     : '',
                // )
                {
                  uploadById();
                }
              }
            >
              Xác nhận
            </Button>
          </Space>
        </Row>
      </div>
    </div>
  );
};
