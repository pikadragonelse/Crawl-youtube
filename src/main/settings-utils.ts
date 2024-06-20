import fs from 'fs';

export const loadSettings = (dataFilePath: string) => {
  if (fs.existsSync(dataFilePath)) {
    const rawData = fs.readFileSync(dataFilePath);
    return JSON.parse(rawData.toString());
  }
  return {};
};
