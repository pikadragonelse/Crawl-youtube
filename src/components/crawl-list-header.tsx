import { Progress, Tag, TagProps } from 'antd';
import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import {
  CrawlChannelInfoResponse,
  CrawlStatus,
  InfoVideo,
} from '../models/crawl-page';

const listStatus: Array<CrawlStatus> = [
  'waiting',
  'downloading',
  'done',
  'error',
];

export type CrawlListHeader = {
  listState?: Record<CrawlStatus, number>;
  listInfoVideo?: Array<InfoVideo>;
  channelInfo?: CrawlChannelInfoResponse;
  crawlStatusMap?: Record<CrawlStatus, TagProps['color']>;
  crawlShowStatusMap?: Record<string, string>;
};
export const CrawlListHeader: React.FC<CrawlListHeader> = ({
  listState = {
    waiting: 0,
    downloading: 0,
    done: 0,
    error: 0,
  },
  listInfoVideo = [],
  channelInfo,
  crawlStatusMap = {},
  crawlShowStatusMap = {},
}) => {
  return (
    <div className="flex gap-4">
      {listStatus.map((status, index) => (
        <Tag color={crawlStatusMap[status]} key={index}>
          {crawlShowStatusMap[status]}:&nbsp;{listState[status]}
        </Tag>
      ))}
      <div className="flex gap-2 items-center ml-auto">
        {listInfoVideo.length > 0 ? (
          listState['done'] === channelInfo?.totalVideo ? (
            <span>Xong</span>
          ) : (
            <LoadingOutlined />
          )
        ) : undefined}
        <Progress
          type="circle"
          percent={Number(
            (
              ((listState['done'] || 0) / (channelInfo?.totalVideo || 1)) *
              100
            ).toFixed(),
          )}
          size={20}
          strokeLinecap="butt"
          status="active"
          strokeColor={'#dc2626'}
        />
      </div>
    </div>
  );
};
