'use strict';
// =====================================================================
// scenes_b.js — S4 副歌一（1:25–2:06）共用件 + 前三段：
//   85–90 「I only want to be your friend」：“你”的巨大气泡里逐词砸入，
//          friend 描边大字 + 盖章框，冲击抖动（逐词文字由 s4BubbleWords 在歌词层绘制）
//   90–93 「做个朋友」：写着“朋友”的圆徽章从“你”手里飞出，“啪”地贴到“我”胸前
//   93–95 「我在」：暗场，单束聚光灯打在小小的“我”身上
// 其余：scenes_b1.js（95–113）、scenes_b2.js（113–126，歌词分派，登记 SCENE_IMPL.S4）、
//       scenes_b3.js（S5 间奏）。所有画面只由 t 决定（hash01 种子随机，无帧间状态）。
// =====================================================================

const S4_RED = '#ff3b4f';

// ---- 共用：副歌背景（玫紫夜色 + 强节拍散景 + 中心光晕） ----
function s4Backdrop(ctx, t, top, bot, glowCol) {
  const beat = beatPulse(t);
  fillSky(ctx, top, bot);
  softGlow(ctx, 960, 520, 980 + 90 * beat, glowCol || PAL.heart, 0.10 + 0.14 * beat);
  drawBokeh(ctx, t, { count: 34, seed: 13, color: PAL.meGlow, alpha: 0.11, pulse: beat * 1.4, speed: 1.5, maxR: 46 });
}
// 舞台地面：边缘与地面光带随拍发亮
function s4Floor(ctx, t) {
  const beat = beatPulse(t);
  drawGround(ctx, '#1a1232', '#47305e');
  const g = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 140);
  g.addColorStop(0, rgba(PAL.heart, 0.18 * beat)); g.addColorStop(1, rgba(PAL.heart, 0));
  ctx.fillStyle = g; ctx.fillRect(0, GROUND_Y, W, 140);
  ctx.fillStyle = rgba(PAL.heart, 0.6 * beat); ctx.fillRect(0, GROUND_Y, W, 5);
}
// 全屏节拍暗角：每拍开头暗角松开（画面“一亮”），随后收紧
function s4Vignette(ctx, t, gain) {
  const beat = beatPulse(t) * (gain === undefined ? 1 : gain);
  const g = ctx.createRadialGradient(960, 540, 380, 960, 540, 1150);
  g.addColorStop(0, 'rgba(7,7,15,0)');
  g.addColorStop(1, rgba(PAL.abyss, 0.6 - 0.3 * beat));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// 转场：t0 前 0.22 秒斜向色块盖住旧画面；t0 后 0.3 秒色块向右离开、揭示新画面
function s4Trans(ctx, t, t0, col) {
  if (t >= t0 - 0.22 && t < t0) { diagWipe(ctx, prog(t, t0 - 0.22, t0, easeInCubic), col, 260); return; }
  if (t < t0) return;
  const k = prog(t, t0, t0 + 0.3, easeOutCubic);
  if (k >= 1) return;
  const s = 260, x = lerp(-s, W + s, k);
  ctx.beginPath();
  ctx.moveTo(x + s, -10); ctx.lineTo(W + 10, -10); ctx.lineTo(W + 10, H + 10); ctx.lineTo(x - s, H + 10);
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
// 单束聚光灯：从画面顶端打到地面 (x, floorY)，topW/botW 为光锥上下宽度
function drawSpotCone(ctx, t, x, floorY, topW, botW, a, col) {
  if (a <= 0) return;
  const g = ctx.createLinearGradient(0, 0, 0, floorY);
  g.addColorStop(0, rgba(col, 0.34 * a)); g.addColorStop(1, rgba(col, 0.12 * a));
  ctx.beginPath();
  ctx.moveTo(x - topW / 2, -20); ctx.lineTo(x + topW / 2, -20);
  ctx.lineTo(x + botW / 2, floorY); ctx.lineTo(x - botW / 2, floorY); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  ctx.save();
  ctx.globalAlpha = clamp01(a);
  ctx.beginPath(); ctx.ellipse(x, floorY, botW / 2, 42, 0, 0, TAU);
  ctx.fillStyle = rgba(col, 0.32); ctx.fill();
  ctx.restore();
  // 光束里漂浮的微尘
  for (let i = 0; i < 18; i++) {
    const y = fract(hash01(i, 421) + t * (0.02 + 0.03 * hash01(i, 424))) * floorY, wy = y / floorY;
    const px = x + (hash01(i, 422) - 0.5) * lerp(topW, botW, wy) * 0.8 + Math.sin(i + y * 0.01) * 8;
    ctx.globalAlpha = 0.35 * a * (0.5 + 0.5 * Math.sin(i * 2.3 + y * 0.02));
    circle(ctx, px, y, 1.5 + hash01(i, 423) * 2.5, PAL.cream);
  }
  ctx.globalAlpha = 1;
}

// ---- “朋友”圆徽章：中心 (x, y)，半径 r；peel 0..1 为左缘翘起程度（翘起处露出浅色背面） ----
function drawFriendBadge(ctx, x, y, r, rot, peel) {
  if (r <= 0.5) return;
  const p = clamp01(peel || 0);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot || 0);
  if (p > 0) { // 以右缘为铰链：水平压缩 + 斜切，像贴纸被掀起
    ctx.translate(r, 0); ctx.transform(1 - 0.45 * p, -0.35 * p, 0, 1, 0, 0); ctx.translate(-r, 0);
  }
  circle(ctx, r * 0.08, r * 0.14, r, 'rgba(7,7,15,0.3)');
  circle(ctx, 0, 0, r, PAL.you);
  ctx.save();
  ctx.setLineDash([r * 0.16, r * 0.12]);
  ring(ctx, 0, 0, r * 0.8, Math.max(1.5, r * 0.07), PAL.cream);
  ctx.restore();
  circle(ctx, -r * 0.35, -r * 0.42, r * 0.22, 'rgba(255,255,255,0.25)');
  drawText(ctx, '朋友', 0, r * 0.05, r * 0.62, PAL.cream, { weight: 900, family: FONT_CN, shadow: false });
  if (p > 0) {
    ctx.beginPath(); ctx.ellipse(-r + r * 0.32 * p, 0, r * 0.34 * p, r * 0.86, 0, 0, TAU);
    ctx.fillStyle = '#c4f0f2'; ctx.fill();
  }
  ctx.restore();
}
// “我”的胸口（徽章贴附点）：考虑以脚底为锚点的挤压 sq 与旋转 rot
function meChest(x, y, r, sq, rot) {
  const d = 0.54 * r / (sq || 1), a = rot || 0;
  return { x: x + d * Math.sin(a), y: y + r - d * Math.cos(a) };
}
// 小手指尖位置（与 drawCharacter 的变换一致，忽略挤压）
function charHandTip(x, y, r, a, len, rot) {
  const L = r * (0.92 + len), px = Math.cos(a) * L, py = Math.sin(a) * L - r, c = Math.cos(rot || 0), s = Math.sin(rot || 0);
  return { x: x + c * px - s * py, y: y + r + s * px + c * py };
}
// 冲击放射线
function drawImpact(ctx, x, y, since, r0, col) {
  if (since < 0 || since > 0.4) return;
  const k = since / 0.4, e = easeOutCubic(k);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU + 0.3, ra = r0 + e * 70, rb = r0 + 30 + e * 110;
    line(ctx, x + Math.cos(a) * ra, y + Math.sin(a) * ra, x + Math.cos(a) * rb, y + Math.sin(a) * rb, 7 * (1 - k) + 1, rgba(col, 1 - k));
  }
  ring(ctx, x, y, r0 + e * 90, 6 * (1 - k), rgba(col, 0.8 * (1 - k)));
}

