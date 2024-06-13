import React, { useState } from 'react';
import bg from '../../assets/bg-crawl-data.jpg';
import { Button, Form, Input, Row, Space } from 'antd';
import clsx from 'clsx';
import { DownloadOutlined } from '@ant-design/icons';
import img1 from '../../assets/images-item/1.jpg';
import img2 from '../../assets/images-item/2.jpg';
import img3 from '../../assets/images-item/3.jpg';
import img8 from '../../assets/images-item/8.jpg';

import { ItemList } from '../components/item-list';

const listImage = [
  img1,
  img2,
  img3,
  img1,
  img2,
  img3,
  img1,
  img2,
  img3,
  img1,
  img2,
  img3,
];

export const CrawlPage = () => {
  const [isStartCrawl, setIsStartCrawl] = useState(false);

  const crawlData = () => {
    window.electron.ipcRenderer.sendMessage('crawl-channel');
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
        <Input placeholder="Điền đường dẫn đến kênh của bạn!" />
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
      <div className="mt-20">
        <div className="w-fit mx-auto">
          <h1 className="text-3xl font-medium mb-10 bg-gradient-to-r from-red-600 to-orange-600 inline-block text-transparent bg-clip-text">
            Thông tin tải về
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-32 h-32 rounded-xl overflow-hidden">
            <img src={img8} alt="" className="w-full h-full object-cover " />
          </div>
          <div className="">
            <h1 className="text-2xl mb-2">Tấu hài mỗi ngày</h1>
            <h2 className="text-sm text-zinc-600">Nguyễn Ngọc Bảo Long</h2>
          </div>
        </div>
        <div className="my-10 min-h-[500px]">
          <h2 className="font-medium">Video: </h2>
          <div className="flex gap-2 flex-wrap justify-between">
            {listImage.map((img, index) => (
              <ItemList src={img} key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
