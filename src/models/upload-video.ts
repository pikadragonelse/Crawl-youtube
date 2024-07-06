import { MailInfo } from './mail';

export interface UploadVideoArgs {
  mail: MailInfo;
  channelName: string;
  type: 'byId' | 'full';
  multipleUpload?: boolean;
  listVideoId?: string[];
  listMail?: MailInfo[];
}
