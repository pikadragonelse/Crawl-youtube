export interface ArgCrawlData {
  channelInput: string;
}

export interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
}

export interface ChannelInfo {
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
  status: 'waiting' | 'downloading' | 'done' | 'error';
};
