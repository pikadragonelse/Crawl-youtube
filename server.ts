import express from 'express';
import path from 'path';
import { DataSettings } from './src/models/settings';
import { loadJSONFile } from './src/utils/load-file';

const app = express();
const port = 3001;

const dataFilePath = path.join(path.resolve(), 'Data-JSON/settings.json');
const { folderPath }: DataSettings = loadJSONFile(dataFilePath);

// Đường dẫn tới folder 'channels'
const channelsPath = path.join(
  folderPath !== '' && folderPath != null ? folderPath : path.resolve(),
  'channels',
);

// Phục vụ các tệp tĩnh trong thư mục 'channels'
app.use('/channels', express.static(channelsPath));

app.get('/', (req, res) => {
  res.send(
    'Server is running. Access images at /channels/channelName/channel-info/...',
  );
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
