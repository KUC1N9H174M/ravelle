# Ravelle

Ravelle is a lightweight self-hosted video streaming web app with a clean dark interface, responsive layout, upload support, and playback for MP4, MKV, WEBM, TS, and HLS streams.

## Features

- Clean dark UI with responsive layout
- Video grid for desktop and mobile
- Separate search page and player page
- Video upload from the web interface
- Playback support for MP4, MKV, WEBM, TS, and M3U8 / HLS
- Thumbnail generation for supported video files
- Simple self-hosted setup using Node.js and Express

## Tech Stack

- Node.js
- Express
- Multer
- fluent-ffmpeg
- hls.js
- mpegts.js
- HTML, CSS, and JavaScript

## Project Structure

```bash
ravelle/
├── public/
│   ├── index.html
│   ├── search.html
│   ├── player.html
│   ├── style.css
│   ├── script.js
│   └── media/
├── streams/
├── thumbnails/
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── LICENSE
