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

export interface ResGetTMProxy {
  code: number;
  message: string;
  data: {
    ip_allow: string;
    location_name: string;
    socks5: string;
    https: string;
    timeout: number;
    next_request: number;
    expired_at: string;
  };
}
