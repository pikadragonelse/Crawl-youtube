export interface ArgCrawlData {
  channelId: string;
  quantity: number;
}

export interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
  avatar: string;
  banner: string;
}

export interface CrawlChannelInfoResponse {
  channelName: string;
  avt: string;
  banner: string;
  totalVideo: number;
}

export type InfoVideo = {
  key: number;
  title: string;
  urlImage: string;
  status: CrawlStatus;
};

export type CrawlStatus = 'waiting' | 'downloading' | 'done' | 'error';
