'use strict';
// =====================================================================
// scenes_b3.js — S5 间奏 2:06–2:14（无歌词）：时间流逝蒙太奇
//   日历页一张张撕下翻飞；“我”沿小路行走（镜头跟随，世界向左滚动）；
//   城市楼群三层视差滚动；“你”的剪影偶尔出现在亮着的窗户里；小雨。
// 楼群按“槽位”程序化生成（hash01），可无限滚动，画面只由 t 决定。
// =====================================================================
const S5_T0 = 126, S5_PATH_Y = 850, S5_ME_X = 760, S5_ME_R = 56;

// 楼群视差层。o = { speed, slot, seed, minH, varH, col, base, win, start }
function s5Buildings(ctx, t, o) {
  const off = (t - S5_T0) * o.speed + o.start;
  const i0 = Math.floor(off / o.slot) - 1, i1 = Math.floor((off + W) / o.slot) + 1;
  for (let i = i0; i <= i1; i++) {
    const w = o.slot * (0.72 + 0.22 * hash01(i, o.seed)), h = o.minH + hash01(i, o.seed + 1) * o.varH;
    const x = i * o.slot - off + (o.slot - w) / 2, top = o.base - h;
    ctx.fillStyle = o.col; ctx.fillRect(x, top, w, h + 2);
    if (hash01(i, o.seed + 2) < 0.4) ctx.fillRect(x + w * 0.2, top - 16, w * 0.22, 16);
    if (!o.win) continue;
    const cols = Math.floor((w - 24) / 34), rows = Math.floor((h - 50) / 46);
    // “你”的窗：部分楼有一扇大窗，隔一段时间亮起，窗里是青绿色圆形剪影
    const youWin = hash01(i, o.seed + 3) < 0.35 && cols >= 3 && rows >= 3;
    const yc = Math.floor(cols / 2) - 1, yr = 1;
    const youOn = youWin && fract((t + hash01(i, o.seed + 5) * 4) / 2.6) < 0.62;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (youWin && r >= yr && r <= yr + 1 && c >= yc && c <= yc + 1) continue;
        const id = i * 97 + r * 13 + c;
        if (hash01(id, o.seed + 4) > 0.3) continue;
        ctx.fillStyle = rgba(PAL.meGlow, 0.45 * (0.75 + 0.25 * Math.sin(t * 0.8 + id)));
        ctx.fillRect(x + 14 + c * 34, top + 26 + r * 46, 16, 24);
      }
    }
    if (youWin) {
      const wx = x + 14 + yc * 34 - 4, wy = top + 26 + yr * 46 - 4, ww = 58, wh = 74;
      ctx.fillStyle = youOn ? '#ffd08a' : '#2a3060'; ctx.fillRect(wx, wy, ww, wh);
      if (youOn) {
        softGlow(ctx, wx + ww / 2, wy + wh / 2, 90, PAL.meGlow, 0.35);
        circle(ctx, wx + ww / 2, wy + wh * 0.58, 20, '#1f6a71');
        ctx.fillStyle = '#1f6a71'; ctx.fillRect(wx + 8, wy + wh * 0.82, ww - 16, wh * 0.18);
      }
      ctx.fillStyle = o.col; ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh); ctx.fillRect(wx, wy + wh / 2 - 2, ww, 4);
    }
  }
}
// 日历页：中心 (x, y)，idx 决定月份与日期；sx 为水平翻转压缩（翻飞时模拟背面）
function s5CalPage(ctx, x, y, w, h, idx, rot, sx, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, 1);
  ctx.globalAlpha = clamp01(a);
  const back = sx < 0;
  fillRoundRect(ctx, -w / 2, -h / 2, w, h, 14, back ? '#e9dcc4' : PAL.cream);
  if (!back) {
    ctx.save(); roundRectPath(ctx, -w / 2, -h / 2, w, h, 14); ctx.clip();
    ctx.fillStyle = PAL.me; ctx.fillRect(-w / 2, -h / 2, w, h * 0.28);
    ctx.restore();
    const month = (idx + 2) % 12 + 1, day = 1 + Math.floor(hash01(idx, 501) * 28);
    drawText(ctx, month + '月', 0, -h / 2 + h * 0.14, h * 0.15, PAL.cream, { weight: 800, family: FONT_CN, shadow: false, alpha: a });
    drawText(ctx, String(day), 0, h * 0.14, h * 0.42, PAL.indigo, { weight: 900, family: FONT_EN, shadow: false, alpha: a });
  }
  ctx.restore();
}
const S5_CAL_X = 1560, S5_CAL_Y = 270, S5_CAL_W = 250, S5_CAL_H = 270, S5_FLIP0 = 126.5, S5_FLIP = 0.55;
function s5Calendar(ctx, t) {
  const rise = easeOutBack(prog(t, 126.15, 126.55), 1.6);
  if (rise <= 0) return;
  const p = t < S5_FLIP0 ? -1 : Math.min(12, Math.floor((t - S5_FLIP0) / S5_FLIP));
  ctx.save();
  ctx.translate(S5_CAL_X, S5_CAL_Y); ctx.scale(rise, rise); ctx.translate(-S5_CAL_X, -S5_CAL_Y);
  fillRoundRect(ctx, S5_CAL_X - S5_CAL_W / 2 + 10, S5_CAL_Y - S5_CAL_H / 2 + 14, S5_CAL_W, S5_CAL_H, 14, 'rgba(7,7,15,0.35)');
  s5CalPage(ctx, S5_CAL_X, S5_CAL_Y, S5_CAL_W, S5_CAL_H, p + 1, 0, 1, 1);
  // 装订条与线圈
  fillRoundRect(ctx, S5_CAL_X - S5_CAL_W / 2 - 8, S5_CAL_Y - S5_CAL_H / 2 - 18, S5_CAL_W + 16, 26, 10, '#2e3466');
  for (let k = -1; k <= 1; k += 2) ring(ctx, S5_CAL_X + k * 70, S5_CAL_Y - S5_CAL_H / 2 - 6, 9, 5, PAL.grey);
  ctx.restore();
  // 撕下的页：向左上飞起后飘落，边飞边翻转
  for (let q = Math.max(0, p - 3); q <= p; q++) {
    const age = t - (S5_FLIP0 + q * S5_FLIP);
    if (age < 0 || age > 1.8) continue;
    const dir = hash01(q, 502) < 0.5 ? -1 : 1;
    const x = S5_CAL_X - age * (260 + 120 * hash01(q, 503)) + Math.sin(age * 6 + q) * 40;
    const y = S5_CAL_Y - 140 * age + 260 * age * age;
    s5CalPage(ctx, x, y, S5_CAL_W, S5_CAL_H, q, dir * (age * 1.6 + Math.sin(age * 5 + q) * 0.4), Math.cos(age * 7 + q * 0.5), 1 - age / 1.8);
  }
}
function s5Rain(ctx, t) {
  ctx.save();
  ctx.strokeStyle = 'rgba(191,227,255,0.35)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 130; i++) {
    const sp = 0.9 + 0.5 * hash01(i, 511), span = H + 120;
    const y = fract(hash01(i, 512) + t * sp * 1.2) * span - 60;
    const x = ((hash01(i, 513) * (W + 200) - t * 120 - y * 0.25) % (W + 200) + W + 200) % (W + 200) - 100;
    ctx.moveTo(x, y); ctx.lineTo(x - 9, y + 30);
  }
  ctx.stroke();
  // 地面溅起的小水圈
  for (let i = 0; i < 18; i++) {
    const ph = fract(t * 1.3 + hash01(i, 514)), x = hash01(i + Math.floor(t * 1.3 + hash01(i, 514)) * 19, 515) * W;
    const y = S5_PATH_Y - 30 + hash01(i, 516) * 200;
    ctx.globalAlpha = 0.4 * (1 - ph);
    ctx.beginPath(); ctx.ellipse(x, y, 4 + ph * 22, 2 + ph * 6, 0, 0, TAU); ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}