// =====================================================================
// 85–90 气泡：S3 末尾奶油色气泡铺满画面 → 收回成“你”头顶的巨大气泡；逐词砸入时整体抖动
// =====================================================================
const S4A_BUB = { x: 210, y: 92, w: 1210, h: 500 };
const S4A_YOU_X = 1430, S4A_YOU_Y = GROUND_Y - 95, S4A_TIP_X = 1345, S4A_TIP_Y = GROUND_Y - 170;
const S4A_WORDS = ['I', 'only', 'want', 'to', 'be', 'your', 'friend'];
// 第 i 个词砸入的时刻（相对歌词开始，秒）；friend 多留半拍
function s4WordT(i) { return 0.45 + i * 0.42 + (i === 6 ? 0.3 : 0); }
const S4A_STAMP = 0.3;   // friend 落下后多久盖章
// 冲击抖动幅度（场景时间）
function s4ShakeA(t) {
  let s = 0;
  for (let i = 0; i < S4A_WORDS.length; i++) {
    const since = t - (85 + s4WordT(i) + 0.16);
    if (since > 0) s += Math.exp(-since * 14) * (i === 6 ? 20 : 7);
  }
  const ss = t - (85 + s4WordT(6) + S4A_STAMP + 0.12);
  if (ss > 0) s += Math.exp(-ss * 12) * 26;
  return s;
}
// 气泡的当前变换（场景层与歌词层共用，保证文字跟气泡一起抖）；返回 false 表示气泡已消失
function s4BubbleXform(ctx, t) {
  const e = prog(t, 89.55, 89.85, easeInBack);
  if (e >= 1) return false;
  const sh = s4ShakeA(t);
  ctx.translate(S4A_TIP_X, S4A_TIP_Y); ctx.scale(1 - e, 1 - e); ctx.translate(-S4A_TIP_X, -S4A_TIP_Y);
  ctx.translate(Math.sin(t * 73) * sh, Math.cos(t * 61) * sh);
  const sq = 1 + sh * 0.0012, cx = S4A_BUB.x + S4A_BUB.w / 2, cy = S4A_BUB.y + S4A_BUB.h / 2;
  ctx.translate(cx, cy); ctx.scale(sq, 1 / sq); ctx.translate(-cx, -cy);
  return true;
}
function s4Bubble(ctx, t) {
  s4Backdrop(ctx, t, '#3a1f4a', '#161a38');
  s4Floor(ctx, t);
  const beat = beatPulse(t), fl = clamp01(s4ShakeA(t) / 20);
  drawMe(ctx, 430, GROUND_Y - 56, { t: t, r: 56, look: 0.7, lookY: -0.65, squash: 1 + 0.2 * fl,
    groundY: GROUND_Y, glow: 0.45 + 0.3 * beat, blink: fl > 0.5 ? 1 : undefined });
  drawYou(ctx, S4A_YOU_X, S4A_YOU_Y, { t: t, r: 95, look: -0.7, lookY: -0.3, groundY: GROUND_Y, glow: 0.3,
    squash: 1 + 0.05 * beat });
  // 气泡尺寸：85.0–85.45 从铺满画面收回
  const k = prog(t, 85, 85.45, easeOutCubic), B = S4A_BUB;
  const x = lerp(-90, B.x, k), y = lerp(-90, B.y, k), w = lerp(W + 180, B.w, k), h = lerp(H + 180, B.h, k);
  ctx.save();
  if (s4BubbleXform(ctx, t)) drawBubble(ctx, x, y, w, h, S4A_TIP_X, S4A_TIP_Y, { fill: PAL.cream, r: lerp(0, 120, k) });
  ctx.restore();
}
// 歌词层：逐词砸入气泡，friend 描边大字 + 盖章框
function s4BubbleWords(ctx, t, tl, L) {
  const lt = tl - L.start;
  ctx.save();
  if (!s4BubbleXform(ctx, t)) { ctx.restore(); return; }
  const cx = S4A_BUB.x + S4A_BUB.w / 2;
  let size = 96;
  let f1 = fontStr(size, 900, FONT_EN), gap = size * 0.32, tot = 0;
  for (let i = 0; i < 6; i++) tot += measureW(ctx, S4A_WORDS[i], f1);
  if (tot + gap * 5 > 1060) { size = Math.floor(size * 1060 / (tot + gap * 5)); f1 = fontStr(size, 900, FONT_EN); gap = size * 0.32; tot = 0; for (let i = 0; i < 6; i++) tot += measureW(ctx, S4A_WORDS[i], f1); }
  let x = cx - (tot + gap * 5) / 2;
  for (let i = 0; i < 6; i++) {
    const w = measureW(ctx, S4A_WORDS[i], f1), k = clamp01((lt - s4WordT(i)) / 0.18);
    if (k > 0) {
      const sc = lerp(2.6, 1, easeOutCubic(k)), rot = (1 - k) * (hash01(i, 401) - 0.5) * 0.6;
      drawGlyph(ctx, S4A_WORDS[i], x + w / 2, 250, sc, rot, clamp01(k * 2.5), PAL.indigo, f1, size, false);
    }
    x += w + gap;
  }
  // friend：描边大字（长投影 + 青绿描边 + 奶油白填充）
  const f2 = fontStr(220, 900, FONT_EN), fw = measureW(ctx, 'friend', f2);
  const k = clamp01((lt - s4WordT(6)) / 0.2);
  if (k > 0) {
    ctx.save();
    ctx.translate(cx, 440); ctx.rotate((1 - k) * -0.25); const s = lerp(3.2, 1, easeOutCubic(k)); ctx.scale(s, s);
    ctx.globalAlpha = clamp01(k * 2.5);
    ctx.font = f2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 18; ctx.strokeStyle = PAL.indigo; ctx.strokeText('friend', 10, 13);
    ctx.lineWidth = 14; ctx.strokeStyle = PAL.you; ctx.strokeText('friend', 0, 0);
    ctx.fillStyle = PAL.cream; ctx.fillText('friend', 0, 0);
    ctx.restore();
  }
  // 盖章框：从大到小砸下，双线圆角框，略倾斜
  const ks = clamp01((lt - s4WordT(6) - S4A_STAMP) / 0.16);
  if (ks > 0) {
    ctx.save();
    ctx.translate(cx, 440); ctx.rotate(-0.07); const s = lerp(1.8, 1, easeOutCubic(ks)); ctx.scale(s, s);
    ctx.globalAlpha = clamp01(ks * 2) * 0.92;
    const bw = fw + 100, bh = 250;
    roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 36); ctx.lineWidth = 12; ctx.strokeStyle = PAL.me; ctx.stroke();
    roundRectPath(ctx, -bw / 2 + 18, -bh / 2 + 18, bw - 36, bh - 36, 24); ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    drawImpact(ctx, cx + fw / 2 + 50, 470, lt - s4WordT(6) - S4A_STAMP - 0.1, 24, PAL.me);
  }
  ctx.restore();
}

