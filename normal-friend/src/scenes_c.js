'use strict';
// =====================================================================
// scenes_c.js — S6 主歌二（2:14–2:58）共用件 + 前四段。
// 复用 S2/S3 母题，但用更冷的紫蓝夜色、更快的镜头切换、更强的变体：
//   134–137 「我猜」：多个问号环绕“我”旋转（前后分层），镜头推近
//   137–141 「你早就想要说明白」：一排“…”气泡依次弹出、并排打字不结束，“你”视线移开
//   141–143 「That's right」（大字）：大对勾 ✓ 一笔画出并盖章
//   143–147 「我觉得自己好失败」：爱心碎成许多三角碎片，带 glitch 飞散，画面降饱和
// 后续：scenes_c1.js（147–162）、scenes_c2.js（162–178，登记 SCENE_IMPL.S6）。
// 所有画面只由 t 决定（hash01 / 加载时固定随机表），无帧间状态。
// =====================================================================

const S6_COLD = '#8a7bff', S6_ICE = '#bcd0ff', S6_DEEP = '#120f33';

// ---- 共用：冷色夜晚街道（S0/S1 的街道换成紫蓝色调） ----
function s6Street(ctx, t) {
  drawStreet(ctx, t, { top: '#0e0c26', bot: '#2a2560', starA: 0.85, bld: '#1b1840', gnd: '#0b0a1f',
    rim: '#2f2a6a', win: 0.45, light: 0.8 });
  drawBokeh(ctx, t, { count: 26, seed: 601, color: S6_COLD, alpha: 0.09, pulse: beatPulse(t) * 0.6, speed: 1.3 });
}
// 圆形“开眼”转场：t0..t0+d 期间，黑幕中央开出的圆洞从 0 扩大到铺满
function s6Iris(ctx, t, t0, d, x, y) {
  const k = prog(t, t0, t0 + d, easeInOutCubic);
  if (k >= 1) return;
  const R = Math.max(0.5, k * 1500);
  ctx.beginPath(); ctx.rect(0, 0, W, H);
  ctx.moveTo(x + R, y); ctx.arc(x, y, R, 0, TAU, true);
  ctx.fillStyle = '#05040c'; ctx.fill('evenodd');
}
// glitch：RGB 色差 + 横向错位噪声带（复用 S3 的 VHS 工具，离屏缓冲每帧完整重写）
function s6Glitch(ctx, t, amt) {
  if (amt <= 0.02) return;
  rgbShift(ctx, 4 + 26 * amt);
  vhsBands(ctx, t, amt);
}

// =====================================================================
// 134–137 「我猜」：问号环绕旋转
// =====================================================================
function s6QMarks(ctx, t, cx, cy, front) {
  const cols = [PAL.cream, S6_COLD, PAL.meGlow, S6_ICE];
  const out = 1 - prog(t, 136.7, 137.0, easeInQuad);
  for (let i = 0; i < 7; i++) {
    const k = prog(t, 134.15 + i * 0.12, 134.6 + i * 0.12);
    if (k <= 0) continue;
    const a = i / 7 * TAU + (t - 134) * 1.9, s = Math.sin(a);
    if ((s > 0) !== front) continue;
    const pop = easeOutBack(k, 2.4) * out;
    if (pop <= 0.02) continue;
    const depth = 0.78 + 0.3 * (s + 1) / 2;
    const x = cx + Math.cos(a) * 205, y = cy + s * 70 - 30 * Math.cos(a) + Math.sin(t * 3 + i) * 8;
    drawQuestion(ctx, x, y, (58 + 28 * hash01(i, 611)) * depth * pop, cols[i % 4], front ? 1 : 0.6, Math.sin(t * 3 + i) * 0.3);
  }
}
function s6Guess(ctx, t) {
  const zk = prog(t, 134.3, 135.4, easeInOutCubic) * (1 - prog(t, 136.6, 137.0, easeInOutCubic));
  withCamera(ctx, lerp(960, ME_X + 60, zk), lerp(540, 620, zk), lerp(1, 1.3, zk), 0, function () {
    s6Street(ctx, t);
    const cx = ME_X, cy = ME_Y - 80;
    s6QMarks(ctx, t, cx, cy, false);
    const look = clamp(Math.sin((t - 134) * 5.5) * 2, -1, 1);
    drawMe(ctx, ME_X, ME_Y, { t: t, r: 60, look: look, lookY: -0.45, groundY: GROUND_Y, glow: 0.45,
      squash: 1 + 0.05 * beatPulse(t), rot: Math.sin((t - 134) * 5.5) * 0.06 });
    s6QMarks(ctx, t, cx, cy, true);
  });
  s6Iris(ctx, t, 134, 0.5, ME_X, ME_Y);   // 从 S5 硬切黑场后开眼
}

