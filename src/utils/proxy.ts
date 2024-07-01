import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import log from 'electron-log';
import { Proxy } from '../models/proxy';

export async function getIp(proxy: Proxy | null = null) {
  var resp = null;
  if (proxy) {
    let scheme = proxy.protocol == 'http' ? 'http' : 'socks5h';
    var proxyOption = '';
    if (proxy.username) {
      console.log(proxy.username);
      proxyOption = `${scheme}://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
    } else {
      proxyOption = `${scheme}://${proxy.ip}:${proxy.port}`;
    }
    console.log(proxyOption);
    try {
      if (scheme == 'http') {
        const httpsAgent = new HttpsProxyAgent(proxyOption);
        resp = await axios.get('https://icanhazip.com/', { httpsAgent });
      } else {
        const httpsAgent = new SocksProxyAgent(proxyOption);
        resp = await axios.get('https://icanhazip.com/', {
          httpsAgent,
          httpAgent: httpsAgent,
        });
      }
    } catch (e) {
      log.error(e);
      return null;
    }
  } else {
    resp = await axios.get('https://icanhazip.com/');
  }
  return resp.data;
}

export const parseProxyModel: (
  proxy: string,
  proxy_protocol: 'http' | 'socks5h',
) => Proxy | null = (proxy: string, proxy_protocol = 'http') => {
  if (proxy) {
    let proxyArr = proxy.split(':');
    if (proxyArr.length < 2) {
      return null;
    }
    if (proxyArr.length == 4) {
      return {
        protocol: proxy_protocol,
        username: proxyArr[2],
        password: proxyArr[3],
        ip: proxyArr[0],
        port: proxyArr[1],
      };
    } else {
      return {
        protocol: proxy_protocol,
        ip: proxyArr[0],
        port: proxyArr[1],
      };
    }
  } else {
    return null;
  }
};
