const { HttpsProxyAgent } = require('https-proxy-agent');

const agent = new HttpsProxyAgent(
  'http://2ac6047285789171.nbd.us.ip2world.vip:6001',
);

console.log(agent);
