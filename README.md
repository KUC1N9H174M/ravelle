<p align="center">
  <img src="./img0.png" alt="Ravelle Logo" width="140">
</p>

<h1 align="center">Ravelle</h1>

<p align="center">
  A lightweight self-hosted video streaming web app with a clean dark interface, responsive layout, upload support, and playback for MP4, MKV, WEBM, TS, and HLS streams.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm">
  <img src="https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg">
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge" alt="Apache 2.0">
</p>

## Preview

### Home Page

![Ravelle Home](./assets/preview-home.png)

### Player Page

![Ravelle Player](./assets/preview-player.png)

## Features

### Core Features
- Clean dark UI
- Responsive layout for desktop and mobile
- Separate home, search, and player pages
- Built-in video upload from the web interface
- Thumbnail generation for supported videos
- Simple self-hosted setup using Node.js and Express

### Supported Formats
- MP4
- MKV
- WEBM
- TS
- M3U8 / HLS

### Web Features
- Home page with video grid
- Search page with separate route
- Player page with related videos
- Upload button in the top bar
- Mobile-friendly layout
- Local view counter display
- Custom favicon and page title support

## Tech Stack

- Node.js
- npm
- Express
- Multer
- fluent-ffmpeg
- hls.js
- mpegts.js
- HTML, CSS, and JavaScript

## Installation

Make sure the following are installed on your system:

- Node.js
- npm
- FFmpeg

Clone the repository:

```bash
git clone https://github.com/your-username/ravelle.git
cd ravelle
