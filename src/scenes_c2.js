'use strict';
// =====================================================================
// scenes_c2.js — S6 主歌二 后段（2:42–2:58）+ 登记 SCENE_IMPL.S6
//   162–167 「我无法只是 只是做你的朋友」：歌词里两处“只是”做回声叠影（多层渐隐复制，s6EchoGhosts），
//            “我”向“你”喊出一圈圈回声弧，身后拖着渐隐的回声残影
//   167–171 「感情已那么深」：“我”脚下长出粉色树根，扎进地下剖面（分层土壤）
//   171–175 「叫我怎么能放手」：两人牵手被拉向两侧，手臂拉长、抖动
//   175–178 「但你说」：定格压暗，“你”上前一步，对话气泡展开并铺满画面（接 S7 开头的气泡）
// =====================================================================

// ---- 162–167 回声 ----
function s6Echo(ctx, t) {
  s6Street(ctx, t);
  const beat = beatPulse(t), b0 = beatIndex(t), ox = ME_X + 30, oy = ME_Y - 10;
  // 每拍从“我”发出一道回声弧，传向“你”
  ctx.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    const tb = beatTime(b0 - k), age = t - tb;
    if (tb < 162.3 || age < 0 || age > 1.6) continue;
    const f = 1 - age / 1.6;
    ctx.beginPath(); ctx.arc(ox, oy, 70 + age * 360, -0.55, 0.55);
    ctx.lineWidth = 3 + 7 * f; ctx.strokeStyle = rgba(S6_COLD, 0.8 * f); ctx.stroke();
  }
  // 回声残影：三层渐隐的“我”向左后方拖开
  const ghost = env(t, 162.8, 166.6, 0.4, 0.5), gcol = mixColor(PAL.me, S6_COLD, 0.55);
  for (let j = 3; j >= 1; j--) {
    if (ghost <= 0) break;
    const d = j * 52 * (0.65 + 0.35 * Math.sin(t * 3 - j));
    drawMe(ctx, ME_X - d, ME_Y - j * 6, { t: t, r: 60, color: gcol, glow: 0, shadow: false, look: 0.9,
      alpha: ghost * 0.24 * (4 - j) / 3 });
  }
  drawMe(ctx, ME_X, ME_Y, { t: t, r: 60, look: 0.95, lookY: -0.2, groundY: GROUND_Y, glow: 0.5 + 0.3 * beat,
    squash: 1 + 0.1 * beat });
  drawYou(ctx, YOU_X, YOU_Y, { t: t, r: 78, look: 1, lookY: -0.2, groundY: GROUND_Y, rot: Math.sin(t * 4) * 0.035 });
}
// 歌词底层：在“只是”两字后面画多层渐隐复制（位置与 lyrics.js 下方歌词区的排版一致，正文随后由 lyrics.js 绘制）
function s6EchoGhosts(ctx, t) {
  const L = findLyric(t);
  if (!L || L.text !== '我无法只是 只是做你的朋友') return;
  const tl = t - LYRIC_OFFSET, P = prepText(L.text), Lo = layoutChars(ctx, P, LYR_SIZE, LYR_MAXW, 800, FONT_MIX);
  const n = P.chars.length, stagger = Math.min(0.09, 1.3 / n);   // 与 S6 的 type 入场一致
  const exitDur = Math.min(0.4, (L.end - L.start) * 0.15), ex = clamp01((tl - (L.end - exitDur)) / exitDur);
  let x = W / 2 - Lo.total / 2, from = 0;
  const marks = [];
  for (;;) { const i = L.text.indexOf('只是', from); if (i < 0) break; marks.push(i, i + 1); from = i + 2; }
  for (let i = 0; i < n; i++) {
    const w = Lo.ws[i], cx = x + w / 2; x += w;
    if (marks.indexOf(i) < 0) continue;
    const ek = prog(tl, L.start + i * stagger + 0.35, L.start + i * stagger + 0.9, easeOutCubic);
    if (ek <= 0) continue;
    const wave = 0.5 + 0.5 * Math.sin(tl * 4 - i * 0.5);
    for (let j = 3; j >= 1; j--) {
      // 回声向上逐层飘开、变大、变淡（只沿竖直方向，保持可辨认，不碰到上方的角色）
      const d = j * ek * (0.8 + 0.2 * wave);
      drawGlyph(ctx, P.chars[i], cx, LYR_Y - d * 30, 1 + d * 0.06, 0,
        (1 - ex) * 0.5 * (1 - j / 4), j % 2 ? S6_COLD : S6_ICE, Lo.font, Lo.size, false);
    }
  }
}

