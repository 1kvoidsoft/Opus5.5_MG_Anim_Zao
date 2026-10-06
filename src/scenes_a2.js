'use strict';
// =====================================================================
// scenes_a2.js — S2 我猜 / 失败 / 深渊 0:37–0:59
//   37–40 爱心定格，“我”头顶大问号，镜头推近，眼睛左右张望
//   40–45 “你”头上气泡，“…”打字一直不结束；“你”视线移开
//   45–50 锯齿裂纹画过爱心，裂成两半慢慢分开，画面降饱和
//   50–55 大字「从天堂掉落到深渊」：竖向俯冲（天堂 → 天蓝 → 深蓝 → 深渊），速度线、微光、深度刻度
//   55–59 “我”在深渊底部落地挤压，头顶小乌云下雨，眼睛下垂
// drawDive(ctx, td, rev) 也被 S3 的 VHS 倒带复用（rev = true 时速度线反向）。
// =====================================================================
const DIVE_T0 = 50, DIVE_T1 = 55, DIVE_WH = 5400;   // 下坠时段与世界高度（逻辑像素）

// ---- 37–50 街道段 ----
function s2Street(ctx, t) {
  const cool = prog(t, 37, 39.5, easeInOutSine);
  const zk = prog(t, 37.2, 38.6, easeInOutCubic) * (1 - prog(t, 40.0, 40.8, easeInOutCubic));
  withCamera(ctx, lerp(960, ME_X + 80, zk), lerp(540, 600, zk), lerp(1, 1.4, zk), 0, function () {
    drawStreet(ctx, t, {
      top: mixColor('#4a2452', '#1b1f45', cool), bot: mixColor(PAL.dusk, PAL.indigo, cool),
      starA: 0.3 + 0.5 * cool, bld: mixColor('#3a2346', '#1c2246', cool), gnd: mixColor('#2a1a33', '#0f1329', cool)
    });
    // 定格的爱心：37 秒一道白色描边闪过（“冻住”），45 秒起裂开
    const crack = prog(t, 45.2, 46.0), sep = 150 * prog(t, 46.0, 49.6, easeInOutCubic);
    drawHeartHalves(ctx, HEART_CX, HEART_CY, HEART_S, { sep: sep, crack: crack, fill: PAL.heart });
    const fz = 1 - prog(t, 37.0, 37.5);
    if (fz > 0) { heartShapePath(ctx, HEART_CX, HEART_CY, HEART_S * (1 + 0.06 * (1 - fz))); ctx.lineWidth = 8; ctx.strokeStyle = rgba(PAL.cream, fz); ctx.stroke(); }
    s2Me(ctx, t);
    s2You(ctx, t);
  });
  desatScreen(ctx, prog(t, 45.6, 49.0) * 0.85);
  veil(ctx, PAL.heaven, prog(t, 49.6, 50.0, easeInQuad));   // 白光吞没 → 进入天堂
}
function s2Me(ctx, t) {
  let look = 0.8, lookY = 0;
  if (t < 40) look = clamp(Math.sin((t - 37) * 4.2) * 2.5, -1, 1);
  else if (t >= 45) { look = lerp(0.8, 0.2, prog(t, 45, 45.6)); lookY = lerp(0, 0.5, prog(t, 46, 46.8)); }
  const sad = t > 46.3;
  drawMe(ctx, ME_X, ME_Y, { t: t, r: 60, rot: 0.16 * (1 - prog(t, 37, 37.6, easeInOutCubic)), look: look, lookY: lookY,
    mood: sad ? 'sad' : undefined, squash: 1 + 0.08 * prog(t, 46.3, 47, easeOutBack), glow: lerp(0.55, 0.2, prog(t, 45.5, 48)),
    groundY: GROUND_Y });
  const qs = easeOutBack(prog(t, 37.15, 37.6), 2.5) * (1 - prog(t, 39.9, 40.2, easeInBack));
  if (qs > 0) drawQuestion(ctx, ME_X, ME_Y - 150 + Math.sin(t * 3) * 6, 120 * qs, PAL.meGlow, 1, Math.sin(t * 2.5) * 0.15);
}
function s2You(ctx, t) {
  const away = prog(t, 41.4, 42.0, easeInOutCubic);
  drawYou(ctx, YOU_X, YOU_Y, { t: t, r: 78, look: lerp(-0.8, 1, away), lookY: -0.25 * away, groundY: GROUND_Y });
  const bs = easeOutBack(prog(t, 40.2, 40.7), 2) * (1 - prog(t, 44.8, 45.1, easeInQuad));
  if (bs <= 0) return;
  const tx = YOU_X - 10, ty = YOU_Y - 92;
  ctx.save();
  ctx.translate(tx, ty); ctx.scale(bs, bs); ctx.translate(-tx, -ty);
  drawBubble(ctx, YOU_X - 90, YOU_Y - 292, 300, 140, tx, ty, { fill: PAL.cream });
  drawDots(ctx, YOU_X + 60, YOU_Y - 222, t, { color: PAL.indigo, r: 11, gap: 36 });   // 打字中…永远不结束
  ctx.restore();
}
// ---- 50–55 下坠 ----
function diveCam(k) { return (DIVE_WH - H) * (0.62 * k * k + 0.38 * k); }
function diveVel(k) { return (DIVE_WH - H) * (1.24 * k + 0.38) / (DIVE_T1 - DIVE_T0); }
// 光门：圆拱门 + 旋转光芒
function diveGate(ctx, t, x, y) {
  if (y > H + 400 || y < -500) return;
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU + t * 0.3;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a - 0.08) * 900, y + Math.sin(a - 0.08) * 900);
    ctx.lineTo(x + Math.cos(a + 0.08) * 900, y + Math.sin(a + 0.08) * 900);
    ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  ctx.restore();
  softGlow(ctx, x, y + 40, 420, '#fff6dc', 0.9);
  ctx.beginPath();
  ctx.moveTo(x - 110, y + 170); ctx.lineTo(x - 110, y); ctx.arc(x, y, 110, PI, 0); ctx.lineTo(x + 110, y + 170);
  ctx.closePath(); ctx.fillStyle = '#fffaf0'; ctx.fill();
  ctx.lineWidth = 14; ctx.strokeStyle = '#ffd38a'; ctx.stroke();
}
// 云层：三层视差（f = 1.3 的一层在“我”前面绘制）
function diveClouds(ctx, camY, front) {
  for (let i = 0; i < 18; i++) {
    const f = [0.8, 1, 1.3][i % 3];
    if ((f > 1.2) !== front) continue;
    const wy = 520 + hash01(i, 151) * 1700, y = wy - camY * f;
    if (y < -200 || y > H + 200) continue;
    const s = 110 + hash01(i, 152) * 130;
    let cx = hash01(i, 153) * W;
    if (front && Math.abs(cx - 480) < 300) cx += 640;   // 前景云避开“我”的下坠通道
    drawCloud(ctx, cx, y, s * (front ? 1.1 : 1), front ? '#ffffff' : '#f4f8ff', front ? 0.7 : 0.85);
  }
}
// 速度线与微光粒子：由 camY 驱动（倒放时自动反向）
function diveStreaks(ctx, camY, v, k) {
  const len = clamp(Math.abs(v) * 0.09, 40, 300), col = mixColor('#8fa3e0', PAL.cream, k), span = H + 400;
  for (let i = 0; i < 36; i++) {
    const sp = 1.2 + hash01(i, 161) * 0.9;
    const y = ((hash01(i, 162) * span - camY * sp) % span + span) % span - 200;
    const x = hash01(i, 163) * W;
    line(ctx, x, y, x, y + len * sp * 0.7, 3, rgba(col, 0.25 + 0.2 * hash01(i, 164)));
  }
  for (let i = 0; i < 30; i++) {
    const sp = 0.9 + hash01(i, 171) * 0.6;
    const y = ((hash01(i, 172) * span - camY * sp) % span + span) % span - 200;
    ctx.globalAlpha = 0.6 * (0.5 + 0.5 * Math.sin(camY * 0.01 + i));
    circle(ctx, hash01(i, 173) * W + Math.sin(camY * 0.004 + i) * 20, y, 2 + hash01(i, 174) * 3, PAL.meGlow);
  }
  ctx.globalAlpha = 1;
}
// 侧边深度刻度：每 120 世界像素一格 = 50m，当前读数跟随“我”
function diveGauge(ctx, camY, meY, k) {
  const gx = 1800, top = SAFE.y + 20, bot = SAFE.b - 20;
  const gc = mixColor(PAL.indigo, PAL.cream, smoothstep(0.25, 0.5, k));   // 亮背景用深色刻度
  line(ctx, gx, top, gx, bot, 3, rgba(gc, 0.5));
  ctx.font = fontStr(22, 700, FONT_EN); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const j0 = Math.ceil((camY + top) / 120), j1 = Math.floor((camY + bot) / 120);
  for (let j = j0; j <= j1; j++) {
    const y = j * 120 - camY, big = j % 2 === 0;
    line(ctx, gx - (big ? 26 : 14), y, gx, y, 3, rgba(gc, 0.6));
    if (big) { ctx.fillStyle = rgba(gc, 0.7); ctx.fillText('-' + j * 50 + 'm', gx - 34, y); }
  }
  const depth = Math.round((camY + meY) / 120 * 50);
  fillRoundRect(ctx, 1652, meY - 22, 124, 44, 10, PAL.me);
  ctx.beginPath(); ctx.moveTo(1776, meY - 10); ctx.lineTo(1794, meY); ctx.lineTo(1776, meY + 10); ctx.fillStyle = PAL.me; ctx.fill();
  drawText(ctx, '-' + depth + 'm', 1714, meY + 1, 24, PAL.cream, { family: FONT_EN, weight: 800, shadow: false });
}
// 竖向俯冲。td ∈ [50, 55] 为下坠内时间；rev = true 用于倒带（“我”向上升）
function drawDive(ctx, td, rev) {
  const k = prog(td, DIVE_T0, DIVE_T1), camY = diveCam(k), v = diveVel(k);
  const g = ctx.createLinearGradient(0, -camY, 0, DIVE_WH - camY);
  g.addColorStop(0, PAL.heaven); g.addColorStop(0.12, PAL.heaven); g.addColorStop(0.3, PAL.skyBlue);
  g.addColorStop(0.52, '#4a5aa0'); g.addColorStop(0.68, PAL.indigo); g.addColorStop(0.84, PAL.night);
  g.addColorStop(0.95, PAL.abyss); g.addColorStop(1, PAL.abyss);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  diveGate(ctx, td, 960, 330 - camY);
  diveClouds(ctx, camY, false);
  diveStreaks(ctx, camY, v, k);
  const fy = DIVE_WH - (H - GROUND_Y) - camY;   // 深渊底面（结束时正好落在 GROUND_Y）
  if (fy < H) { ctx.fillStyle = '#0c0d1c'; ctx.fillRect(0, fy, W, H - fy + 2); ctx.fillStyle = '#23254a'; ctx.fillRect(0, fy, W, 4); }
  // “我”：左侧下坠（给大字让出右侧），最后 1 秒落向画面中央地面
  const ky = prog(td, 53.9, 55, easeInOutCubic), kx = prog(td, 54.5, 55, easeInOutCubic);
  const mx = lerp(480 + Math.sin(td * 2.6) * 30, 960, kx), my = lerp(470, ME_Y, ky);
  const stretch = 1 - clamp01(v / 2400) * 0.2 * (1 - ky);
  drawMe(ctx, mx, my, { t: td, r: 60, squash: stretch, rot: Math.sin(td * 4.5) * 0.3 * (1 - ky),
    look: Math.sin(td * 3) * 0.4, lookY: rev ? 0.6 : -0.8, hands: [{ a: -2.4, len: 0.6 }, { a: -0.7, len: 0.6 }],
    shadow: ky > 0.5, groundY: GROUND_Y, glow: 0.55 });
  diveClouds(ctx, camY, true);
  diveGauge(ctx, camY, my, k);
  // 背景很亮时，在大字区垫一块半透明靛蓝底板，保证奶油白大字可读（倒带时无大字）
  const plate = rev ? 0 : 0.62 * (1 - smoothstep(0.3, 0.55, k)) * prog(td, DIVE_T0, DIVE_T0 + 0.3);
  // 底板跟随大字的下坠漂移（lyrics.js 'fall'：dy = lt * 14），保持文字上下居中
  if (plate > 0) {
    const py = 430 + clamp(td - LYRIC_OFFSET - DIVE_T0, 0, 5) * 14;
    ctx.globalAlpha = plate; fillRoundRect(ctx, 690, py - 95, 940, 190, 40, PAL.indigo); ctx.globalAlpha = 1;
  }
}
// ---- 55–59 深渊落地 ----
function s2RainCloud(ctx, t, s) {
  if (s <= 0) return 0;
  const cx = 960 + Math.sin(t * 1.3) * 8, cy = ME_Y - 175 + Math.sin(t * 2) * 6;
  drawCloud(ctx, cx, cy, 70 * s, '#5a5f80');
  return cy;
}
function s2Abyss(ctx, t) {
  const dt = t - DIVE_T1;
  fillSky(ctx, PAL.abyss, '#0d0e20');
  // 远处一束微弱的光
  ctx.save(); ctx.globalAlpha = 0.07;
  ctx.beginPath(); ctx.moveTo(900, -20); ctx.lineTo(1020, -20); ctx.lineTo(1180, GROUND_Y); ctx.lineTo(740, GROUND_Y); ctx.closePath();
  ctx.fillStyle = PAL.skyBlue; ctx.fill(); ctx.restore();
  drawBokeh(ctx, t, { count: 18, seed: 29, color: '#6670c0', alpha: 0.06, speed: 0.4 });
  ctx.fillStyle = '#0c0d1c'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = '#23254a'; ctx.fillRect(0, GROUND_Y, W, 4);
  // 落地灰尘
  const kk = prog(t, 55, 55.9);
  if (kk < 1) {
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1, j = i % 4;
      ctx.globalAlpha = 0.6 * (1 - kk);
      circle(ctx, 960 + side * (70 + kk * (120 + j * 40)), GROUND_Y - 10 - Math.sin(kk * PI) * 10 * (j + 1),
        (14 - j * 2) * (1 - kk * 0.6), '#3a3d66');
    }
    ctx.globalAlpha = 1;
  }
  const sq = 1 + 0.5 * Math.exp(-7 * dt) * Math.cos(dt * 17);
  drawMe(ctx, 960, ME_Y, { t: t, r: 60, squash: sq, mood: dt > 0.5 ? 'sad' : undefined, lookY: 0.5, look: -0.15,
    glow: 0.25, groundY: GROUND_Y });
  // 小乌云 + 雨
  const cs = easeOutBack(prog(t, 55.7, 56.3), 2);
  const cy = s2RainCloud(ctx, t, cs);
  if (t > 56.2) {
    for (let i = 0; i < 9; i++) {
      const ph = fract(t * 1.8 + hash01(i, 181)), x = 960 - 50 + i * 12.5;
      const y = lerp(cy + 40, ME_Y - 64, ph);
      line(ctx, x, y, x, y + 14, 3, rgba(PAL.skyBlue, 0.8 * (1 - ph * 0.3)));
      if (ph > 0.9) circle(ctx, x + (hash01(i, 182) - 0.5) * 10, ME_Y - 62, 3, rgba(PAL.skyBlue, 0.7));
    }
  }
}
function drawS2(ctx, t) {
  if (t < DIVE_T0) s2Street(ctx, t);
  else if (t < DIVE_T1) {
    drawDive(ctx, t, false);
    veil(ctx, PAL.heaven, 1 - prog(t, DIVE_T0, DIVE_T0 + 0.35));
  } else s2Abyss(ctx, t);
}
SCENE_IMPL.S2 = {
  draw: function (ctx, t) { drawS2(ctx, t); },
  // 「从天堂掉落到深渊」放在右侧，避开左侧下坠的“我”和最右的深度刻度
  heroLayout: function () { return { x: 1160, y: 430, size: 110, maxW: 860 }; }
};
