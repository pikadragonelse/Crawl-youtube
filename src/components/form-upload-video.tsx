import {
  Button,
  List,
  message,
  Row,
  Select,
  Space,
  Table,
  TableProps,
  Tabs,
  Tooltip,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { MailInfo, defaultMailInfo } from '../models/mail';
import { ChannelInfo } from '../models/crawl-page';
import { DefaultOptionType } from 'antd/es/select';
import { VideoInfo } from '../models/manage-page';
import { UploadVideoArgs } from '../models/upload-video';
import { convertToStringTime } from '../utils/stringifyTime';
import copy from 'copy-to-clipboard';
import { CopyOutlined } from '@ant-design/icons';

const columns: TableProps<VideoInfo>['columns'] = [
  { title: '#', dataIndex: 'key', width: 50 },
  {
    title: 'video',
    render: (_, record) => (
      <div className="flex gap-2">
        <div className="w-16 min-w-16 h-16 rounded-xl overflow-hidden">
          <img
            src={record.thumbnailPath}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span>{record.title}</span>
          <span className="text-sm">
            {convertToStringTime(record.duration)}
          </span>
        </div>
      </div>
    ),
  },
];

export type FormUploadVideo = {
  mailInfo?: MailInfo;
  onDeny?: () => void;
  onSubmit?: (channelName: string) => void;
  isReset?: number;
  multipleUpload?: boolean;
  listMail?: MailInfo[];
};
export const FormUploadVideo: React.FC<FormUploadVideo> = ({
  mailInfo = defaultMailInfo,
  onDeny,
  onSubmit = () => {},
  isReset,
  multipleUpload = false,
  listMail = [],
}) => {
  const [listChannelInfo, setListChannelInfo] = useState<ChannelInfo[]>([]);
  const [channelInfoMap, setChannelInfoMap] =
    useState<Record<string, ChannelInfo>>();
  const [selectedKeyChannel, setSelectedKeyChannel] = useState('');
  const [listVideo, setListVideo] = useState<VideoInfo[]>([]);
  const [listSelectedVideo, setListSelectedVideo] = useState<VideoInfo[]>([]);
  const [currentKey, setCurrentKey] = useState('1');
  const [listVideoLinkOfMail, setListVideoLinkOfMail] = useState(['']);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(['']);

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: VideoInfo[]) => {
      setListSelectedVideo(selectedRows);
      setSelectedRowKeys(selectedRowKeys);
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
      multipleUpload: multipleUpload,
      listMail: listMail,
    };

    window.electron.ipcRenderer.sendMessage('upload-video', args);
  };

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('get-info-channel');

    window.electron.ipcRenderer.once('get-info-channel', (res) => {
      const listChannelInfo = res as ChannelInfo[];
      const channelInfoMap: Record<string, ChannelInfo> = {};

      listChannelInfo.forEach((channel) => {
        channelInfoMap[channel.id] = channel;
      });

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

    const removeGetLinkVideoMailEvent = window.electron.ipcRenderer.on(
      'get-link-video-mail',
      (res) => {
        const listVideoLink = res as string[];
        setListVideoLinkOfMail(listVideoLink);
      },
    );
    return () => {
      removeGetVideoChannelEvent();
      removeGetLinkVideoMailEvent();
    };
  }, []);

  useEffect(() => {
    if (currentKey === '2') {
      window.electron.ipcRenderer.sendMessage(
        'get-link-video-mail',
        mailInfo.mail,
      );
    }
  }, [currentKey]);

  useEffect(() => {
    setCurrentKey('1');
    setListSelectedVideo([]);
    setSelectedRowKeys([]);
  }, [isReset]);

  const openExternal = (url: string) => {
    window.electron.ipcRenderer.sendMessage('open-external', url);
  };

  return (
    <div className="">
      <Tabs
        activeKey={currentKey}
        onChange={(value) => setCurrentKey(value)}
        items={[
          {
            key: '1',
            label: 'Tải video lên',
            children: (
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
                            src={
                              channelInfoMap[(option.value as any) || 0]?.avatar
                            }
                            className="w-20 h-20 rounded-xl"
                          />
                          <span>
                            {channelInfoMap[(option.value as any) || 0]?.name}
                          </span>
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
                  <span className="text-red-600">
                    {multipleUpload !== true
                      ? mailInfo?.mail
                      : listMail.map((mail) => mail.mail).join(', ')}
                  </span>
                  ?
                  <Table
                    columns={columns}
                    dataSource={listVideo}
                    rowSelection={{
                      ...rowSelection,
                      selectedRowKeys,
                    }}
                    scroll={{ y: 250 }}
                    className="mt-4"
                  />
                  <Row justify={'end'} className="mt-4">
                    <Space>
                      <Button onClick={onDeny}>Từ chối</Button>
                      <Button
                        type="primary"
                        onClick={() => {
                          uploadById();
                        }}
                      >
                        Xác nhận
                      </Button>
                    </Space>
                  </Row>
                </div>
              </div>
            ),
          },
          {
            key: '2',
            label: 'Video hiện có trong ' + mailInfo.mail,
            children: (
              <div className="">
                <List
                  itemLayout="horizontal"
                  dataSource={listVideoLinkOfMail}
                  bordered
                  renderItem={(item) => (
                    <List.Item>
                      <span
                        onClick={() => {
                          openExternal(item);
                        }}
                        className="text-blue-500 cursor-pointer"
                      >
                        {item}
                      </span>{' '}
                      <Tooltip title="Sao chép">
                        <CopyOutlined
                          onClick={() => {
                            copy(item);
                            message.success(
                              'Sao chép đường dẫn đến video thành công',
                            );
                          }}
                          className="ml-1"
                        />
                      </Tooltip>
                    </List.Item>
                  )}
                />
              </div>
            ),
            disabled: multipleUpload,
          },
        ]}
      />
    </div>
  );
};
