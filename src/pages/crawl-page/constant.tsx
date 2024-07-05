import { ProgressProps, TagProps } from 'antd';
import { CrawlStatus } from '../../models/crawl-page';

export const twoColors: ProgressProps['strokeColor'] = {
  '0%': '#ea580c',
  '100%': '#dc2626',
};

export const crawlStatusMap: Record<CrawlStatus, TagProps['color']> = {
  waiting: 'default',
  downloading: 'orange',
  done: 'success',
  error: 'error',
};

export const crawlShowStatusMap: Record<string, string> = {
  waiting: 'Đang đợi',
  downloading: 'Đang tải',
  done: 'Hoàn tất',
  error: 'Lỗi',
};
