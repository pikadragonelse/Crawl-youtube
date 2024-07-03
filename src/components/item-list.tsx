import { Button, message, Modal, Row, Space, Tooltip } from 'antd';
import clsx from 'clsx';
import React, { useState } from 'react';
import { VideoInfo } from '../models/manage-page';
import { LinkOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import { VideoDetailInfo } from './video-detail-info';
import { ChannelInfo } from '../models/crawl-page';

const showMap: Record<
  string,
  { isShowSubInfo: boolean; isShowSubButton: boolean }
> = {
  channel: {
    isShowSubInfo: false,
    isShowSubButton: false,
  },
  video: {
    isShowSubInfo: true,
    isShowSubButton: true,
  },
};

export type ItemList = {
  type?: 'channel' | 'video';
  channel?: ChannelInfo;
  video?: VideoInfo;
};
export const ItemList: React.FC<ItemList> = ({
  type = 'video',
  channel,
  video,
}) => {
  const navigate = useNavigate();
  const [isOpenModal, setIsOpenModal] = useState(false);

  return (
    <div className="relative w-64 h-64 rounded-xl overflow-hidden group shadow-lg">
      <Modal
        title="Video detail"
        open={isOpenModal}
        onCancel={() => setIsOpenModal(false)}
        footer={<></>}
        className="w-[800px]"
      >
        <div className="flex justify-center mt-10">
          <VideoDetailInfo videoInfo={video} />
        </div>
      </Modal>
      <img
        src={type === 'channel' ? channel?.avatar : video?.thumbnailPath}
        alt=""
        className="w-full h-full object-cover group-hover:scale-110 transition-all"
      />
      <div className="absolute z-10 flex flex-col justify-center w-full px-2 py-4 bottom-0 bg-black/50 backdrop-blur text-zinc-50 ">
        <div className="">
          <h3 className="font-bold line-clamp-1 mb-2">
            {type === 'channel' ? channel?.name : video?.title}
          </h3>
          {/* <p className={clsx({ hidden: !showMap[type].isShowSubInfo })}>
            13:12
          </p> */}
        </div>
        <Row justify={'end'}>
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() =>
                type === 'channel'
                  ? navigate(`detail-channel/${channel?.name}`)
                  : setIsOpenModal(true)
              }
            >
              Chi tiết
            </Button>

            <Tooltip title="Lấy đường dẫn">
              <Button
                size="small"
                className={clsx({ hidden: !showMap[type].isShowSubButton })}
                icon={<LinkOutlined />}
                onClick={() => {
                  copy(video?.videoPath || '');
                  message.success('Sao chép đường dẫn thành công!');
                }}
              />
            </Tooltip>
          </Space>
        </Row>
      </div>
    </div>
  );
};
