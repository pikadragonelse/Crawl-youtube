export interface ArgCrawlData {
  channelId: string;
  quantity: number;
}

export interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
}

export interface ChannelInfo {
  id: string;
  idServer: number;
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
  duration: number;
};

export type CrawlStatus = 'waiting' | 'downloading' | 'done' | 'error';
