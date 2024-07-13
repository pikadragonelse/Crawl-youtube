export interface MailInfo {
  key?: number;
  mail: string;
  password: string;
  recoverMail: string;
  status: 'uploaded' | 'not upload' | 'dead' | 'errorUploading';
}

export const defaultMailInfo: MailInfo = {
  key: 0,
  mail: '',
  password: '',
  recoverMail: '',
  status: 'not upload',
};
