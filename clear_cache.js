const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/',
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

const req = http.request(options, (res) => {
  console.log('缓存清除请求已发送');
});

req.on('error', (e) => {
  console.log('缓存清除请求失败:', e.message);
});

req.end();
