import express from 'express';
import path from 'path';

const app = express();
const port = 3001;

// Đường dẫn tới folder 'channels'
const channelsPath = path.join(path.resolve(), 'channels');

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
