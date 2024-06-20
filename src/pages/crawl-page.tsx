import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Input,
  List,
  Pagination,
  Progress,
  ProgressProps,
  Select,
  Skeleton,
  Tag,
  TagProps,
} from 'antd';
import clsx from 'clsx';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import {
  ArgCrawlData,
  CrawlChannelInfoResponse,
  InfoVideo,
} from '../models/crawl-page';
export const twoColors: ProgressProps['strokeColor'] = {
  '0%': '#ea580c',
  '100%': '#dc2626',
};

const statusMap: Record<
  'waiting' | 'downloading' | 'done' | 'error',
  TagProps['color']
> = {
  waiting: 'default',
  downloading: 'orange',
  done: 'success',
  error: 'error',
};

const listStatus: Array<'waiting' | 'downloading' | 'done' | 'error'> = [
  'waiting',
  'downloading',
  'done',
  'error',
];

const showStatusMap: Record<string, string> = {
  waiting: 'Đang đợi',
  downloading: 'Đang tải',
  done: 'Hoàn tất',
  error: 'Lỗi',
};

export const CrawlPage = () => {
  const [isStartCrawl, setIsStartCrawl] = useState(false);
  const [isCanCrawl, setIsCanCrawl] = useState(true);
  const [channelUrl, setChannelUrl] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [listInfoVideo, setListInfoVideo] = useState<Array<InfoVideo>>([]);
  const [listState, setListState] = useState<
    Record<'waiting' | 'downloading' | 'done' | 'error', number>
  >({
    waiting: 0,
    downloading: 0,
    done: 0,
    error: 0,
  });
  const [channelInfo, setChannelInfo] = useState<CrawlChannelInfoResponse>();

  const crawlData = () => {
    setIsCanCrawl(false);
    window.electron.ipcRenderer.sendMessage('crawl-channel', {
      channelInput: channelUrl,
    } as ArgCrawlData);
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
          disabled={!isCanCrawl}
        />
        <Button
          type="primary"
          htmlType="submit"
          icon={<DownloadOutlined className="text-xl" />}
          onClick={() => {
            setIsStartCrawl(true);
            crawlData();
          }}
          disabled={!isCanCrawl}
        >
          Tải xuống
        </Button>
      </div>
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
            </div>
            <div className="mt-64 ">
              <h1 className="text-lg font-medium mb-4">Danh sách video</h1>
              <List
                header={
                  <div className="flex gap-4">
                    {listStatus.map((status, index) => (
                      <Tag color={statusMap[status]} key={index}>
                        {showStatusMap[status]}:&nbsp;{listState[status]}
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
                            ((listState['done'] || 0) /
                              (channelInfo?.totalVideo || 1)) *
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
                }
                dataSource={listInfoVideo}
                bordered
                className="max-h-[500px] overflow-auto"
                renderItem={(item, index) => (
                  <List.Item
                    key={index}
                    extra={
                      <Tag color={statusMap[item.status]}>
                        <LoadingOutlined
                          className={clsx('mr-2', {
                            hidden:
                              item.status === 'error' ||
                              item.status === 'done' ||
                              item.status === 'waiting',
                          })}
                        />
                        {showStatusMap[item.status]}
                      </Tag>
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar src={item.urlImage} size={60} shape="square" />
                      }
                      title={
                        <span className="font-medium text-xl">
                          {item.title}
                        </span>
                      }
                      description="13:12"
                    />
                  </List.Item>
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