// ---- 167–171 粉色树根 ----
const S6J_GY = 470;
// 树根分段表（加载时用固定种子生成）：每段 {x1,y1,x2,y2,w,t0,t1}，t0/t1 归一化到 0..1 的生长时刻
const S6J_ROOTS = (function () {
  const rnd = mulberry32(667), segs = [];
  function grow(x, y, a, len, w, t0, depth) {
    const steps = 6 + Math.floor(rnd() * 4);
    for (let i = 0; i < steps; i++) {
      a = lerp(a + (rnd() - 0.5) * 0.55, PI / 2, 0.08);
      const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len, t1 = t0 + 0.05 + rnd() * 0.02;
      segs.push({ x1: x, y1: y, x2: nx, y2: ny, w: w, t0: t0, t1: t1 });
      if (depth < 2 && rnd() < 0.22) grow(nx, ny, a + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6), len * 0.78, w * 0.62, t1, depth + 1);
      x = nx; y = ny; t0 = t1; w *= 0.9;
    }
  }
  for (let r = 0; r < 5; r++) grow(960 + (r - 2) * 14, S6J_GY + 2, PI / 2 + (r - 2) * 0.42, 46, 13, rnd() * 0.08, 0);
  let mx = 0;
  for (let i = 0; i < segs.length; i++) mx = Math.max(mx, segs[i].t1);
  for (let i = 0; i < segs.length; i++) { segs[i].t0 /= mx; segs[i].t1 /= mx; }
  return segs;
})();
const S6J_SOIL = ['#2a1f3d', '#231a35', '#1b142b', '#130e20', '#0c0916'];
function s6Roots(ctx, t) {
  const beat = beatPulse(t), z = lerp(1.08, 1, prog(t, 167, 171, easeOutCubic));
  withCamera(ctx, 960, 560, z, 0, function () {
    const g = ctx.createLinearGradient(0, 0, 0, S6J_GY);
    g.addColorStop(0, '#0e0c26'); g.addColorStop(1, '#2a2560');
    ctx.fillStyle = g; ctx.fillRect(-100, -100, W + 200, S6J_GY + 100);
    drawStars(ctx, t, 0.7);
    softGlow(ctx, 1500, 160, 120, S6_ICE, 0.35); circle(ctx, 1500, 160, 44, S6_ICE);
    // 分层土壤（波浪形分界）
    for (let b = 0; b < S6J_SOIL.length; b++) {
      const y0 = S6J_GY + b * 125;
      ctx.beginPath(); ctx.moveTo(-100, H + 100);
      for (let x = -100; x <= W + 100; x += 60) ctx.lineTo(x, y0 + (b ? Math.sin(x * 0.006 + b * 1.7) * 18 : 0));
      ctx.lineTo(W + 100, H + 100); ctx.closePath(); ctx.fillStyle = S6J_SOIL[b]; ctx.fill();
    }
    for (let i = 0; i < 26; i++) {
      ctx.beginPath(); ctx.ellipse(hash01(i, 681) * W, S6J_GY + 40 + hash01(i, 682) * 560, 10 + hash01(i, 683) * 18, 6 + hash01(i, 684) * 8, hash01(i, 685), 0, TAU);
      ctx.fillStyle = 'rgba(255,244,224,0.06)'; ctx.fill();
    }
    ctx.fillStyle = '#3a3270'; ctx.fillRect(-100, S6J_GY - 3, W + 200, 6);
    // 树根逐段生长；生长中的根尖发光
    const k = prog(t, 167.3, 170.5, easeOutCubic), col = mixColor(PAL.heart, '#ffb3c8', 0.4 * beat);
    ctx.lineCap = 'round';
    for (let i = 0; i < S6J_ROOTS.length; i++) {
      const s = S6J_ROOTS[i];
      if (k <= s.t0) continue;
      const f = clamp01((k - s.t0) / (s.t1 - s.t0)), x2 = lerp(s.x1, s.x2, f), y2 = lerp(s.y1, s.y2, f);
      line(ctx, s.x1, s.y1, x2, y2, s.w, col);
      if (f < 1) { softGlow(ctx, x2, y2, 30, PAL.heart, 0.7); circle(ctx, x2, y2, s.w * 0.6 + 2, '#ffd0de'); }
    }
    // “我”站在地面，低头看着扎下去的根，胸口一颗小爱心跳动
    const r = 60, my = S6J_GY - r;
    drawMe(ctx, 960, my, { t: t, r: r, look: 0, lookY: 0.85, groundY: S6J_GY, glow: 0.45 + 0.3 * beat, squash: 1 + 0.04 * beat });
    const c = meChest(960, my, r, 1 + 0.04 * beat, 0);
    drawHeart(ctx, c.x, c.y, 12 * (1 + 0.25 * beat), { fill: PAL.heart });
  });
}

