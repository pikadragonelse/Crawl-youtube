export interface MailInfo {
  key?: number;
  mail: string;
  password: string;
  recoverMail: string;
}

export const defaultMailInfo = {
  key: 0,
  mail: '',
  password: '',
  recoverMail: '',
};
