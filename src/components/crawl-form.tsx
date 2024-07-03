import { Button, Input, Select } from 'antd';
import React, { useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';

export type CrawlForm = { isDisable?: boolean; onSubmit?: () => {} };
export const CrawlForm: React.FC<CrawlForm> = ({ isDisable, onSubmit }) => {
  const [quantity, setQuantity] = useState(0);
  const [channelUrl, setChannelUrl] = useState('');

  return (
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
        placeholder="Điền ID kênh của bạn!"
        value={channelUrl}
        onChange={(event) => setChannelUrl(event.target.value)}
        disabled={isDisable}
      />
      <Button
        type="primary"
        htmlType="submit"
        icon={<DownloadOutlined className="text-xl" />}
        onClick={onSubmit}
        disabled={isDisable}
      >
        Tải xuống
      </Button>
    </div>
  );
};