// ---- 171–175 牵手被拉开 ----
function s6PullSep(t) { return lerp(110, 560, easeInOutCubic(prog(t, 171.2, 174.3))); }
// 抖动的手臂：从 (x1,y1) 到 (x2,y2) 的折线，垂直方向正弦颤抖
function s6Arm(ctx, x1, y1, x2, y2, amp, t, seed, col) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ctx.beginPath();
  for (let i = 0; i <= 18; i++) {
    const s = i / 18, o = Math.sin(s * PI) * Math.sin(t * 48 + s * 11 + seed) * amp;
    const x = x1 + dx * s + nx * o, y = y1 + dy * s + ny * o;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 11; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
function s6Pull(ctx, t, noYou) {
  fillSky(ctx, '#151240', '#2a2160');
  const tr = prog(t, 171.6, 174.3), beat = beatPulse(t);
  // 向两侧的风线
  for (let i = 0; i < 28; i++) {
    const side = i % 2 ? 1 : -1, d = fract(hash01(i, 691) + t * (1.2 + hash01(i, 692))) * 1100;
    const x = 960 + side * (120 + d), y = 80 + hash01(i, 693) * 680, len = 100 + 80 * hash01(i, 694);
    line(ctx, x, y, x + side * len, y, 3, rgba(S6_ICE, 0.12 + 0.18 * tr));
  }
  drawGround(ctx, '#0c0b22', '#2f2a6a');
  const s = s6PullSep(t), mx = 960 - s, ux = 960 + s, my = GROUND_Y - 60, uy = GROUND_Y - 78;
  const gx = 960 + Math.sin(t * 9) * 14 * tr, gy = GROUND_Y - 120 + Math.cos(t * 13) * 6 * tr;
  // 两侧拉力箭头（向外滚动的 V 形）
  for (let side = -1; side <= 1; side += 2) {
    const base = side < 0 ? mx - 130 : ux + 150;
    for (let j = 0; j < 3; j++) {
      const x = base + side * (j * 46 + fract(t * 2) * 46);
      ctx.beginPath(); ctx.moveTo(x - side * 18, my - 34); ctx.lineTo(x + side * 14, my); ctx.lineTo(x - side * 18, my + 34);
      ctx.lineWidth = 8; ctx.strokeStyle = rgba(PAL.cream, (0.15 + 0.35 * tr) * (1 - j * 0.25)); ctx.lineCap = 'round'; ctx.stroke();
    }
  }
  // 脚下拖痕与扬尘
  for (let i = 0; i < 6; i++) {
    const ph = fract(t * 3 + i / 6), side = i % 2 ? 1 : -1, bx = side < 0 ? mx : ux;
    ctx.globalAlpha = 0.45 * (1 - ph) * tr;
    circle(ctx, bx - side * (30 + ph * 90), GROUND_Y - 6 - ph * 16, 9 * (1 - ph), '#5a5f9a');
  }
  ctx.globalAlpha = 1;
  drawMe(ctx, mx, my, { t: t, r: 60, rot: -0.28 * tr, squash: 1 - 0.05 * tr, look: 1, lookY: -0.1, groundY: GROUND_Y,
    glow: 0.45, mood: tr > 0.6 ? 'sad' : undefined });
  if (!noYou) drawYou(ctx, ux, uy, { t: t, r: 78, rot: 0.28 * tr, squash: 1 - 0.05 * tr, look: -1, lookY: -0.1, groundY: GROUND_Y });
  // 手臂（越拉越长、越抖越厉害），握手处一颗小爱心
  const amp = 2 + 9 * tr;
  s6Arm(ctx, mx + 52, my - 10, gx - 6, gy, amp, t, 0, PAL.me);
  if (!noYou) s6Arm(ctx, ux - 68, uy - 2, gx + 6, gy, amp, t, 2.1, PAL.you);
  circle(ctx, gx - 4, gy, 10, PAL.me);
  if (!noYou) {
    circle(ctx, gx + 6, gy, 11, PAL.you);
    softGlow(ctx, gx, gy - 30, 70, PAL.heart, 0.5 + 0.3 * beat);
    drawHeart(ctx, gx, gy - 32, 14 + 4 * beat, { fill: PAL.heart });
  }
}

// ---- 175–178 定格 + 气泡 ----
const S6L_FREEZE = 174.6;
function s6Say(ctx, t) {
  withCamera(ctx, 960, 540, 1 + 0.04 * prog(t, 175, 175.5, easeOutCubic), 0, function () { s6Pull(ctx, S6L_FREEZE, true); });
  desatScreen(ctx, 0.5 * prog(t, 175, 175.3));
  veil(ctx, PAL.abyss, 0.55 * prog(t, 175.05, 175.5));
  veil(ctx, '#ffffff', 0.6 * (1 - prog(t, 175, 175.12)));
  // “你”松开手，上前两步
  const ux0 = 960 + s6PullSep(S6L_FREEZE);
  const k1 = prog(t, 175.3, 175.9, easeOutCubic), k2 = prog(t, 175.9, 176.25, easeOutBack);
  const ux = lerp(ux0, ux0 - 90, k1) - 60 * k2, hop = Math.abs(Math.sin(prog(t, 175.3, 176.25) * PI * 2)) * 24;
  const uy = GROUND_Y - 95 - hop, land = t - 176.25;
  drawYou(ctx, ux, uy, { t: t, r: 95, look: -0.7, lookY: -0.1, groundY: GROUND_Y, glow: 0.35,
    squash: land > 0 ? 1 + 0.12 * Math.exp(-8 * land) * Math.cos(land * 16) : 1 });
  // 气泡：从“你”头顶弹出，177.45 秒后放大铺满画面（奶油色，S7 开头从同色气泡内部开始）
  const g = prog(t, 176.35, 177.1);
  if (g <= 0) return;
  const gs = easeOutBack(g, 1.5), es = 1 + 3.2 * prog(t, 177.45, 178.0, easeInCubic);
  const tipX = ux - 85, tipY = GROUND_Y - 170, bcx = 790, bcy = 340;
  ctx.save();
  ctx.translate(bcx, bcy); ctx.scale(es, es); ctx.translate(-bcx, -bcy);
  ctx.translate(tipX, tipY); ctx.scale(gs, gs); ctx.translate(-tipX, -tipY);
  drawBubble(ctx, 230, 120, 1120, 440, tipX, tipY, { fill: PAL.cream, r: 120 });
  drawDots(ctx, bcx, bcy, t, { color: PAL.indigo, r: 16, gap: 52, alpha: 1 - prog(t, 177.45, 177.8) });
  ctx.restore();
}

function drawS6(ctx, t) {
  ctx.save();
  if (t < 137) s6Guess(ctx, t);
  else if (t < 141) s6Dots(ctx, t);
  else if (t < 143) s6Check(ctx, t);
  else if (t < 147) s6Shatter(ctx, t);
  else if (t < 151) s6Spiral(ctx, t);
  else if (t < 154) s6Tiny(ctx, t);
  else if (t < 158) s6Gear(ctx, t);
  else if (t < 162) s6Tape(ctx, t);
  else if (t < 167) s6Echo(ctx, t);
  else if (t < 171) s6Roots(ctx, t);
  else if (t < 175) s6Pull(ctx, t, false);
  else s6Say(ctx, t);
  ctx.restore();
  // 更快的切换：斜向色块（143/147/151/158 为硬切 + glitch/白闪，175 为定格）
  s4Trans(ctx, t, 141, S6_COLD);
  s4Trans(ctx, t, 154, PAL.you);
  s4Trans(ctx, t, 162, '#5a4fc0');
  s4Trans(ctx, t, 167, PAL.heart);
  s4Trans(ctx, t, 171, S6_ICE);
  s4Vignette(ctx, t, 0.5);
  s6EchoGhosts(ctx, t);
}
SCENE_IMPL.S6 = {
  draw: function (ctx, t) { drawS6(ctx, t); },
  // 「That's right」放在上方，避开下方的对勾与盖章
  heroLayout: function () { return { x: 960, y: 230, size: 150 }; }
};
