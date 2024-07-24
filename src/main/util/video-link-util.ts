import log from 'electron-log';
import { apiInstance } from '../../plugin/apiInstance';
import { VideoLink } from '../../models/video-link';

export const addLinkVideo = async (videoLinkInfo: VideoLink[] | VideoLink) => {
  try {
    const response = await apiInstance.post('video-link', {
      videoLink: videoLinkInfo,
    });

    log.info('Add link video response: ', response);
  } catch (error) {
    log.error('Error adding link video', error);
  }
};
