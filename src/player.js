'use strict';
// =====================================================================
// player.js — 主循环与播放器：
//   render(t) 纯函数式渲染（逻辑 1920×1080，等比缩放 + 黑边 + devicePixelRatio）
//   时钟：未加载音频用 performance.now；加载音频后播放时以 audio.currentTime 为准
//   控制：播放/暂停(空格)、←/→ ±5 秒、F 全屏、H 隐藏 UI、进度条拖动、
//         加载音频、录制视频（captureStream(60) + MediaRecorder → webm）
//   URL 参数：?t=95 跳转；&pause=1 保持暂停；&ui=0 隐藏控制浮层
//             带 t 参数时在加载时同步渲染该帧（不等 rAF），便于无头截图
// =====================================================================

// ---- 占位场景（scenes_*.js 未登记的场景使用） ----
const PLACEHOLDER_TINT = {
  S0: ['#07070f', '#141a33'], S1: ['#141a33', '#262b5a'], S2: ['#262b5a', '#07070f'],
  S3: ['#1d2350', '#3a2f6b'], S4: ['#3a1f4a', '#141a33'], S5: ['#1b2240', '#2b3460'],
  S6: ['#2a2358', '#0d0f22'], S7: ['#4a1f45', '#141a33'], S8: ['#2b1840', '#0d1030'],
  S9: ['#141a33', '#07070f']
};
function fmtTime(t) {
  const s = Math.max(0, Math.floor(t + 1e-6));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
function drawPlaceholderScene(ctx, t, lt, sc) {
  const c = PLACEHOLDER_TINT[sc.id] || [PAL.night, PAL.indigo];
  fillSky(ctx, c[0], c[1]);
  const beat = beatPulse(t) * beatGainAt(t);
  drawBokeh(ctx, t, { count: 28, seed: 7, color: PAL.meGlow, alpha: 0.12, pulse: beat });
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 760, W, H - 760);
  drawText(ctx, sc.id + ' · ' + sc.title + '（占位）', SAFE.x, SAFE.y + 30, 40, PAL.cream, { align: 'left', alpha: 0.75 });
  drawText(ctx, fmtTime(t) + ' / ' + fmtTime(TOTAL), SAFE.x, SAFE.y + 84, 28, PAL.cream, { align: 'left', alpha: 0.5, weight: 600, family: FONT_EN });
  const k = prog(t, sc.start, sc.end);
  fillRoundRect(ctx, SAFE.x, SAFE.y + 112, 420, 8, 4, 'rgba(255,244,224,0.15)');
  if (k > 0) fillRoundRect(ctx, SAFE.x, SAFE.y + 112, Math.max(8, 420 * k), 8, 4, PAL.me);
  const bob = Math.sin(t * 2.4) * 8;
  drawMe(ctx, 760, 700 + bob * 0.3, { t: t, r: 60, look: Math.sin(t * 0.7), squash: 1 + 0.06 * beat, groundY: 760, glow: 0.5 + 0.4 * beat });
  drawYou(ctx, 1160, 682, { t: t, r: 78, look: -0.6, groundY: 760 });
  drawHeart(ctx, 960, 640 + bob, 26 * (1 + 0.15 * beat), { fill: PAL.heart });
}