// =====================================================================
// 90–93 「做个朋友」：“你”抬手把徽章丢出，弧线飞向“我”，91.05 秒“啪”地贴上胸口
// =====================================================================
const S4B_ME_X = 760, S4B_R = 90, S4B_YOU_X = 1260, S4B_HIT = 91.05;
function s4MePose(t) {   // “我”被贴中后的挤压与后仰
  const since = t - S4B_HIT;
  if (since < 0) return { sq: 1 + 0.04 * beatPulse(t), rot: 0 };
  return { sq: 1 + 0.24 * Math.exp(-since * 8) * Math.cos(since * 20), rot: -0.2 * Math.exp(-since * 6) * Math.sin(since * 14 + 1.2) };
}
function s4BadgeScene(ctx, t) {
  s4Backdrop(ctx, t, '#3a1f4a', '#161a38');
  s4Floor(ctx, t);
  const r = S4B_R, my = GROUND_Y - r, pose = s4MePose(t), since = t - S4B_HIT;
  // “你”：抬手（90.15–90.5）→ 甩出（90.5–90.6）
  const ha = PI + lerp(0.7, 0.05, prog(t, 90.45, 90.6, easeInCubic)) * prog(t, 90.1, 90.4, easeOutCubic) + (t < 90.1 ? 0.25 : 0);
  const ur = 95, uy = GROUND_Y - ur;
  drawYou(ctx, S4B_YOU_X, uy, { t: t, r: ur, look: -0.7, lookY: 0.1, groundY: GROUND_Y, glow: 0.25,
    hands: [{ a: ha, len: 0.6 }], squash: 1 + 0.04 * beatPulse(t) });
  // “我”：先看“你”，被贴中后低头看徽章，再抬头
  const down = env(t, S4B_HIT + 0.1, 92.5, 0.25, 0.4);
  drawMe(ctx, S4B_ME_X, my, { t: t, r: r, squash: pose.sq, rot: pose.rot, look: lerp(0.6, 0.1, down), lookY: lerp(-0.1, 0.9, down),
    groundY: GROUND_Y, glow: 0.5 + 0.3 * beatPulse(t), blink: since > 0 && since < 0.12 ? 1 : undefined });
  const c = meChest(S4B_ME_X, my, r, pose.sq, pose.rot), br = r * 0.4;
  if (t < 90.55) {
    const hand = charHandTip(S4B_YOU_X, uy, ur, ha, 0.6, 0);
    drawFriendBadge(ctx, hand.x, hand.y - 6, 26 * easeOutBack(prog(t, 90.05, 90.35), 2), 0.2, 0);
  } else if (t < S4B_HIT) {
    const u = prog(t, 90.55, S4B_HIT, easeInQuad), hand = charHandTip(S4B_YOU_X, uy, ur, PI + 0.05, 0.6, 0);
    const qx = 1010, qy = 330, iu = 1 - u;
    const bx = iu * iu * hand.x + 2 * iu * u * qx + u * u * c.x, by = iu * iu * hand.y + 2 * iu * u * qy + u * u * c.y;
    // 拖尾
    for (let j = 1; j <= 3; j++) {
      const v = Math.max(0, u - j * 0.06), iv = 1 - v;
      ctx.globalAlpha = 0.18 * (4 - j) / 3;
      circle(ctx, iv * iv * hand.x + 2 * iv * v * qx + v * v * c.x, iv * iv * hand.y + 2 * iv * v * qy + v * v * c.y, lerp(26, br, v), PAL.you);
    }
    ctx.globalAlpha = 1;
    drawFriendBadge(ctx, bx, by, lerp(26, br * 1.1, u), u * 4 * PI, 0);
  } else {
    drawFriendBadge(ctx, c.x, c.y, br * (1 + 0.3 * Math.exp(-since * 10)), pose.rot, 0);
    drawImpact(ctx, c.x, c.y, since, br + 10, PAL.cream);
  }
}

// =====================================================================
// 93–95 「我在」：暗场 + 单束聚光，“我”小小一个站在光里（胸前仍贴着徽章）
// =====================================================================
function s4Spot(ctx, t) {
  fillSky(ctx, '#0b0a1a', '#120f26');
  ctx.fillStyle = '#0d0b1e'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  // 通电闪烁后常亮
  const on = t < 93.18 ? (hash01(Math.floor(t * 30), 431) < 0.55 ? 0.25 : 1) : 1;
  const r = 44, mx = 960, my = GROUND_Y - r;
  drawSpotCone(ctx, t, mx, GROUND_Y, 110, 300, on, PAL.heaven);
  const lk = prog(t, 93.6, 94.1, easeInOutCubic);
  drawMe(ctx, mx, my, { t: t, r: r, look: 0, lookY: lerp(-0.9, 0, lk), groundY: GROUND_Y, glow: 0.4 * on,
    squash: 1 + 0.05 * beatPulse(t) });
  drawFriendBadge(ctx, mx, meChest(mx, my, r, 1, 0).y, r * 0.4, 0, 0);
}
