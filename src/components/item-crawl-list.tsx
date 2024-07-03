import { Avatar, List, Tag, TagProps } from 'antd';
import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { CrawlStatus, InfoVideo } from '../models/crawl-page';
import clsx from 'clsx';

export type ItemCrawlList = {
  key: React.Key;
  crawlStatusMap: Record<CrawlStatus, TagProps['color']>;
  itemCrawl: InfoVideo;
  crawlShowStatusMap: Record<string, string>;
};
export const ItemCrawlList: React.FC<ItemCrawlList> = ({
  key,
  crawlStatusMap,
  itemCrawl,
  crawlShowStatusMap,
}) => {
  return (
    <List.Item
      key={key}
      extra={
        <Tag color={crawlStatusMap[itemCrawl.status]}>
          <LoadingOutlined
            className={clsx('mr-2', {
              hidden:
                itemCrawl.status === 'error' ||
                itemCrawl.status === 'done' ||
                itemCrawl.status === 'waiting',
            })}
          />
          {crawlShowStatusMap[itemCrawl.status]}
        </Tag>
      }
    >
      <List.Item.Meta
        avatar={<Avatar src={itemCrawl.urlImage} size={60} shape="square" />}
        title={<span className="font-medium text-xl">{itemCrawl.title}</span>}
        description="13:12"
      />
    </List.Item>
  );
};