// =====================================================================
// 137–141 「你早就想要说明白」：一排“…”气泡
// =====================================================================
function s6Dots(ctx, t) {
  s6Street(ctx, t);
  const away = prog(t, 137.9, 138.4, easeInOutCubic);
  drawMe(ctx, ME_X, ME_Y, { t: t, r: 60, look: 0.55, lookY: -0.75, groundY: GROUND_Y, glow: 0.4 });
  const ux = lerp(1560, YOU_X, prog(t, 137.0, 137.35, easeOutCubic));
  drawYou(ctx, ux, YOU_Y, { t: t, r: 78, look: lerp(-0.8, 1, away), lookY: -0.3 * away, groundY: GROUND_Y });
  const hx = ux - 10, hy = YOU_Y - 90;
  for (let i = 0; i < 5; i++) {
    const t0 = 137.25 + i * 0.6, g = prog(t, t0, t0 + 0.35);
    const e = prog(t, 140.7 + i * 0.04, 140.95 + i * 0.04, easeInQuad);
    if (g <= 0 || e >= 1) continue;
    const bw = 270, bh = 130, bx = 205 + i * 310, by = 140 + (i % 2) * 70 + Math.sin(t * 2 + i) * 6;
    const cxb = bx + bw / 2, cyb = by + bh / 2, s = easeOutBack(g, 2) * (1 - e);
    // 尾巴指向“你”的头顶方向（短尾巴）
    const dx = hx - cxb, dy = hy - (by + bh), L = Math.hypot(dx, dy) || 1;
    const tx = cxb + dx / L * 70, ty = by + bh + Math.max(30, dy / L * 70);
    ctx.save();
    ctx.translate(cxb, by + bh); ctx.scale(s, s); ctx.translate(-cxb, -(by + bh));
    drawBubble(ctx, bx + 6, by + 8, bw, bh, tx + 6, ty + 8, { fill: 'rgba(7,7,15,0.3)' });
    drawBubble(ctx, bx, by, bw, bh, tx, ty, { fill: PAL.cream });
    drawDots(ctx, cxb, cyb + 4, t + i * 0.37, { color: PAL.indigo, r: 10, gap: 32 });
    ctx.restore();
  }
}

// =====================================================================
// 141–143 「That's right」：大对勾一笔画出 + 盖章
// =====================================================================
const S6C_PTS = [780, 660, 920, 790, 1170, 500], S6C_CX = 970, S6C_CY = 640, S6C_STAMP = 141.8;
function s6CheckPath(ctx, k) {
  const P = S6C_PTS, l1 = Math.hypot(P[2] - P[0], P[3] - P[1]), l2 = Math.hypot(P[4] - P[2], P[5] - P[3]);
  const d = k * (l1 + l2);
  ctx.beginPath(); ctx.moveTo(P[0], P[1]);
  if (d <= l1) { ctx.lineTo(lerp(P[0], P[2], d / l1), lerp(P[1], P[3], d / l1)); return; }
  ctx.lineTo(P[2], P[3]);
  ctx.lineTo(lerp(P[2], P[4], (d - l1) / l2), lerp(P[3], P[5], (d - l1) / l2));
}
function s6Check(ctx, t) {
  const beat = beatPulse(t), since = t - S6C_STAMP, sh = since > 0 ? Math.exp(-since * 11) * 18 : 0;
  fillSky(ctx, '#1b1550', '#0a0920');
  softGlow(ctx, S6C_CX, S6C_CY, 900, S6_COLD, 0.16 + 0.12 * beat);
  ctx.save(); ctx.translate(S6C_CX, S6C_CY); ctx.rotate(t * 0.3);
  ctx.globalAlpha = 0.07 + (since > 0 ? 0.14 * Math.exp(-since * 3) : 0);
  for (let i = 0; i < 16; i++) {
    ctx.rotate(TAU / 16);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -1300); ctx.lineTo(60, -1300); ctx.closePath();
    ctx.fillStyle = S6_ICE; ctx.fill();
  }
  ctx.restore();
  drawBokeh(ctx, t, { count: 30, seed: 613, color: S6_ICE, alpha: 0.1, pulse: beat, speed: 1.6 });
  ctx.fillStyle = '#0b0a1f'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.save();
  ctx.translate(Math.sin(t * 71) * sh, Math.cos(t * 59) * sh);
  // “我”在左侧，被盖章时吓得一缩
  const flinch = since > 0 ? Math.exp(-since * 6) : 0;
  drawMe(ctx, 300, GROUND_Y - 50, { t: t, r: 50, look: 0.9, lookY: -0.4, mood: 'sad', groundY: GROUND_Y,
    glow: 0.3, squash: 1 + 0.25 * flinch, blink: flinch > 0.6 ? 1 : undefined });
  // 对勾：长投影 + 粗笔画
  const k = prog(t, 141.2, 141.65, easeInOutCubic);
  if (k > 0) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(14, 18); s6CheckPath(ctx, k); ctx.lineWidth = 72; ctx.strokeStyle = 'rgba(7,7,15,0.45)'; ctx.stroke(); ctx.restore();
    s6CheckPath(ctx, k); ctx.lineWidth = 72; ctx.strokeStyle = PAL.you; ctx.stroke();
    s6CheckPath(ctx, k); ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
  }
  // 盖章圆框：从大砸下，双线，略倾斜；外扩冲击环
  const ks = prog(t, S6C_STAMP, S6C_STAMP + 0.16);
  if (ks > 0) {
    ctx.save();
    ctx.translate(S6C_CX, S6C_CY); ctx.rotate(-0.12); const s = lerp(1.7, 1, easeOutCubic(ks)); ctx.scale(s, s);
    ctx.globalAlpha = clamp01(ks * 2) * 0.95;
    ring(ctx, 0, 0, 220, 16, PAL.me);
    ring(ctx, 0, 0, 194, 5, PAL.me);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      circle(ctx, Math.cos(a) * 207, Math.sin(a) * 207, 4, PAL.me);
    }
    ctx.restore();
    const ek = clamp01((since - 0.05) / 0.45);
    if (ek > 0 && ek < 1) ring(ctx, S6C_CX, S6C_CY, 220 + 80 * easeOutCubic(ek), 10 * (1 - ek), rgba(PAL.cream, 0.8 * (1 - ek)));
  }
  ctx.restore();
  veil(ctx, '#ffffff', since > 0 ? 0.35 * Math.exp(-since * 14) : 0);
}