function drawS5(ctx, t) {
  fillSky(ctx, '#1b2240', '#3a4a7a');
  // 阴天云层缓慢漂移
  for (let i = 0; i < 6; i++) {
    const x = ((hash01(i, 521) * (W + 600) - (t - S5_T0) * 18) % (W + 600) + W + 600) % (W + 600) - 300;
    drawCloud(ctx, x, 90 + hash01(i, 522) * 160, 140 + hash01(i, 523) * 80, '#2b3563', 0.9);
  }
  s5Buildings(ctx, t, { speed: 30, slot: 150, seed: 531, minH: 220, varH: 230, col: '#2a3462', base: GROUND_Y, win: false, start: 0 });
  s5Buildings(ctx, t, { speed: 110, slot: 230, seed: 541, minH: 240, varH: 260, col: '#1a2048', base: GROUND_Y, win: true, start: 400 });
  // 地面 + 小路（虚线中线随步伐滚动）
  ctx.fillStyle = '#121734'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = '#2b3160'; ctx.fillRect(0, S5_PATH_Y - 30, W, 60);
  ctx.fillStyle = 'rgba(255,244,224,0.18)';
  const po = ((t - S5_T0) * 260) % 160;
  for (let x = -po; x < W; x += 160) ctx.fillRect(x, S5_PATH_Y - 3, 80, 6);
  // 雨中积水反光
  ctx.fillStyle = 'rgba(191,227,255,0.06)'; ctx.fillRect(0, S5_PATH_Y + 30, W, 8);
  // “我”沿小路走：每拍一步（上下颠 + 挤压 + 摆手），偶尔抬头看窗
  const ph = beatPos(t) - beatPos(S5_T0), bob = Math.abs(Math.sin(ph * PI)) * 14, sw = Math.sin(ph * PI) * 0.35;
  const up = Math.max(env(t, 128.3, 129.4, 0.3, 0.3), env(t, 131.1, 132.3, 0.3, 0.3));
  drawMe(ctx, S5_ME_X, S5_PATH_Y - S5_ME_R - bob, { t: t, r: S5_ME_R, squash: 1 + 0.06 * Math.cos(ph * TAU),
    look: 0.55 + 0.2 * up, lookY: -0.7 * up + 0.15 * (1 - up), groundY: S5_PATH_Y, glow: 0.45,
    hands: [{ a: PI * 0.62 + sw, len: 0.45 }, { a: PI * 0.38 + sw, len: 0.45 }] });
  // 前景快速掠过的路灯与矮树丛（最近一层视差）
  const fo = (t - S5_T0) * 420;
  for (let i = Math.floor(fo / 700) - 1; i <= Math.floor((fo + W) / 700) + 1; i++) {
    const x = i * 700 - fo + 300;
    ctx.fillStyle = '#0b0f24';
    ctx.beginPath(); ctx.arc(x + 260, H + 20, 150 + 40 * hash01(i, 551), PI, TAU); ctx.fill();
    fillRoundRect(ctx, x - 9, 470, 18, H - 470, 8, '#0b0f24');
    fillRoundRect(ctx, x - 9, 462, 90, 14, 7, '#0b0f24');
    softGlow(ctx, x + 70, 486, 120, PAL.meGlow, 0.35);
    circle(ctx, x + 70, 484, 11, '#ffe1a8');
  }
  s5Rain(ctx, t);
  s5Calendar(ctx, t);
  veil(ctx, '#1b2240', 0.12);
  s4Vignette(ctx, t, 0.3);
  s4Trans(ctx, t, S5_T0, PAL.me);   // 揭示：S4 末尾的珊瑚色斜块向右离开
}
SCENE_IMPL.S5 = { draw: function (ctx, t) { drawS5(ctx, t); } };
