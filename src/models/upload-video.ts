import { MailInfo } from './mail';

export interface UploadVideoArgs {
  mail: MailInfo;
  channelName: string;
  type: 'byId' | 'full';
  listVideoId?: string[];
}
