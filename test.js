const { createServer } = require('node:http');
const { createReadStream } = require('node:fs');
const { stat } = require('node:fs/promises');

const server = createServer(async (req, res) => {
  const filePath = 'a462ec56a0101212058ad70e4a85704c.mp4';

  const range = req.headers.range;
  const fileSize = (await stat(filePath)).size;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'video/mp4');
  if (range) {
    const ranges = range
      ? range.replace('bytes=', '').split('-')
      : ['0', `${fileSize - 1}`];
    const start = Number.parseInt(ranges[0]) || 0;
    const end = Number.parseInt(ranges[1]) || fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      res.statusCode = 416;
      res.end();
      return;
    }
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', `${end - start + 1}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.statusCode = 206;
    createReadStream(filePath, { start, end, autoClose: true }).pipe(res);
  } else {
    res.setHeader('Content-Length', `${fileSize}`);
    createReadStream(filePath).pipe(res);
  }
});

process.on('uncaughtException', err => {
  console.log(err);
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
});
