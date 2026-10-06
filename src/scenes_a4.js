'use strict';
// =====================================================================
// scenes_a4.js — S3 后半（1:14–1:25）并登记 SCENE_IMPL.S3
//   74–78 「感情已那么深」：海洋剖面，粉色细线像锚链沉入深海，深度表 -10m → -100m → -1000m…，气泡上浮
//   78–82 「叫我怎么能放手」：“我”紧握爱心气球线，强风，线绷紧抖动，“我”被拖着向前滑
//   82–85 「但你说」：定格压暗，“你”上前一步，巨大对话气泡展开并铺满画面（转场到副歌）
// =====================================================================
const OCEAN_SURF = 330;   // 世界坐标中的海面
function oceanChainEnd(t) { return OCEAN_SURF + 120 + 2300 * prog(t, 74.2, 77.7, easeInOutCubic); }
function oceanChainX(wy, t) {
  const d = (wy - OCEAN_SURF) / 2400;
  return 560 + 60 * d + Math.sin(wy * 0.006 + t * 1.2) * 22 * d;
}
// 深度表（对数刻度）：-10m / -100m / -1000m，指针随下沉移动，顶部大读数
function s3DepthGauge(ctx, t) {
  const k = prog(t, 74.3, 78), depth = Math.round(Math.pow(10, 1 + 2.25 * k));
  const x0 = 1690, y0 = 160, y1 = 760, bx = 1780;
  fillRoundRect(ctx, x0, y0 - 30, 130, y1 - y0 + 60, 18, 'rgba(7,7,15,0.35)');
  line(ctx, bx, y0, bx, y1, 4, 'rgba(255,244,224,0.5)');
  const ly = function (d) { return y0 + (Math.log10(d) - 1) / 2.4 * (y1 - y0); };
  ctx.font = fontStr(24, 700, FONT_EN); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let p = 1; p <= 3; p++) {
    const y = ly(Math.pow(10, p));
    line(ctx, bx - 18, y, bx, y, 4, PAL.cream);
    ctx.fillStyle = PAL.cream; ctx.fillText('-' + Math.pow(10, p) + 'm', bx - 26, y);
  }
  const py = ly(depth);
  ctx.beginPath(); ctx.moveTo(bx + 6, py); ctx.lineTo(bx + 26, py - 12); ctx.lineTo(bx + 26, py + 12); ctx.closePath();
  ctx.fillStyle = PAL.heart; ctx.fill();
  drawText(ctx, '-' + depth + 'm', 1755, 100, 40, PAL.cream, { family: FONT_EN, weight: 800 });
}
function s3Ocean(ctx, t) {
  const end = oceanChainEnd(t), camY = Math.max(0, end - 640), sy = OCEAN_SURF - camY;
  // 天空（只在海面还在画面内时可见）+ 水体（世界坐标渐变，越深越暗）
  if (sy > 0) { const gs = ctx.createLinearGradient(0, 0, 0, sy); gs.addColorStop(0, '#f0a37a'); gs.addColorStop(1, '#ffd3a8'); ctx.fillStyle = gs; ctx.fillRect(0, 0, W, sy); }
  const g = ctx.createLinearGradient(0, sy, 0, sy + 2800);
  g.addColorStop(0, '#2f8fc0'); g.addColorStop(0.25, '#1a5b8f'); g.addColorStop(0.55, '#0e2f5c');
  g.addColorStop(0.8, '#071634'); g.addColorStop(1, '#03060f');
  ctx.fillStyle = g; ctx.fillRect(0, Math.max(0, sy), W, H);
  // 光柱
  ctx.save(); ctx.globalAlpha = 0.07 * clamp01(1 - camY / 1400);
  for (let i = 0; i < 5; i++) {
    const x = 200 + i * 380 + Math.sin(t * 0.5 + i) * 30;
    ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + 90, sy); ctx.lineTo(x + 330, sy + 1100); ctx.lineTo(x + 120, sy + 1100);
    ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  ctx.restore();
  // 锚链：粉色链环沿摆动曲线向下延伸，末端是爱心锚
  for (let wy = OCEAN_SURF + 6, i = 0; wy < end; wy += 26, i++) {
    const y = wy - camY;
    if (y < -30 || y > H + 30) continue;
    ctx.beginPath();
    if (i % 2) ctx.ellipse(oceanChainX(wy, t), y, 7, 15, 0, 0, TAU); else ctx.ellipse(oceanChainX(wy, t), y, 12, 15, 0, 0, TAU);
    ctx.lineWidth = 5; ctx.strokeStyle = PAL.heart; ctx.stroke();
  }
  const ax = oceanChainX(end, t), ay = end - camY + 40;
  ring(ctx, ax, ay - 52, 12, 6, PAL.heart);
  ctx.beginPath(); ctx.arc(ax, ay - 6, 64, 0.25 * PI, 0.75 * PI); ctx.lineWidth = 9; ctx.strokeStyle = PAL.heart; ctx.stroke();
  drawHeart(ctx, ax, ay, 44, { fill: PAL.heart });
  softGlow(ctx, ax, ay, 160, PAL.heart, 0.35);
  // “我”漂在海面上，下半身没在水里
  if (sy > -120) {
    const my = sy - 34 + Math.sin(t * 2.2) * 6;
    drawMe(ctx, 560, my, { t: t, r: 56, look: 0.3, lookY: 0.8, shadow: false, glow: 0.4, hands: [{ a: 1.9, len: 0.5 }] });
    ctx.fillStyle = 'rgba(47,143,192,0.55)'; ctx.fillRect(0, sy, W, 60);
    ctx.beginPath(); ctx.moveTo(0, sy);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, sy + Math.sin(x * 0.01 + t * 2) * 8);
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,244,224,0.7)'; ctx.stroke();
  }
  // 上浮气泡 + 海雪
  for (let i = 0; i < 40; i++) {
    const sp = 60 + hash01(i, 201) * 110, span = H + 80;
    const y = H + 40 - fract(hash01(i, 202) + t * sp / span) * span;
    if (y < sy) continue;
    const x = hash01(i, 203) * W + Math.sin(t * 2 + i) * 12, r = 4 + hash01(i, 204) * 12;
    ring(ctx, x, y, r, 2.5, 'rgba(255,244,224,0.45)');
    circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.25, 'rgba(255,255,255,0.5)');
  }
  for (let i = 0; i < 50; i++) {
    const y = fract(hash01(i, 211) + t * 0.03) * H;
    if (y < sy) continue;
    ctx.globalAlpha = 0.35; circle(ctx, hash01(i, 212) * W, y, 1.5 + hash01(i, 213) * 2, PAL.cream);
  }
  ctx.globalAlpha = 1;
  s3DepthGauge(ctx, t);
}
// ---- 78–82 强风气球（tf 为画面时间；定格时传入固定值） ----
function s3Balloon(ctx, tf) {
  fillSky(ctx, '#2a2f66', '#5b3a6e');
  for (let i = 0; i < 7; i++) {
    const x = ((hash01(i, 221) * W * 1.5 + tf * (380 + hash01(i, 222) * 250)) % (W + 700)) - 350;
    drawCloud(ctx, x, 110 + hash01(i, 223) * 320, 100 + hash01(i, 224) * 90, '#4a4f8a', 0.8);
  }
  drawSkyline(ctx, tf, 1, '#232858', 0.6);
  drawGround(ctx, '#151936', '#2e3466');
  // 风线 + 飞叶
  for (let i = 0; i < 26; i++) {
    const sp = 1800 * (0.7 + hash01(i, 231) * 0.6), len = 120 + hash01(i, 232) * 140;
    const x = ((hash01(i, 233) * W + tf * sp) % (W + 600)) - 300, y = 40 + hash01(i, 234) * 720;
    line(ctx, x, y, x + len, y, 3, 'rgba(255,244,224,0.22)');
  }
  for (let i = 0; i < 12; i++) {
    const x = ((hash01(i, 241) * W + tf * 1100) % (W + 200)) - 100, y = 150 + hash01(i, 242) * 600 + Math.sin(tf * 5 + i) * 40;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tf * 8 + i);
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 6, 0, 0, TAU); ctx.fillStyle = i % 2 ? '#ff9a4a' : '#e8673c'; ctx.fill();
    ctx.restore();
  }
  // “我”被拖着向前滑：后仰抵抗、脚下拖痕与扬尘
  const slide = prog(tf, 78.3, 82, easeInQuad), mx = lerp(520, 860, slide) + Math.sin(tf * 47) * 3, my = ME_Y;
  const rot = -0.26 - 0.05 * Math.sin(tf * 9), r = 60;
  if (mx > 540) line(ctx, 520, GROUND_Y + 3, mx - 30, GROUND_Y + 3, 6, 'rgba(0,0,0,0.3)');
  for (let i = 0; i < 6; i++) {
    const ph = fract(tf * 3 + i / 6);
    ctx.globalAlpha = 0.5 * (1 - ph);
    circle(ctx, mx - 40 - ph * 120, GROUND_Y - 6 - ph * 18, 10 * (1 - ph), '#5a5f9a');
  }
  ctx.globalAlpha = 1;
  // 爱心气球被风吹向右上，线绷紧高频抖动
  const bx = mx + 470 + Math.sin(tf * 2.3) * 30, by = 300 + Math.sin(tf * 3.1) * 24, brot = 0.25 + Math.sin(tf * 2.7) * 0.08;
  const cx = mx + r * Math.sin(rot), cy = my + r - r * Math.cos(rot);
  const wa = Math.atan2(by - cy, bx - cx), hx = cx + Math.cos(wa) * r * 1.67, hy = cy + Math.sin(wa) * r * 1.67;
  const tx = bx - Math.sin(brot) * 72, ty = by + Math.cos(brot) * 72;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const s = i / 24, o = Math.sin(s * PI) * Math.sin(tf * 55 + s * 12) * 5;
    const dx = tx - hx, dy = ty - hy, L = Math.hypot(dx, dy) || 1;
    const x = hx + dx * s - dy / L * o, y = hy + dy * s + dx / L * o;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 3; ctx.strokeStyle = PAL.cream; ctx.stroke();
  drawMe(ctx, mx, my, { t: tf, r: r, rot: rot, squash: 0.94, look: 1, lookY: -0.6, glow: 0.45, groundY: GROUND_Y,
    hands: [{ a: wa - rot, len: 0.75 }] });
  drawHeart(ctx, bx, by, 80, { fill: PAL.heart, rot: brot });
  ctx.save(); ctx.translate(bx, by); ctx.rotate(brot);
  ctx.beginPath(); ctx.ellipse(-34, -26, 14, 8, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
  regularPolyPath(ctx, 0, 78, 9, 3, PI / 2); ctx.fillStyle = PAL.heart; ctx.fill();
  ctx.restore();
}
// ---- 82–85 定格 + “你”的巨大对话气泡 ----
const S3_FREEZE = 82;
function s3Speech(ctx, t) {
  withCamera(ctx, 960, 540, 1 + 0.04 * prog(t, 82, 82.5, easeOutCubic), 0, function () { s3Balloon(ctx, S3_FREEZE); });
  desatScreen(ctx, 0.5 * prog(t, 82, 82.3));
  veil(ctx, PAL.abyss, 0.55 * prog(t, 82.05, 82.5));
  veil(ctx, '#ffffff', 0.6 * (1 - prog(t, 82, 82.12)));   // 定格闪光
  // “你”上前两步
  const k1 = prog(t, 82.4, 83.0, easeOutCubic), k2 = prog(t, 83.0, 83.35, easeOutBack);
  const ux = lerp(2080, 1500, k1) - 70 * k2, hop = Math.abs(Math.sin(prog(t, 82.4, 83.35) * PI * 2)) * 26;
  const uy = GROUND_Y - 95 - hop;
  drawYou(ctx, ux, uy, { t: t, r: 95, look: -0.7, lookY: -0.1, groundY: GROUND_Y, glow: 0.35,
    squash: 1 + 0.12 * Math.exp(-8 * Math.max(0, t - 83.35)) * Math.cos((t - 83.35) * 16) * (t > 83.35 ? 1 : 0) });
  // 气泡：从“你”头顶弹出，84.45 秒后放大铺满画面
  const g = prog(t, 83.35, 84.1);
  if (g <= 0) return;
  const gs = easeOutBack(g, 1.5), es = 1 + 3.2 * prog(t, 84.45, 85.0, easeInCubic);
  const tipX = ux - 85, tipY = GROUND_Y - 95 - 75, bcx = 790, bcy = 340;
  ctx.save();
  ctx.translate(bcx, bcy); ctx.scale(es, es); ctx.translate(-bcx, -bcy);
  ctx.translate(tipX, tipY); ctx.scale(gs, gs); ctx.translate(-tipX, -tipY);
  drawBubble(ctx, 230, 120, 1120, 440, tipX, tipY, { fill: PAL.cream, r: 120 });
  drawDots(ctx, bcx, bcy, t, { color: PAL.indigo, r: 16, gap: 52, alpha: 1 - prog(t, 84.45, 84.8) });
  ctx.restore();
}

function drawS3(ctx, t) {
  if (t < 64) s3Change(ctx, t);
  else if (t < 69) s3Rewind(ctx, t);
  else if (t < 74) s3Polaroid(ctx, t);
  else if (t < 78) s3Ocean(ctx, t);
  else if (t < S3_FREEZE) {
    if (t < 78.6) {
      // 圆形遮罩扩散转场：深海 → 强风
      s3Ocean(ctx, t);
      const R = easeInOutCubic(prog(t, 78, 78.6)) * 1150;
      withCircleClip(ctx, 960, 540, R, function () { s3Balloon(ctx, t); });
      ring(ctx, 960, 540, R, 10, PAL.cream);
    } else s3Balloon(ctx, t);
  } else s3Speech(ctx, t);
}
SCENE_IMPL.S3 = { draw: function (ctx, t) { drawS3(ctx, t); } };