// ---- 播放器（包在 IIFE 中，避免与场景文件的全局名冲突；对外只暴露 window.MG） ----
(function () {
// ---- 元素与状态 ----
const canvas = document.getElementById('mg');
const ctx = canvas.getContext('2d', { alpha: false });
const ui = {
  root: document.getElementById('ui'), play: document.getElementById('btnPlay'),
  time: document.getElementById('timeLabel'), bar: document.getElementById('bar'),
  fill: document.getElementById('barFill'), knob: document.getElementById('barKnob'),
  btnAudio: document.getElementById('btnAudio'), file: document.getElementById('audioFile'),
  btnRec: document.getElementById('btnRec'), btnFs: document.getElementById('btnFs'),
  badge: document.getElementById('recBadge'), toast: document.getElementById('toast')
};
const P = {
  t: 0, playing: false, base: 0, dirty: true, bw: W, bh: H,
  audio: null, audioURL: null, audioReady: false, audioEnded: false, audioCtx: null, srcNode: null, recDest: null,
  recording: null, dragging: false, wasPlaying: false,
  uiOff: false, uiForcedHidden: false, uiIdleHidden: false, idleTimer: 0,
  lastLabel: '', lastPct: -1, lastBadge: ''
};
const _reported = new Set();
function reportOnce(err) {
  const msg = '[render] ' + (err && err.stack ? err.stack : String(err));
  if (_reported.has(msg)) return;
  _reported.add(msg);
  if (window.__reportError) window.__reportError(msg);
}

// ---- 渲染 ----
// t = 原曲时间；场景与歌词按分镜时间 τ 绘制（timeline.js 的 SYNC 表负责换算），
// 节拍函数内部再用 songTime(τ) 换回原曲时间，保证节拍速度恒定。
function renderFrame(c, t) {
  const tau = clamp(storyTime(t), 0, TOTAL);
  const sc = findScene(tau);
  c.save(); sc.draw(c, tau, tau - sc.start, sc); c.restore();
  c.save(); drawLyrics(c, tau, sc); c.restore();
}
function render(t) {
  const tt = clamp(t, 0, TOTAL);
  ctx.setTransform(P.bw / W, 0, 0, P.bh / H, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  try { renderFrame(ctx, tt); } catch (err) { reportOnce(err); }
  ctx.restore();
}
// 等比缩放 + 居中黑边；录制时 backing store 固定 1920×1080
function resize() {
  const iw = window.innerWidth || W, ih = window.innerHeight || H;
  const s = Math.min(iw / W, ih / H);
  const cw = Math.max(1, Math.round(W * s)), ch = Math.max(1, Math.round(H * s));
  canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
  canvas.style.left = Math.round((iw - cw) / 2) + 'px'; canvas.style.top = Math.round((ih - ch) / 2) + 'px';
  const dpr = window.devicePixelRatio || 1;
  const bw = P.recording ? W : Math.round(cw * dpr), bh = P.recording ? H : Math.round(ch * dpr);
  if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
  P.bw = bw; P.bh = bh; P.dirty = true;
}

// ---- 时钟 ----
function nowS() { return performance.now() / 1000; }
function clockTime() {
  if (!P.playing) return P.t;
  if (P.audioReady && !P.audioEnded) return P.audio.currentTime;
  return nowS() - P.base;
}
function play() {
  if (P.playing) return;
  let t = P.t;
  if (t >= TOTAL - 0.001) t = 0;
  P.t = t; P.base = nowS() - t; P.playing = true; P.audioEnded = false;
  if (P.audioReady) {
    try { P.audio.currentTime = t; } catch (e) { /* 忽略 */ }
    const pr = P.audio.play();
    if (pr && pr.catch) pr.catch(function (err) { toast('音频无法播放：' + err.message); });
  }
  P.dirty = true; updatePlayBtn();
}
function pause() {
  if (!P.playing) return;
  P.t = clamp(clockTime(), 0, TOTAL);
  P.playing = false;
  if (P.audio) P.audio.pause();
  P.dirty = true; updatePlayBtn();
}
function togglePlay() { if (P.playing) pause(); else play(); }
function seek(t) {
  const tt = clamp(t, 0, TOTAL);
  P.t = tt; P.base = nowS() - tt;
  if (P.audioReady) { try { P.audio.currentTime = tt; } catch (e) { /* 忽略 */ } }
  render(tt); updateUI(tt); P.dirty = false;
}

// ---- 主循环 ----
function tick() {
  let t = clockTime();
  if (t >= TOTAL) {
    t = TOTAL;
    if (P.playing) {
      P.playing = false; P.t = TOTAL;
      if (P.audio) P.audio.pause();
      updatePlayBtn();
      P.dirty = true;
      if (P.recording) stopRecording();
    }
  }
  if (P.playing || P.dirty) {
    if (P.playing) P.t = t;
    render(P.t); updateUI(P.t); P.dirty = false;
  }
  if (P.recording) updateRecBadge(P.t);
  requestAnimationFrame(tick);
}

// ---- UI ----
function updatePlayBtn() {
  ui.play.textContent = P.playing ? '❚❚' : '▶';
  ui.play.setAttribute('aria-label', P.playing ? '暂停' : '播放');
}
function updateUI(t) {
  const label = fmtTime(t) + ' / ' + fmtTime(TOTAL);
  if (label !== P.lastLabel) {
    P.lastLabel = label; ui.time.textContent = label;
    ui.bar.setAttribute('aria-valuenow', String(Math.floor(t)));
    ui.bar.setAttribute('aria-valuetext', label);
  }
  const pct = Math.round(t / TOTAL * 10000) / 100;
  if (pct !== P.lastPct) { P.lastPct = pct; ui.fill.style.width = pct + '%'; ui.knob.style.left = pct + '%'; }
}
function applyUIVisibility() {
  ui.root.classList.toggle('off', P.uiOff);
  const hide = P.uiForcedHidden || P.uiIdleHidden || !!P.recording;
  ui.root.classList.toggle('hidden', hide);
  document.body.classList.toggle('cursor-hidden', (hide || P.uiOff) && P.playing);
}
// 有操作时显示 UI，静止 2.5 秒后自动隐藏
function poke() {
  P.uiIdleHidden = false;
  clearTimeout(P.idleTimer);
  P.idleTimer = setTimeout(function () {
    if (!P.dragging && !ui.root.contains(document.activeElement)) { P.uiIdleHidden = true; applyUIVisibility(); }
    else poke();
  }, 2500);
  applyUIVisibility();
}
function toggleUI() {
  if (P.uiOff) { P.uiOff = false; P.uiForcedHidden = false; }
  else P.uiForcedHidden = !P.uiForcedHidden;
  if (!P.uiForcedHidden) poke(); else applyUIVisibility();
}
let _toastTimer = 0;
function toast(msg) {
  ui.toast.textContent = msg; ui.toast.hidden = false;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () { ui.toast.hidden = true; }, 4500);
}
function toggleFullscreen() {
  if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen().catch(function () {}); }
  else if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(function (err) { toast('无法进入全屏：' + err.message); });
  }
}
function barTime(clientX) {
  const r = ui.bar.getBoundingClientRect();
  return clamp((clientX - r.left) / Math.max(1, r.width), 0, 1) * TOTAL;
}

