import axios from 'axios';
import log from 'electron-log';

export function triggerRestart() {
  axios
    .get(`http://localhost:3001/restart`)
    .then((response) => {
      log.info('Restart triggered:', response.data);
    })
    .catch((error) => {
      log.error('Error triggering restart:', error);
    });
}
