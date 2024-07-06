import path from 'path';
import { MailInfo } from '../../models/mail';
import { loadJSONFile } from '../../utils/load-file';
import { writeFileSync } from 'fs';

export const updateMailInfo = (mailInfo: MailInfo) => {
  const dataFilePath = path.join(path.resolve(), 'Data-JSON/mail-info.json');
  let listMail: MailInfo[] = loadJSONFile(dataFilePath) || [];
  listMail.forEach((mail) => {
    if (mail.mail === mailInfo.mail) {
      mail.status = mailInfo.status;
    }
  });
  writeFileSync(dataFilePath, JSON.stringify(listMail, null, 2));
  return listMail;
};
