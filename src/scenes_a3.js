'use strict';
// =====================================================================
// scenes_a3.js — S3 前半（0:59–1:14）
//   59–64 「我愿意改变 (what can I do?)」：圆 → 圆角方 → 三角 → 星形 → 圆，每次弹性弹出并变色
//   64–69 「重新再来一遍 (just give me change)」：VHS 倒带（扫描线、RGB 色差、◀◀ REWIND），
//          “我”从深渊升回 → 爱心合拢 → 时钟逆转
//   69–74 「我无法只是普通朋友」：拍立得相框 “朋友 / FRIENDS”，“我”顶相框边缘，边框像橡皮筋被撑变形
// =====================================================================
const S3_SHAPES = ['circle', 'roundSquare', 'triangle', 'star', 'circle'];
const S3_COLS = [PAL.me, '#ffc94a', '#8a7bff', PAL.heart, PAL.me];
const S3_SWITCH = [59, 60.0, 61.0, 62.0, 63.0];

// ---- 59–64 变形 ----
function s3Change(ctx, t) {
  const br = prog(t, 59, 60.5, easeInOutSine);
  fillSky(ctx, mixColor(PAL.abyss, '#1d2350', br), mixColor('#0d0e20', '#3a2f6b', br));
  let idx = 0;
  for (let i = 0; i < S3_SWITCH.length; i++) if (t >= S3_SWITCH[i]) idx = i;
  const ts = S3_SWITCH[idx], col = S3_COLS[idx], beat = beatPulse(t);
  // 背景旋转光芒（颜色跟随当前形状）
  ctx.save(); ctx.globalAlpha = 0.07 * br;
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * TAU + t * 0.15;
    ctx.beginPath(); ctx.moveTo(960, 520);
    ctx.lineTo(960 + Math.cos(a - 0.1) * 1400, 520 + Math.sin(a - 0.1) * 1400);
    ctx.lineTo(960 + Math.cos(a + 0.1) * 1400, 520 + Math.sin(a + 0.1) * 1400);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  ctx.restore();
  drawBokeh(ctx, t, { count: 24, seed: 37, color: col, alpha: 0.08 * br, pulse: beat * 0.5 });
  // 深渊地面淡出
  const ga = 1 - br;
  if (ga > 0) { ctx.globalAlpha = ga; ctx.fillStyle = '#0c0d1c'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y); ctx.globalAlpha = 1; }
  // 上一段的小乌云散掉
  if (t < 59.4) s2RainCloud(ctx, t, 1 - easeInBack(prog(t, 59, 59.4)));
  // “我”升起并长大
  const rise = prog(t, 59.1, 59.9);
  const y = lerp(ME_Y, 520, easeOutBack(rise)), r0 = lerp(60, 100, easeOutCubic(rise));
  let sc = idx > 0 ? 0.55 + 0.45 * easeOutElastic(prog(t, ts, ts + 0.8)) : 1;
  const nx = idx < 4 ? S3_SWITCH[idx + 1] : 99;
  sc *= 1 - 0.12 * prog(t, nx - 0.15, nx, easeInQuad);   // 换形前预备收缩
  if (idx > 0 && t - ts < 0.6) {
    const kk = (t - ts) / 0.6;
    ring(ctx, 960, y, r0 * 1.2 + kk * 220, 10 * (1 - kk), rgba(col, 1 - kk));
    for (let j = 0; j < 10; j++) {
      const a = j / 10 * TAU + idx, d = r0 * 1.1 + easeOutCubic(kk) * 240;
      circle(ctx, 960 + Math.cos(a) * d, y + Math.sin(a) * d, 9 * (1 - kk), col);
    }
  }
  drawCharacter(ctx, 960, y, { r: r0 * sc, color: col, glowColor: col, glow: 0.6,
    shape: S3_SHAPES[idx], rot: (1 - prog(t, ts, ts + 0.6, easeOutCubic)) * 0.6 * (idx % 2 ? 1 : -1),
    look: Math.sin(t * 1.7) * 0.4, blink: blinkAmt(t, 11), mood: idx === 4 && t > 63.3 ? 'happy' : undefined,
    groundY: lerp(GROUND_Y, 700, rise), squash: 1 + 0.04 * beat });
}

