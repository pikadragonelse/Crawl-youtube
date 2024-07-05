import React, { useEffect, useState } from 'react';
import { Button, Input, List, Pagination, Select } from 'antd';
import clsx from 'clsx';
import { DownloadOutlined } from '@ant-design/icons';
import {
  ArgCrawlData,
  CrawlChannelInfoResponse,
  CrawlStatus,
  InfoVideo,
} from '../../models/crawl-page';
import { ChannelInfoUI } from '../../components/channel-info';
import { CrawlListHeader } from '../../components/crawl-list-header';
import { crawlShowStatusMap, crawlStatusMap } from './constant';
import { ItemCrawlList } from '../../components/item-crawl-list';
import { CrawlForm } from '../../components/crawl-form';

export const CrawlPage = () => {
  const [isStartCrawl, setIsStartCrawl] = useState(false);
  const [isCanCrawl, setIsCanCrawl] = useState(true);

  const [listInfoVideo, setListInfoVideo] = useState<Array<InfoVideo>>([]);
  const [listState, setListState] = useState<Record<CrawlStatus, number>>({
    waiting: 0,
    downloading: 0,
    done: 0,
    error: 0,
  });
  const [channelInfo, setChannelInfo] = useState<CrawlChannelInfoResponse>();

  const crawlData = (data: { channelId: string; quantity: number }) => {
    setIsCanCrawl(false);

    window.electron.ipcRenderer.sendMessage(
      'crawl-channel',
      data as ArgCrawlData,
    );
  };

  const handledListState = () => {
    const newListState: Record<string, number> = {
      waiting: 0,
      downloading: 0,
      done: 0,
      error: 0,
    };
    listInfoVideo.forEach((info) => {
      newListState[info.status]++;
    });
    setListState(newListState);
  };

  useEffect(() => {
    handledListState();
  }, [listInfoVideo]);

  useEffect(() => {
    window.electron.ipcRenderer.once('crawl-channel-info', (res) => {
      const response = res as CrawlChannelInfoResponse;
      setChannelInfo(response);
    });

    const removeCrawlChannelProcessEvent = window.electron.ipcRenderer.on(
      'crawl-channel-process',
      (res) => {
        const newListVideoInfo = res as InfoVideo[];
        setListInfoVideo(newListVideoInfo);
      },
    );

    return () => {
      removeCrawlChannelProcessEvent();
    };
  }, []);

  useEffect(() => {
    const totalRun =
      listState.waiting +
      listState.done +
      listState.downloading +
      listState.error;
    if (totalRun === listInfoVideo.length) {
      setIsCanCrawl(true);
    }
  }, [listState]);

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
          Điền ID kênh youtube của bạn vào ô bên dưới, sau đó nhấn tải xuống,
          tất cả những video có trong kênh sẽ được lưu về máy một cách nhanh
          chóng!
        </p>
      </div>
      <CrawlForm
        isDisable={!isCanCrawl}
        onSubmit={(data) => {
          setIsStartCrawl(true);
          crawlData(data);
        }}
      />
      <div
        className={clsx(
          'h-fit overflow-hidden transition-all opacity-100 duration-500',
          {
            'h-0 max-h-0 opacity-0 translate-y-72': !isStartCrawl,
          },
        )}
      >
        <div className="mt-6 flex gap-4 ml-6">
          <div className="w-full">
            <div className="">
              <h1 className="text-lg font-medium mb-4">Thông tin kênh</h1>
              <ChannelInfoUI channelInfo={channelInfo} />
            </div>
            <div className="mt-64 ">
              <h1 className="text-lg font-medium mb-4">Danh sách video</h1>
              <List
                header={
                  <CrawlListHeader
                    listState={listState}
                    channelInfo={channelInfo}
                    listInfoVideo={listInfoVideo}
                    crawlStatusMap={crawlStatusMap}
                    crawlShowStatusMap={crawlShowStatusMap}
                  />
                }
                dataSource={listInfoVideo}
                bordered
                className="max-h-[500px] overflow-auto"
                renderItem={(item, index) => (
                  <ItemCrawlList
                    key={index}
                    crawlShowStatusMap={crawlShowStatusMap}
                    crawlStatusMap={crawlStatusMap}
                    itemCrawl={item}
                  />
                )}
              />
              <div className="w-fit ml-auto mt-4 ">
                <Pagination
                  total={Math.ceil(listInfoVideo.length / 10)}
                  pageSize={10}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
