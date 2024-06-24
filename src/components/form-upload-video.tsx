import { Button, Row, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { MailInfo } from '../models/mail';
import { ChannelInfo } from '../models/crawl-page';
import { DefaultOptionType } from 'antd/es/select';

export type FormUploadVideo = {
  mailInfo?: MailInfo;
  onDeny?: () => void;
  onSubmit?: (channelName: string) => void;
};
export const FormUploadVideo: React.FC<FormUploadVideo> = ({
  mailInfo,
  onDeny,
  onSubmit = () => {},
}) => {
  const [listChannelInfo, setListChannelInfo] = useState<ChannelInfo[]>([]);
  const [channelInfoMap, setChannelInfoMap] =
    useState<Record<number, ChannelInfo>>();
  const [selectedKeyChannel, setSelectedKeyChannel] = useState(1);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('get-info-channel');

    window.electron.ipcRenderer.once('get-info-channel', (res) => {
      const listChannelInfo = res as ChannelInfo[];
      const channelInfoMap: Record<number, ChannelInfo> = {};

      const listOfficialChannelInfo = listChannelInfo.map((channel, index) => {
        channelInfoMap[index + 1] = channel;
        return { ...channel, key: index + 1 };
      });
      setChannelInfoMap(channelInfoMap);
      setListChannelInfo(listOfficialChannelInfo);
    });
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
              value: channel.key,
            } as DefaultOptionType;
          })}
        />
        lên kênh youtube của{' '}
        <span className="text-red-600">{mailInfo?.mail}</span>?
        <Row justify={'end'} className="mt-4">
          <Space>
            <Button onClick={onDeny}>Từ chối</Button>
            <Button
              type="primary"
              onClick={() =>
                onSubmit(
                  channelInfoMap != null
                    ? channelInfoMap[selectedKeyChannel].name
                    : '',
                )
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
