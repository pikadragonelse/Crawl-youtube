import { BrowserContext } from 'puppeteer';
import { Proxy } from './proxy';

export interface CreateProfileInfo {
  key?: React.Key;
  email: '';
  proxyHost?: string;
  proxyPort?: number;
  proxyUser?: string;
  proxyPass?: string;
  proxy?: string;
}

export interface ProfileItem {
  key?: React.Key;
  proxy: string;
  parsedProxy: Proxy | null;
  email: string;
  process?: null | BrowserContext;
  proxyHost?: string;
  proxyPass?: string;
  proxyPort?: number;
  proxyUser?: string;
  position?: string;
}

export const defaultProfileItem: ProfileItem = {
  key: '',
  proxy: '',
  parsedProxy: null,
  email: '',
  process: null,
  proxyHost: '',
  proxyPass: '',
  proxyPort: 0,
  proxyUser: '',
  position: '',
};