// ---- 音频 ----
function loadAudio(file) {
  const wasPlaying = P.playing;
  pause();
  const t = P.t;
  if (!P.audio) {
    // 只创建一个 audio 元素（createMediaElementSource 每个元素只能调用一次）
    P.audio = new Audio();
    P.audio.preload = 'auto';
    P.audio.addEventListener('ended', function () {
      if (!P.playing) return;
      // 录制中音频提前结束（短于 257 秒）：切回内部时钟继续走到 257 秒，由 tick() 停止录制，
      // 这样导出的视频仍包含片尾定格；普通播放保持原行为（停在音频结束处）
      if (P.recording && P.audio.currentTime < TOTAL) { P.audioEnded = true; P.base = nowS() - P.audio.currentTime; }
      else pause();
    });
  }
  if (P.audioURL) URL.revokeObjectURL(P.audioURL);
  P.audioReady = false;
  P.audioURL = URL.createObjectURL(file);
  const a = P.audio;
  const onMeta = function () {
    a.removeEventListener('loadedmetadata', onMeta); a.removeEventListener('error', onErr);
    P.audioReady = true;
    try { a.currentTime = Math.min(t, a.duration || t); } catch (e) { /* 忽略 */ }
    ui.btnAudio.textContent = '音频：' + file.name; ui.btnAudio.title = file.name;
    toast('已加载音频（' + fmtTime(a.duration || 0) + '），播放时钟已切换为音频时间');
    if (wasPlaying) play();
  };
  const onErr = function () {
    a.removeEventListener('loadedmetadata', onMeta); a.removeEventListener('error', onErr);
    toast('音频加载失败，请换一个文件（支持浏览器可播放的 mp3 / m4a / ogg / wav 等）');
  };
  a.addEventListener('loadedmetadata', onMeta);
  a.addEventListener('error', onErr);
  a.src = P.audioURL;
}

