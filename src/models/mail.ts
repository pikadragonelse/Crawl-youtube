export interface MailInfo {
  key?: number;
  id?: number;
  mail: string;
  password: string;
  recoverMail: string;
  status?: 'uploaded' | 'not upload' | 'dead' | 'errorUploading';
  video_links?: string[];
}

export interface MailInfoServer {
  id: number;
  address: string;
  password: string;
  recover_mail: string;
  status: 'uploaded' | 'not upload' | 'dead' | 'errorUploading';
  video_links: string[];
  isInTrash: boolean;
  uploadedAt: string;
  createdAt: string;
}

export interface ResGetMail {
  mails: MailInfo[];
  totalPages: number;
  currentPage: number;
  totalMails: number;
}

export const defaultMailInfo: MailInfo = {
  key: 0,
  id: 0,
  mail: '',
  password: '',
  recoverMail: '',
  status: 'not upload',
  video_links: [],
};
