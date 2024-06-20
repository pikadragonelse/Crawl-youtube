export interface VideoInfo {
  id: string;
  title: string;
  thumbnailPath: string;
  videoPath: string;
  videoLinkToShow: string;
}

export interface ChannelInfo {
  name: string;
  avtPath: string;
  bannerPath: string;
  videos?: VideoInfo[];
}