// ---- 录制 ----
function pickMime(hasAudio) {
  const list = hasAudio
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (let i = 0; i < list.length; i++) if (MediaRecorder.isTypeSupported(list[i])) return list[i];
  return '';
}
function startRecording() {
  if (P.recording) return;
  if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
    toast('当前浏览器不支持录制（缺少 MediaRecorder 或 canvas.captureStream），请使用最新版 Chrome / Edge。');
    return;
  }
  pause();
  P.recording = { rec: null, stream: null, title: document.title, stopping: false };
  resize(); seek(0); // backing store 切到 1920×1080，从 0 秒开始
  const stream = canvas.captureStream(60);
  let hasAudio = false;
  if (P.audioReady) {
    try {
      if (!P.audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        P.audioCtx = new AC();
        P.srcNode = P.audioCtx.createMediaElementSource(P.audio);
        P.srcNode.connect(P.audioCtx.destination);
        P.recDest = P.audioCtx.createMediaStreamDestination();
        P.srcNode.connect(P.recDest);
      }
      P.audioCtx.resume();
      P.recDest.stream.getAudioTracks().forEach(function (tr) { stream.addTrack(tr); });
      hasAudio = true;
    } catch (err) { toast('音轨合入失败，将只录制画面：' + err.message); }
  }
  const mime = pickMime(hasAudio);
  let rec;
  try {
    rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 12000000 } : { videoBitsPerSecond: 12000000 });
  } catch (err) {
    stream.getVideoTracks().forEach(function (tr) { tr.stop(); });
    P.recording = null; resize(); applyUIVisibility();
    toast('无法启动录制：' + err.message);
    return;
  }
  const chunks = [];
  rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
  rec.onstop = function () {
    const blob = new Blob(chunks, { type: mime || 'video/webm' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = '普通朋友_陶喆_MG.webm';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    endRecordingUI();
    toast('录制完成，已下载 webm（' + (blob.size / 1048576).toFixed(1) + ' MB）');
  };
  P.recording.rec = rec; P.recording.stream = stream;
  ui.badge.hidden = false; ui.btnRec.classList.add('recording'); ui.btnRec.textContent = '录制中…';
  applyUIVisibility();
  rec.start(500);
  play();
}
function stopRecording() {
  const R = P.recording;
  if (!R || R.stopping) return;
  R.stopping = true;
  pause();
  // 稍等片刻确保最后一帧被采集
  setTimeout(function () {
    try { if (R.rec && R.rec.state !== 'inactive') R.rec.stop(); else endRecordingUI(); } catch (e) { endRecordingUI(); }
    if (R.stream) R.stream.getVideoTracks().forEach(function (tr) { tr.stop(); });
  }, 300);
}
function endRecordingUI() {
  const R = P.recording;
  if (R) document.title = R.title;
  P.recording = null; P.lastBadge = '';
  ui.badge.hidden = true; ui.btnRec.classList.remove('recording'); ui.btnRec.textContent = '录制视频';
  resize(); poke();
}
function updateRecBadge(t) {
  const pct = Math.floor(t / TOTAL * 100);
  const s = '● REC ' + pct + '%  ' + fmtTime(t) + ' / ' + fmtTime(TOTAL) + '  · Esc 结束';
  if (s === P.lastBadge) return;
  P.lastBadge = s; ui.badge.textContent = s;
  document.title = '录制中 ' + pct + '% · ' + P.recording.title;
}

// ---- 事件绑定 ----
function bindEvents() {
  window.addEventListener('resize', function () { resize(); render(P.t); });
  window.addEventListener('pointermove', poke);
  window.addEventListener('pointerdown', poke);
  ui.play.addEventListener('click', togglePlay);
  ui.btnFs.addEventListener('click', toggleFullscreen);
  ui.btnAudio.addEventListener('click', function () { ui.file.click(); });
  ui.file.addEventListener('change', function () {
    const f = ui.file.files && ui.file.files[0];
    if (f) loadAudio(f);
    ui.file.value = '';
  });
  ui.btnRec.addEventListener('click', function () { if (P.recording) stopRecording(); else startRecording(); });
  ui.bar.addEventListener('pointerdown', function (e) {
    if (P.recording) return;
    P.dragging = true; P.wasPlaying = P.playing; pause();
    ui.bar.setPointerCapture(e.pointerId);
    seek(barTime(e.clientX)); e.preventDefault();
  });
  ui.bar.addEventListener('pointermove', function (e) { if (P.dragging) seek(barTime(e.clientX)); });
  const endDrag = function () { if (!P.dragging) return; P.dragging = false; if (P.wasPlaying) play(); poke(); };
  ui.bar.addEventListener('pointerup', endDrag);
  ui.bar.addEventListener('pointercancel', endDrag);
  window.addEventListener('keydown', function (e) {
    if (P.recording) { if (e.key === 'Escape') stopRecording(); if (e.code === 'Space') e.preventDefault(); return; }
    const tag = e.target && e.target.tagName;
    switch (e.code) {
      case 'Space': if (tag === 'BUTTON') return; e.preventDefault(); togglePlay(); break;
      case 'ArrowLeft': e.preventDefault(); seek(clockTime() - 5); break;
      case 'ArrowRight': e.preventDefault(); seek(clockTime() + 5); break;
      case 'KeyF': toggleFullscreen(); break;
      case 'KeyH': toggleUI(); return;
      default: return;
    }
    if (!P.uiForcedHidden) poke();
  });
}

// ---- 启动 ----
function parseParams() {
  const q = new URLSearchParams(location.search), o = { t: undefined };
  if (q.has('t')) { const v = parseFloat(q.get('t')); if (isFinite(v)) o.t = clamp(v, 0, TOTAL); }
  o.pause = q.get('pause') === '1';
  o.uiOff = q.get('ui') === '0';
  return o;
}
function init() {
  const prm = parseParams();
  P.uiOff = prm.uiOff;
  resize();
  P.t = prm.t !== undefined ? prm.t : 0;
  render(P.t); // 同步渲染首帧（无头截图依赖这一点）
  updateUI(P.t); P.dirty = false;
  updatePlayBtn();
  bindEvents();
  if (prm.t !== undefined && prm.pause) { P.uiIdleHidden = true; applyUIVisibility(); }
  else poke();
  if (!prm.pause) play();
  requestAnimationFrame(tick);
}
// 供调试/验证使用
window.MG = { render: render, seek: seek, play: play, pause: pause, time: function () { return P.t; } };
init();
})();
