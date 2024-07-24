import { MailInfo } from '../../models/mail';
import { apiInstance } from '../../plugin/apiInstance';
import log from 'electron-log';

export const updateMailInfo = async (mailInfo: MailInfo) => {
  try {
    const response = await apiInstance.put('mails', {
      id: mailInfo.id,
      status: mailInfo.status,
    });

    return response.data;
  } catch (error) {
    log.error('Update mail info failed', error);
    throw error;
  }
};