// =====================================================================
// 143–147 「我觉得自己好失败」：爱心碎成三角碎片 + glitch
// =====================================================================
const S6D_X = 1060, S6D_Y = 420, S6D_S = 10, S6D_BREAK = 144.4;
// 碎片表（加载时生成）：在单位爱心内取抖动网格点，每点一片三角形
const S6D_SHARDS = (function () {
  const out = [];
  let c = 0;
  for (let gy = -11; gy <= 16; gy += 2.5) {
    for (let gx = -15; gx <= 15; gx += 2.5) {
      c++;
      const x = gx + (hash01(c, 621) - 0.5) * 1.2, y = gy + (hash01(c, 622) - 0.5) * 1.2;
      if (!s4InHeart(x, y)) continue;
      const a = Math.atan2(y - 2, x) + (hash01(c, 623) - 0.5) * 0.9;
      out.push({ x: x, y: y, a: a, sp: 380 + hash01(c, 624) * 720, size: 1.6 + hash01(c, 625) * 1.2,
        rot: hash01(c, 626) * TAU, spin: (hash01(c, 627) - 0.5) * 14, col: Math.floor(hash01(c, 628) * 3) });
    }
  }
  return out;
})();
const S6D_COLS = [PAL.heart, '#ff86a8', '#d9467a'];
function s6Shatter(ctx, t) {
  const gray = prog(t, S6D_BREAK, 146.2), beat = beatPulse(t);
  fillSky(ctx, mixColor('#221c5a', '#1a1a2a', gray), mixColor('#0d0b26', '#0a0a12', gray));
  drawBokeh(ctx, t, { count: 22, seed: 631, color: S6_COLD, alpha: 0.08, pulse: beat * 0.5 });
  drawGround(ctx, '#0c0b1f', '#2a2560');
  const after = t > S6D_BREAK + 0.3;
  drawMe(ctx, 520, GROUND_Y - 60, { t: t, r: 60, look: 0.85, lookY: after ? 0.5 : -0.4, mood: after ? 'sad' : undefined,
    groundY: GROUND_Y, glow: lerp(0.5, 0.15, gray), squash: 1 + 0.12 * prog(t, S6D_BREAK, S6D_BREAK + 0.4, easeOutBack) });
  const dt = t - S6D_BREAK;
  if (dt < 0) {
    const pop = easeOutBack(prog(t, 143.0, 143.4), 2), shake = prog(t, 143.7, S6D_BREAK) * 7;
    drawHeartHalves(ctx, S6D_X + Math.sin(t * 63) * shake, S6D_Y + Math.cos(t * 57) * shake, S6D_S * pop,
      { crack: prog(t, 143.6, 144.2), fill: PAL.heart });
  } else {
    const fade = 1 - 0.65 * prog(dt, 1.2, 2.6);
    for (let i = 0; i < S6D_SHARDS.length; i++) {
      const s = S6D_SHARDS[i], d = s.sp * (1 - Math.exp(-2.4 * dt)) / 2.4;
      const x = S6D_X + s.x * S6D_S + Math.cos(s.a) * d, y = S6D_Y + s.y * S6D_S + Math.sin(s.a) * d + 90 * dt * dt;
      const r = s.size * S6D_S * (1 - 0.3 * prog(dt, 0, 2.5)), rot = s.rot + dt * s.spin;
      ctx.globalAlpha = fade;
      regularPolyPath(ctx, x, y, r, 3, rot);
      ctx.fillStyle = S6D_COLS[s.col]; ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  veil(ctx, '#ffffff', 0.5 * (1 - prog(t, S6D_BREAK, S6D_BREAK + 0.15)) * (dt >= 0 ? 1 : 0));
  desatScreen(ctx, gray * 0.6);
  const gl = Math.max(env(t, 143.85, 144.0, 0.02, 0.05), env(t, S6D_BREAK, S6D_BREAK + 0.35, 0.02, 0.2),
    env(t, 145.6, 145.72, 0.02, 0.04), env(t, 146.35, 146.5, 0.02, 0.05));
  s6Glitch(ctx, t, gl);
}
