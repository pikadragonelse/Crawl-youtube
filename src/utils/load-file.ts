import fs from 'fs';
import log from 'electron-log';

export const loadJSONFile = (dataFilePath: string) => {
  if (fs.existsSync(dataFilePath)) {
    const rawData = fs.readFileSync(dataFilePath);
    if (rawData.toString() !== '') {
      return JSON.parse(rawData.toString());
    } else {
      return;
    }
  }
  return;
};
