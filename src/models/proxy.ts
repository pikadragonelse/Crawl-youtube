export interface Proxy {
  protocol?: string;
  username?: string;
  password?: string;
  ip: string;
  port: string;
}

export const defaultProxy: Proxy = {
  username: '',
  password: '',
  ip: '',
  port: '',
};