// ---- VHS 效果 ----
// 复用的离屏缓冲：每帧完整重写，不保存任何跨帧画面状态
let _vhsBuf = null, _vhsTmp = null;
function vhsBuffers(w, h) {
  if (!_vhsBuf || _vhsBuf.width !== w || _vhsBuf.height !== h) {
    _vhsBuf = document.createElement('canvas'); _vhsBuf.width = w; _vhsBuf.height = h;
    _vhsTmp = document.createElement('canvas'); _vhsTmp.width = w; _vhsTmp.height = h;
  }
  return _vhsBuf;
}
// RGB 色差：把当前画面拆成 R/G/B 三个通道（multiply 纯色），R 左移、B 右移后用 lighter 叠回
function rgbShift(ctx, d) {
  const cv = ctx.canvas, w = cv.width, h = cv.height, px = d * w / W;
  const buf = vhsBuffers(w, h), tmp = _vhsTmp;
  const bc = buf.getContext('2d'), tc = tmp.getContext('2d');
  bc.globalCompositeOperation = 'copy'; bc.drawImage(cv, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  const chans = ['#ff0000', '#00ff00', '#0000ff'], offs = [-px, 0, px];
  for (let i = 0; i < 3; i++) {
    tc.globalCompositeOperation = 'copy'; tc.drawImage(buf, 0, 0);
    tc.globalCompositeOperation = 'multiply'; tc.fillStyle = chans[i]; tc.fillRect(0, 0, w, h);
    ctx.drawImage(tmp, offs[i], 0);
  }
  ctx.restore();
}
// 跟踪噪声带：从缓冲里截取横带，水平错位贴回
function vhsBands(ctx, t, burst) {
  const cv = ctx.canvas, w = cv.width, sy = cv.height / H, sx = w / W;
  const n = burst > 0.2 ? 4 : 1, fr = Math.floor(t * 30);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < n; i++) {
    const y = (fract(t * 0.35 + i * 0.27) * 1.2 - 0.1) * H, hh = 26 + 50 * burst + hash01(fr + i, 191) * 20;
    const dx = (hash01(fr * 7 + i, 192) - 0.5) * 2 * (18 + 70 * burst);
    ctx.drawImage(_vhsBuf, 0, y * sy, w, hh * sy, dx * sx, y * sy, w, hh * sy);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, y * sy, w, 2 * sy);
  }
  ctx.restore();
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }
// VHS 叠层：色差 → 噪声带 → 扫描线 → 噪点 → HUD（◀◀ REWIND、倒退的时间码、逆转小钟）
function drawVHS(ctx, t, t0, t1) {
  const fr = Math.floor(t * 30), burst = Math.max(env(t, t0, t0 + 0.3, 0.02, 0.2), env(t, 66.15, 66.55, 0.05, 0.15));
  rgbShift(ctx, 5 + 5 * hash01(fr, 141) + 20 * burst);
  vhsBands(ctx, t, burst);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
  for (let i = 0; i < 70 + burst * 120; i++) {
    ctx.fillStyle = rgba('#ffffff', 0.12 + 0.3 * hash01(fr * 131 + i, 144));
    ctx.fillRect(hash01(fr * 97 + i, 142) * W, hash01(fr * 89 + i, 143) * H, 2 + hash01(i, 145) * 10, 2);
  }
  const g = ctx.createRadialGradient(960, 540, 400, 960, 540, 1150);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (fract(t * 1.6) < 0.68) drawText(ctx, '◀◀ REWIND', SAFE.x + 20, SAFE.y + 50, 56, '#ffffff', { align: 'left', family: FONT_EN, weight: 800 });
  // 时间码从 0:55 倒退到 0:37
  const tc = lerp(55, 37, prog(t, t0, t1)), s = Math.floor(tc), ff = Math.floor(fract(tc) * 30);
  drawText(ctx, 'SP  00:' + pad2(s) + ':' + pad2(ff), SAFE.r - 20, SAFE.y + 50, 40, '#ffffff', { align: 'right', family: FONT_EN, weight: 700 });
  drawClockFace(ctx, SAFE.r - 380, SAFE.y + 50, 34, -(t - t0) * 14, 0.9, '#ffffff', -0.8);
}
// ---- 64–69 倒带 ----
function s3Rewind(ctx, t) {
  if (t < 66.3) {
    // 倒放下坠：“我”从深渊底部升起
    drawDive(ctx, lerp(54.95, 50.6, prog(t, 64.0, 66.3, easeInOutSine)), true);
  } else {
    // 倒放 S2：裂开的爱心合拢、“我”从沮丧恢复、大钟逆转
    const k = prog(t, 66.4, 68.3, easeInOutCubic);
    drawStreet(ctx, t, { top: '#1b1f45', bot: PAL.indigo, starA: 0.7,
      mid: function () { drawClockFace(ctx, ME_X + 30, 520, 230, -(t - 66.3) * 9, 0.75, PAL.cream, -1); } });
    drawHeartHalves(ctx, HEART_CX, HEART_CY, HEART_S, { sep: 150 * (1 - k), crack: 1 - prog(t, 67.9, 68.5), fill: PAL.heart });
    drawMe(ctx, ME_X, ME_Y, { t: t, r: 60, look: 0.8, mood: k < 0.5 ? 'sad' : undefined, rot: 0.16 * k, groundY: GROUND_Y });
    drawYou(ctx, YOU_X, YOU_Y, { t: t, r: 78, look: lerp(1, -0.8, k), groundY: GROUND_Y });
  }
  drawVHS(ctx, t, 64, 69);
}
// ---- 69–74 拍立得 ----
// 矩形路径，左边向外鼓出 bulge（二次曲线，鼓包峰值落在 peakY）
function polaroidRect(ctx, x0, y0, x1, y1, bulge, peakY) {
  const cy = 2 * peakY - (y0 + y1) / 2;
  ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1);
  ctx.quadraticCurveTo(x0 - 2 * bulge, cy, x0, y0);
  ctx.closePath();
}
// 鼓包量：70.1 秒开始顶，随节拍一下下顶，72.4–73.3 用力顶并颤抖
function s3Bulge(t) {
  const push = prog(t, 70.1, 70.7, easeOutCubic);
  const hard = prog(t, 72.4, 73.3, easeInOutSine) * (1 - 0.6 * prog(t, 73.6, 74, easeInQuad));
  return push * (26 + 14 * beatPulse(t, 5)) + hard * 42 + Math.sin(t * 38) * 3 * hard;
}
const POL_PEAK = 84, POL_ME_R = 56;
function s3Polaroid(ctx, t) {
  fillSky(ctx, '#2b3266', '#161b3d');
  softGlow(ctx, 960, 470, 760, PAL.meGlow, 0.12);
  drawBokeh(ctx, t, { count: 24, seed: 57, color: PAL.meGlow, alpha: 0.09, pulse: beatPulse(t) * 0.5 });
  const e = easeOutBack(prog(t, 69.0, 69.75), 1.3), b = s3Bulge(t);
  ctx.save();
  ctx.translate(960, lerp(-420, 470, e)); ctx.rotate(lerp(-0.45, -0.035, e) + Math.sin(t * 1.1) * 0.008);
  // 长投影 + 相纸（evenodd 挖出照片窗）
  ctx.beginPath(); polaroidRect(ctx, -362, -273, 398, 317, b, POL_PEAK + 22); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  ctx.beginPath(); polaroidRect(ctx, -380, -295, 380, 295, b, POL_PEAK); polaroidRect(ctx, -350, -265, 350, 175, b, POL_PEAK);
  ctx.fillStyle = '#fbf6ec'; ctx.fill('evenodd');
  // 照片内容
  ctx.save();
  ctx.beginPath(); polaroidRect(ctx, -350, -265, 350, 175, b, POL_PEAK); ctx.clip();
  const g = ctx.createLinearGradient(0, -265, 0, 175);
  g.addColorStop(0, '#5a6fb8'); g.addColorStop(1, '#f0a37a');
  ctx.fillStyle = g; ctx.fillRect(-420, -270, 800, 450);
  circle(ctx, 210, -130, 46, 'rgba(255,233,199,0.85)');
  ctx.fillStyle = '#3a3f6b'; ctx.fillRect(-420, 140, 800, 40);
  drawYou(ctx, 190, 140 - 70, { t: t, r: 70, look: -0.6, groundY: 140 });
  ctx.restore();
  // 手写标题逐字出现
  const cap = '朋友 / FRIENDS', n = Math.floor(prog(t, 69.9, 70.8) * cap.length + 1e-6);
  if (n > 0) {
    const f = fontStr(46, 800, FONT_MIX), wAll = measureW(ctx, cap, f);
    ctx.save(); ctx.rotate(-0.02);
    drawText(ctx, cap.slice(0, n), -wAll / 2, 235, 46, '#3a3f6b', { align: 'left', shadow: false });
    ctx.restore();
  }
  // “我”走到左边缘并顶住（画在相框之上，看起来把边框撑变形）
  const walk = prog(t, 69.8, 70.3, easeInOutCubic), sq = lerp(1, 0.88, prog(t, 70.1, 70.4));
  const mx = lerp(-230, -350 - b + POL_ME_R * sq + 2, walk);
  drawMe(ctx, mx, POL_PEAK, { t: t, r: POL_ME_R, squash: sq, look: -1, lookY: -0.1, glow: 0.4, groundY: 140,
    hands: walk > 0.5 ? [{ a: PI - 0.4, len: 0.45 }, { a: PI + 0.4, len: 0.45 }] : undefined });
  ctx.restore();
  veil(ctx, '#ffffff', 0.85 * (1 - prog(t, 69.0, 69.35)));   // 拍照闪光
  // 斜向擦除揭示下一镜（深海）
  const wk = prog(t, 73.55, 74.0, easeInOutCubic);
  if (wk > 0) diagReveal(ctx, wk, function () { s3Ocean(ctx, t); });
}
// 斜向擦除揭示：在左→右推进的斜切区域内绘制 fn
function diagReveal(ctx, k, fn) {
  const s = 300, x = lerp(-s, W + s, k);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(x + s, -10); ctx.lineTo(x - s, H + 10); ctx.lineTo(-10, H + 10); ctx.closePath();
  ctx.clip(); fn(); ctx.restore();
  line(ctx, x + s, -10, x - s, H + 10, 10, PAL.cream);
}
