import { Button, Input, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { DefaultOptionType } from 'antd/es/select';
import { ChannelInfo } from '../models/crawl-page';
import clsx from 'clsx';

export type CrawlForm = {
  isDisable?: boolean;
  onSubmit?: (data: { channelId: string; quantity: number }) => void;
};
export const CrawlForm: React.FC<CrawlForm> = ({
  isDisable,
  onSubmit = () => {},
}) => {
  const [quantity, setQuantity] = useState(0);
  const [channelId, setChannelId] = useState('');
  const [typeDownload, setTypeDownload] = useState<'new' | 'exist'>('new');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [channelInfoMap, setChannelInfoMap] =
    useState<Record<number, ChannelInfo>>();
  const [listChannelInfo, setListChannelInfo] = useState<ChannelInfo[]>([]);

  const resetField = () => {
    setChannelId('');
  };

  useEffect(() => {
    if (typeDownload === 'exist') {
      window.electron.ipcRenderer.sendMessage('get-info-channel');

      window.electron.ipcRenderer.once('get-info-channel', (res) => {
        const listChannelInfo = res as ChannelInfo[];
        const channelInfoMap: Record<string, ChannelInfo> = {};

        channelInfoMap[listChannelInfo[0].id] = listChannelInfo[0];

        setChannelInfoMap(channelInfoMap);
        setListChannelInfo(listChannelInfo);
        setSelectedChannelId(listChannelInfo[0].id);
      });
    }
  }, [typeDownload]);

  return (
    <div className="flex gap-2 mt-6 items-center">
      Tải
      <Select
        value={quantity}
        className="w-32"
        options={[
          { label: 'Tất cả', value: 0 },
          { label: '10', value: 10 },
          { label: '20', value: 20 },
          { label: '30', value: 30 },
        ]}
        onChange={(value) => setQuantity(value)}
      />
      video
      <Select
        className="w-52"
        value={typeDownload}
        onChange={(value) => {
          setTypeDownload(value);
          resetField();
        }}
        options={[
          { label: 'Từ kênh mới', value: 'new' },
          { label: 'Từ kênh có sẵn', value: 'exist' },
        ]}
      />
      <Input
        placeholder="Điền ID kênh của bạn!"
        value={channelId}
        onChange={(event) => setChannelId(event.target.value)}
        disabled={isDisable}
        className={clsx({
          hidden: typeDownload !== 'new',
        })}
      />
      <Select
        value={selectedChannelId}
        onChange={(value) => setSelectedChannelId(value)}
        className={clsx('w-full', {
          hidden: typeDownload === 'new',
        })}
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
      <Button
        type="primary"
        htmlType="submit"
        icon={<DownloadOutlined className="text-xl" />}
        onClick={() =>
          onSubmit({
            channelId: typeDownload === 'new' ? channelId : selectedChannelId,
            quantity: quantity,
          })
        }
        disabled={isDisable}
      >
        Tải xuống
      </Button>
    </div>
  );
};
