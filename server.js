const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const chalk = require('chalk');

const app = express();
const STREAM_DIR = path.join(__dirname, 'streams');
const THUMB_DIR = path.join(__dirname, 'thumbnails');
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.ts', '.m3u8'];
const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  '.ts': 'video/mp2t',
  '.m3u8': 'application/vnd.apple.mpegurl',
};

if (!fs.existsSync(STREAM_DIR)) fs.mkdirSync(STREAM_DIR, { recursive: true });
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });

app.use(express.static('public'));
app.set('etag', false);
app.set('x-powered-by', false);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, STREAM_DIR),
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

function timestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}
function log(type, msg) {
  const time = chalk.gray(`[${timestamp()}]`);
  if (type === 'info') console.log(time, chalk.cyan('INFO '), msg);
  if (type === 'stream') console.log(time, chalk.magenta('STREAM'), msg);
  if (type === 'thumb') console.log(time, chalk.yellow('THUMB '), msg);
  if (type === 'req') console.log(time, chalk.green('REQ   '), msg);
  if (type === 'error') console.log(time, chalk.red('ERROR '), msg);
}
app.use((req, _res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  log('req', `${req.method} ${req.url} - ${ip}`);
  next();
});

function getVideoPath(video) {
  return path.join(STREAM_DIR, video);
}
function shouldGenerateThumbnail(video) {
  return ['.mp4', '.mkv', '.webm', '.ts'].includes(path.extname(video).toLowerCase());
}
function getThumbnailPath(video) {
  const base = video.replace(/\.[^/.]+$/, '');
  const candidates = ['.jpg', '.jpeg', '.png', '.webp'].map((ext) => path.join(THUMB_DIR, `${base}${ext}`));
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}
function generateThumbnail(video) {
  return new Promise((resolve) => {
    if (!shouldGenerateThumbnail(video)) return resolve();
    if (getThumbnailPath(video)) return resolve();
    const name = video.replace(/\.[^/.]+$/, '');
    log('thumb', `Generating thumbnail ${video}`);
    ffmpeg(getVideoPath(video))
      .screenshots({
        timestamps: ['10%'],
        filename: `${name}.jpg`,
        folder: THUMB_DIR,
        size: '640x?'
      })
      .on('end', resolve)
      .on('error', () => {
        log('error', `Thumbnail failed ${video}`);
        resolve();
      });
  });
}

app.get('/videos', async (_req, res) => {
  const files = fs.existsSync(STREAM_DIR) ? fs.readdirSync(STREAM_DIR) : [];
  const videos = files.filter((file) => VIDEO_EXTENSIONS.includes(path.extname(file).toLowerCase()));
  for (const video of videos) {
    await generateThumbnail(video);
  }
  const list = videos.map((file) => ({
    file,
    title: file.replace(/\.[^/.]+$/, ''),
    thumbnail: Boolean(getThumbnailPath(file) || shouldGenerateThumbnail(file)),
    type: path.extname(file).toLowerCase(),
  }));
  res.json(list);
});

app.post('/upload', upload.array('videos', 50), (req, res) => {
  const accepted = (req.files || []).filter((file) => VIDEO_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase()));
  const rejected = (req.files || []).filter((file) => !VIDEO_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase()));
  rejected.forEach((file) => {
    const badPath = path.join(STREAM_DIR, file.filename);
    if (fs.existsSync(badPath)) fs.unlinkSync(badPath);
  });
  res.json({ uploaded: accepted.length, rejected: rejected.map((file) => file.originalname) });
});

app.get('/thumbnail/:video', async (req, res) => {
  const videoFile = req.params.video;
  const videoPath = getVideoPath(videoFile);
  if (!fs.existsSync(videoPath)) return res.sendStatus(404);
  await generateThumbnail(videoFile);
  const thumbnailPath = getThumbnailPath(videoFile);
  if (!thumbnailPath) return res.sendStatus(404);
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(thumbnailPath);
});

app.get('/stream/:video', (req, res) => {
  const videoFile = req.params.video;
  const filePath = getVideoPath(videoFile);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';
  const range = req.headers.range;
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');
  if (!range) {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size });
    fs.createReadStream(filePath).pipe(res);
    return;
  }
  const match = /bytes=(\d+)-(\d*)/.exec(range);
  const start = match ? parseInt(match[1], 10) : 0;
  const end = match && match[2] ? parseInt(match[2], 10) : stat.size - 1;
  const chunkSize = (end - start) + 1;
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': type,
  });
  fs.createReadStream(filePath, { start, end }).pipe(res);
});

app.listen(55555, () => {
  log('info', 'RAVELLE server started');
  console.log(chalk.bold.green('▶ http://localhost:55555'));
});
