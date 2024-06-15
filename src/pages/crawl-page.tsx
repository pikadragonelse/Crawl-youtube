import React, { useState } from 'react';
import bg from '../../assets/bg-crawl-data.jpg';
import { Button, Form, Input, Row, Select, Space } from 'antd';
import clsx from 'clsx';
import { DownloadOutlined } from '@ant-design/icons';

import { ItemList } from '../components/item-list';
import { ArgCrawlData } from '../models/crawl-page';

export const CrawlPage = () => {
  const [isStartCrawl, setIsStartCrawl] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');
  const [quantity, setQuantity] = useState(0);

  const crawlData = () => {
    window.electron.ipcRenderer.sendMessage('crawl-channel', {
      channelInput: channelUrl,
    } as ArgCrawlData);
  };

  return (
    <div className="flex-1 h-full p-4 overflow-auto">
      <div
        className={clsx(
          'w-auto h-52 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-4 text-zinc-50 flex flex-col items-center transition-all duration-300',
          {
            'mt-48': !isStartCrawl,
          },
        )}
      >
        <h1 className="text-4xl font-medium mt-10">
          Tải dữ liệu xuống từ kênh của bạn
        </h1>
        <p className="mt-5">
          Điền đường dẫn đến kênh youtube của bạn vào ô bên dưới, sau đó nhấn
          tải xuống, tất cả những video có trong kênh của bạn sẽ được lưu về máy
          một cách nhanh chóng!
        </p>
      </div>
      <div className="flex gap-2 mt-6">
        <Select
          value={quantity}
          className="w-32"
          options={[
            { label: 'Full', value: 0 },
            { label: '10', value: 10 },
          ]}
          onChange={(value) => setQuantity(value)}
        />
        <Input
          placeholder="Điền đường dẫn đến kênh của bạn!"
          value={channelUrl}
          onChange={(event) => setChannelUrl(event.target.value)}
        />
        <Button
          type="primary"
          htmlType="submit"
          icon={<DownloadOutlined className="text-xl" />}
          onClick={() => {
            setIsStartCrawl(true);
            crawlData();
          }}
        >
          Tải xuống
        </Button>
      </div>
    </div>
  );
};
