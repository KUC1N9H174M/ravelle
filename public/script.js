const pageType = document.body.dataset.page;
const grid = document.getElementById('videos');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const searchCaption = document.getElementById('searchCaption');
const relatedVideos = document.getElementById('relatedVideos');
const player = document.getElementById('videoPlayer');
const playerTitle = document.getElementById('playerTitle');
const playerMeta = document.getElementById('playerMeta');
const uploadButton = document.getElementById('uploadButton');
const uploadInput = document.getElementById('uploadInput');
const params = new URLSearchParams(window.location.search);
const currentVideo = params.get('video') || '';
const currentQuery = params.get('q') || '';
let allVideos = [];
let tsPlayer = null;

function prettyTitle(fileName = '') {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function getStoredViews(fileName = '') {
  const key = `ravelle:view:${fileName}`;
  const value = Number(localStorage.getItem(key) || 0);
  return Number.isFinite(value) ? value : 0;
}
function incrementViews(fileName = '') {
  const key = `ravelle:view:${fileName}`;
  const next = getStoredViews(fileName) + 1;
  localStorage.setItem(key, String(next));
  return next;
}
function formatViews(count = 0) { return `${count} views`; }
function createPlaceholder(title = 'Video') {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#181818'/><stop offset='100%' stop-color='#2b2b2b'/></linearGradient></defs><rect width='1280' height='720' fill='url(#g)'/><polygon points='560,248 560,470 768,360' fill='rgba(255,255,255,.9)'/><rect x='82' y='580' width='500' height='48' rx='24' fill='rgba(255,255,255,.08)'/><text x='104' y='611' fill='rgba(255,255,255,.74)' font-size='26' font-family='Poppins, Arial, sans-serif'>${title.slice(0, 30)}</text></svg>`)}`;
}
function videoThumb(video) { return video.thumbnail ? `/thumbnail/${encodeURIComponent(video.file)}` : createPlaceholder(video.title); }
function openPlayer(fileName) { window.location.href = `/player.html?video=${encodeURIComponent(fileName)}`; }

function renderVideoGrid(items) {
  if (!grid || !emptyState) return;
  grid.innerHTML = '';
  emptyState.classList.toggle('hidden', items.length > 0);
  items.forEach((video) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'yt-card';
    card.innerHTML = `<div class="yt-thumb-wrap"><img class="yt-thumb" src="${videoThumb(video)}" alt="${video.title}" loading="lazy"></div><div class="yt-title-row"><h3 class="yt-title">${video.title}</h3></div>`;
    const image = card.querySelector('.yt-thumb');
    image.addEventListener('error', () => { image.src = createPlaceholder(video.title); }, { once: true });
    card.addEventListener('click', () => openPlayer(video.file));
    grid.appendChild(card);
  });
}
function renderSkeletons() {
  if (!grid) return;
  grid.innerHTML = Array.from({ length: 8 }, () => `<div class="skeleton-card"><div class="skeleton-thumb"></div><div><div class="skeleton-line long"></div><div class="skeleton-line short"></div></div></div>`).join('');
}
function filterByQuery(items, query) {
  const keyword = (query || '').trim().toLowerCase();
  if (!keyword) return items;
  return items.filter((video) => `${video.title} ${video.file}`.toLowerCase().includes(keyword));
}
function renderRelatedVideos(items) {
  if (!relatedVideos) return;
  const related = items.filter((video) => video.file !== currentVideo).slice(0, 14);
  relatedVideos.innerHTML = '';
  related.forEach((video) => {
    const link = document.createElement('a');
    link.className = 'related-card';
    link.href = `/player.html?video=${encodeURIComponent(video.file)}`;
    link.innerHTML = `<img class="related-thumb" src="${videoThumb(video)}" alt="${video.title}" loading="lazy"><div><div class="related-title">${video.title}</div><div class="related-meta">${formatViews(getStoredViews(video.file))}</div></div>`;
    const image = link.querySelector('.related-thumb');
    image.addEventListener('error', () => { image.src = createPlaceholder(video.title); }, { once: true });
    relatedVideos.appendChild(link);
  });
}
function destroyTsPlayer() {
  if (tsPlayer) {
    tsPlayer.destroy();
    tsPlayer = null;
  }
}
function attachPlayerSource(fileName) {
  if (!player) return;
  destroyTsPlayer();
  const ext = `.${(fileName.split('.').pop() || '').toLowerCase()}`;
  const streamUrl = `/stream/${encodeURIComponent(fileName)}`;
  if (ext === '.m3u8') {
    if (window.Hls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(player);
      return;
    }
    player.src = streamUrl;
    return;
  }
  if (ext === '.ts' && window.mpegts && mpegts.getFeatureList().mseLivePlayback) {
    tsPlayer = mpegts.createPlayer({ type: 'mpegts', url: streamUrl });
    tsPlayer.attachMediaElement(player);
    tsPlayer.load();
    return;
  }
  player.src = streamUrl;
}
function setupPlayer(fileName) {
  if (!player || !playerTitle) return;
  if (!fileName) {
    playerTitle.textContent = 'Video not found';
    if (playerMeta) playerMeta.textContent = '';
    document.title = 'Ravelle | Player';
    return;
  }
  const title = prettyTitle(fileName) || 'Video';
  const views = incrementViews(fileName);
  playerTitle.textContent = title;
  if (playerMeta) playerMeta.textContent = formatViews(views);
  document.title = `Ravelle | ${title}`;
  attachPlayerSource(fileName);
}
async function uploadVideos(files) {
  if (!files?.length) return;
  const picked = Array.from(files).slice(0, 50);
  const formData = new FormData();
  picked.forEach((file) => formData.append('videos', file));
  uploadButton.disabled = true;
  uploadButton.textContent = 'Uploading..';
  try {
    await fetch('/upload', { method: 'POST', body: formData });
    window.location.reload();
  } catch (_error) {
    uploadButton.disabled = false;
    uploadButton.textContent = 'Upload';
    alert('Upload gagal.');
  }
}
async function loadVideos() {
  if (grid) renderSkeletons();
  try {
    const response = await fetch('/videos');
    const videos = await response.json();
    allVideos = videos.map((video) => ({ ...video, title: video.title || prettyTitle(video.file) }));
    if (pageType === 'home') renderVideoGrid(allVideos);
    if (pageType === 'search') {
      if (searchInput) searchInput.value = currentQuery;
      if (searchCaption) searchCaption.textContent = currentQuery ? `Results for “${currentQuery}”` : 'Search results';
      renderVideoGrid(filterByQuery(allVideos, currentQuery));
    }
    if (pageType === 'player') {
      setupPlayer(currentVideo);
      renderRelatedVideos(allVideos);
    }
  } catch (_error) {
    if (grid && emptyState) {
      grid.innerHTML = '';
      emptyState.textContent = 'Failed to load video list.';
      emptyState.classList.remove('hidden');
    }
  }
}
if (searchInput && currentQuery) searchInput.value = currentQuery;
if (uploadButton && uploadInput) {
  uploadButton.addEventListener('click', () => uploadInput.click());
  uploadInput.addEventListener('change', () => uploadVideos(uploadInput.files));
}
loadVideos();
window.addEventListener('beforeunload', destroyTsPlayer);
