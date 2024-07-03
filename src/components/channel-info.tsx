import React from 'react';
import { CrawlChannelInfoResponse } from '../models/crawl-page';
import { Skeleton } from 'antd';

export type ChannelInfo = { channelInfo?: CrawlChannelInfoResponse };
export const ChannelInfo: React.FC<ChannelInfo> = ({ channelInfo }) => {
  return (
    <div className="flex items-end">
      <div className=" relative w-full">
        <div className="absolute h-60 w-full rounded-lg overflow-hidden">
          {channelInfo?.banner != null ? (
            <img
              alt="Channel banner"
              src={channelInfo.banner}
              className="w-full h-full object-cover"
            />
          ) : (
            <Skeleton.Image active className="absolute w-full h-60" />
          )}
        </div>

        <div className=" flex gap-4 items-end relative top-52 left-6">
          <div className="w-32 h-32 overflow-hidden rounded-lg z-10 shadow-xl">
            {channelInfo?.avt != null ? (
              <img
                src={channelInfo?.avt}
                alt="Channel Image"
                className="w-full h-full object-cover "
              />
            ) : (
              <Skeleton.Image active className="absolute w-32 h-32" />
            )}
          </div>
          <Skeleton
            active
            paragraph={{ rows: 2 }}
            title={false}
            className="w-32"
            loading={
              !(
                channelInfo?.channelName != null &&
                channelInfo.totalVideo != null
              )
            }
          >
            <div className="mb-5 z-10">
              <p className="text-lg ">{channelInfo?.channelName}</p>
              <p className="text-sm text-zinc-500">
                Tổng video: {channelInfo?.totalVideo}
              </p>
            </div>
          </Skeleton>
        </div>
      </div>
    </div>
  );
};
