'use strict';
// =====================================================================
// scenes_d.js — S8 结尾 Hook（3:35–4:06）：段落表、文字工具、分屏背景、前五种版式。
// 每遍换一种版式：左右分屏 / 上下分屏 / 重复堆叠 / 围绕“我”成环旋转 / 横向跑马灯（后五遍是这些版式的变体）；
// 每次 friend 都在拍点上砸下（冲击抖动 + 闪白），并且逐次加重删除线：细线 → 粗线 → 双线 → 大叉。
// 歌词由 S8 自己绘制（ownsLyrics），时间全部用 lt = (t - LYRIC_OFFSET) - L.start。
// 后续：scenes_d1.js（后五种版式、椭圆轨道、分派、登记 SCENE_IMPL.S8）。
// =====================================================================

// 段落：t0/t1 与 LYRICS 一致；lay = 版式；fr = 本句 friend 的删除线等级（0 = 本句没有 friend）
const S8_SEGS = [
  { t0: 215, t1: 218, lay: 'splitLR', fr: 0 },
  { t0: 218, t1: 222, lay: 'splitTB', fr: 0 },
  { t0: 222, t1: 225, lay: 'stack', fr: 1 },
  { t0: 225, t1: 227, lay: 'ring', fr: 0 },
  { t0: 227, t1: 230, lay: 'marquee', fr: 2 },
  { t0: 230, t1: 232, lay: 'splitTB2', fr: 0 },
  { t0: 232, t1: 235, lay: 'splitLR2', fr: 3 },
  { t0: 235, t1: 237, lay: 'tower', fr: 0 },
  { t0: 237, t1: 240, lay: 'ring2', fr: 4 },
  { t0: 240, t1: 246, lay: 'final', fr: 0 }
];
function s8SegIdx(t) {
  for (let i = 0; i < S8_SEGS.length; i++) if (t < S8_SEGS[i].t1) return i;
  return S8_SEGS.length - 1;
}
// friend 落拍时刻（相对句首，秒）：句首 1.2 秒之后的下一拍
function s8SlamLt(start) {
  // 拍点按原曲时间计算（beatPos / beatTime 已处理 SYNC 拉伸），返回分镜秒
  return beatTime(Math.ceil(beatPos(start + 1.2) - 1e-6)) - start;
}
const S8_WC = { friend: PAL.you, '不能': PAL.me, '朋友': PAL.you };
function s8Words(str) {
  const p = str.split(' '), out = [];
  for (let i = 0; i < p.length; i++) out.push({ s: p[i], c: S8_WC[p[i]] });
  return out;
}
const S8_YOUR = s8Words("I don't wanna be your");

// 一行单词。words = [{ s, c?, at?, slam? }]；o = { x, y, size, maxW?, gap?, t0?, step?, align?, alpha?, color? }
// 普通词弹出（easeOutBack），slam 词从 3 倍大砸下并带长投影 + 描边。返回每个词的盒子 { x(中心), y, w, size, k }
function s8Row(ctx, t, lt, words, o) {
  let size = o.size, font = fontStr(size, 900, FONT_MIX);
  const gk = o.gap === undefined ? 0.3 : o.gap, ws = [];
  let tot = 0;
  for (let i = 0; i < words.length; i++) { ws.push(measureW(ctx, words[i].s, font)); tot += ws[i]; }
  tot += size * gk * (words.length - 1);
  if (o.maxW && tot > o.maxW) {
    const f = o.maxW / tot;
    size *= f; tot *= f; font = fontStr(size, 900, FONT_MIX);
    for (let i = 0; i < ws.length; i++) ws[i] *= f;
  }
  const gap = size * gk, al = o.align || 'center', a0 = o.alpha === undefined ? 1 : o.alpha, beat = beatPulse(t);
  let x = al === 'left' ? o.x : (al === 'right' ? o.x - tot : o.x - tot / 2);
  const boxes = [];
  for (let i = 0; i < words.length; i++) {
    const wd = words[i], w = ws[i], cx = x + w / 2; x += w + gap;
    const at = wd.at !== undefined ? wd.at : (o.t0 || 0) + i * (o.step === undefined ? 0.16 : o.step);
    const k = clamp01((lt - at) / (wd.slam ? 0.16 : 0.28));
    boxes.push({ x: cx, y: o.y, w: w, size: size, k: k });
    if (k <= 0) continue;
    let sc = wd.slam ? lerp(3, 1, easeOutCubic(k)) : easeOutBack(k, 2.2);
    if (wd.c) sc *= 1 + 0.05 * beat;
    const col = wd.c || o.color || PAL.cream, al2 = clamp01(k * 2.5) * a0;
    if (wd.slam) s4LongGlyph(ctx, wd.s, cx, o.y, sc, (1 - k) * -0.2, al2, col, font, size, true);
    else drawGlyph(ctx, wd.s, cx, o.y, sc, 0, al2, col, font, size, false);
  }
  return boxes;
}
// 删除线笔画（带投影），kk 为绘制进度
function s8StLine(ctx, xa, ya, xb, yb, lw, kk) {
  if (kk <= 0) return;
  const xe = lerp(xa, xb, kk), ye = lerp(ya, yb, kk);
  line(ctx, xa + 5, ya + 7, xe + 5, ye + 7, lw, 'rgba(7,7,15,0.5)');
  line(ctx, xa, ya, xe, ye, lw, S4_RED);
}
// friend 删除线：level 1 细线 → 2 粗线 → 3 双线 → 4 大叉
function s8Strike(ctx, b, lt, ts, level, a) {
  const k = prog(lt, ts, ts + 0.22, easeOutCubic), k2 = prog(lt, ts + 0.12, ts + 0.34, easeOutCubic);
  if (k <= 0 || a <= 0 || level <= 0) return;
  const x1 = b.x - b.w / 2 - b.size * 0.12, x2 = b.x + b.w / 2 + b.size * 0.12, y = b.y, h = b.size;
  ctx.globalAlpha = clamp01(a);
  if (level === 1) s8StLine(ctx, x1, y + h * 0.06, x2, y - h * 0.04, h * 0.07, k);
  else if (level === 2) s8StLine(ctx, x1, y + h * 0.1, x2, y - h * 0.08, h * 0.13, k);
  else if (level === 3) { s8StLine(ctx, x1, y - h * 0.12, x2, y - h * 0.2, h * 0.1, k); s8StLine(ctx, x1, y + h * 0.16, x2, y + h * 0.08, h * 0.1, k2); }
  else { s8StLine(ctx, x1, y - h * 0.42, x2, y + h * 0.42, h * 0.13, k); s8StLine(ctx, x1, y + h * 0.42, x2, y - h * 0.42, h * 0.13, k2); }
  ctx.globalAlpha = 1;
}

// ---- 分屏背景（场景层）：两块色板从两侧滑入，中间一条随拍发亮的接缝 ----
const S8_PANEL = {
  splitLR: ['#5a2038', '#163f52', 1], splitLR2: ['#163f52', '#5a2038', -1],
  splitTB: ['#3a1f5a', '#1d3a5a', 0], splitTB2: ['#1d3a5a', '#3a1f5a', 0]
};
function s8Panels(ctx, t, seg) {
  const P = S8_PANEL[seg.lay];
  if (!P) return;
  const k = prog(t, seg.t0, seg.t0 + 0.3, easeOutCubic), beat = beatPulse(t);
  ctx.save(); ctx.globalAlpha = 0.85;
  if (P[2] === 0) {
    const off = (1 - k) * 640;
    ctx.beginPath(); ctx.moveTo(-20, -20 - off); ctx.lineTo(W + 20, -20 - off); ctx.lineTo(W + 20, 520 - off); ctx.lineTo(-20, 560 - off); ctx.closePath();
    ctx.fillStyle = P[0]; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-20, 560 + off); ctx.lineTo(W + 20, 520 + off); ctx.lineTo(W + 20, H + 20 + off); ctx.lineTo(-20, H + 20 + off); ctx.closePath();
    ctx.fillStyle = P[1]; ctx.fill();
    ctx.restore();
    if (k > 0.6) line(ctx, -20, 560, W + 20, 520, 5 + 7 * beat, rgba(PAL.cream, 0.5 + 0.4 * beat));
  } else {
    const off = (1 - k) * 1150, xa = 960 + 50 * P[2], xb = 960 - 50 * P[2];
    ctx.beginPath(); ctx.moveTo(-20 - off, -20); ctx.lineTo(xa - off, -20); ctx.lineTo(xb - off, H + 20); ctx.lineTo(-20 - off, H + 20); ctx.closePath();
    ctx.fillStyle = P[0]; ctx.fill();
    ctx.beginPath(); ctx.moveTo(xa + off, -20); ctx.lineTo(W + 20 + off, -20); ctx.lineTo(W + 20 + off, H + 20); ctx.lineTo(xb + off, H + 20); ctx.closePath();
    ctx.fillStyle = P[1]; ctx.fill();
    ctx.restore();
    if (k > 0.6) line(ctx, xa, -20, xb, H + 20, 5 + 7 * beat, rgba(PAL.cream, 0.5 + 0.4 * beat));
  }
}

// ---- 环形文字：围绕 (cx, cy) 半径 R 排一圈并旋转；o.fi = friend 起始字符下标（-1 表示无） ----
function s8RingText(ctx, t, lt, a, str, o) {
  const chars = Array.from(str), f0 = fontStr(64, 900, FONT_EN);
  let w0 = 0;
  for (let i = 0; i < chars.length; i++) w0 += measureW(ctx, chars[i], f0);
  const size = clamp(64 * TAU * o.R * 0.96 / w0, 40, o.maxSize || 92), kf = size / 64, font = fontStr(size, 900, FONT_EN);
  const base = -PI / 2 + o.spin * lt - w0 * kf / o.R / 2, beat = beatPulse(t);
  let acc = 0, a1 = 0, a2 = 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], w = measureW(ctx, ch, f0) * kf, ang = base + (acc + w / 2) / o.R;
    if (i === o.fi) a1 = base + acc / o.R;
    acc += w;
    if (o.fi >= 0 && i === o.fi + 5) a2 = base + acc / o.R;
    if (ch === ' ') continue;
    const isF = o.fi >= 0 && i >= o.fi && i < o.fi + 6;
    let k, sc;
    if (isF) { k = clamp01((lt - o.sl) / 0.16); sc = lerp(2.6, 1, easeOutCubic(k)); }
    else { k = clamp01((lt - 0.05 - i * 0.02) / 0.25); sc = easeOutBack(k, 2.2); }
    if (k <= 0) continue;
    const col = isF ? PAL.you : (ch === '•' ? PAL.me : PAL.cream);
    drawGlyph(ctx, ch, o.cx + Math.cos(ang) * o.R, o.cy + Math.sin(ang) * o.R, sc * (1 + 0.04 * beat), ang + PI / 2,
      clamp01(k * 2.5) * a, col, font, size, isF);
  }
  return { a1: a1, a2: a2, size: size };
}

// ---- 跑马灯：一条深色横带里，单词序列循环横向滚动（裁剪在安全区内） ----
// o = { y, size, dir, speed, phase, delay, sl, level }
function s8Marquee(ctx, t, lt, a, words, o) {
  const size = o.size, font = fontStr(size, 900, FONT_MIX), gap = size * 0.3, sepW = size * 1.2;
  const ws = [];
  let unit = sepW;
  for (let i = 0; i < words.length; i++) { ws.push(measureW(ctx, words[i].s, font)); unit += ws[i] + gap; }
  const e = prog(lt, o.delay, o.delay + 0.35, easeOutCubic), aa = a * e;
  if (aa <= 0) return;
  const slide = (1 - e) * o.dir * -1300;
  ctx.globalAlpha = 0.5 * aa; ctx.fillStyle = PAL.abyss; ctx.fillRect(0, o.y - size * 0.75, W, size * 1.5); ctx.globalAlpha = 1;
  ctx.save();
  ctx.beginPath(); ctx.rect(SAFE.x, o.y - size, SAFE.w, size * 2); ctx.clip();
  const off = ((o.phase + o.dir * lt * o.speed + slide) % unit + unit) % unit - unit;
  const beat = beatPulse(t);
  for (let x0 = off; x0 < W; x0 += unit) {
    let x = x0;
    for (let i = 0; i < words.length; i++) {
      const wd = words[i], cx = x + ws[i] / 2;
      x += ws[i] + gap;
      if (cx < -ws[i] || cx > W + ws[i]) continue;
      if (wd.s === 'friend') {
        const k = clamp01((lt - o.sl) / 0.16);
        if (k <= 0) continue;
        s4LongGlyph(ctx, wd.s, cx, o.y, lerp(2.2, 1, easeOutCubic(k)), 0, clamp01(k * 2.5) * aa, PAL.you, font, size, true);
        s8Strike(ctx, { x: cx, y: o.y, w: ws[i], size: size }, lt, o.sl + 0.3, o.level, aa);
      } else {
        drawGlyph(ctx, wd.s, cx, o.y, 1 + (wd.c ? 0.05 * beat : 0), 0, aa, wd.c || PAL.cream, font, size, false);
      }
    }
    drawGlyph(ctx, '•', x - gap + sepW / 2, o.y, 1, 0, aa, PAL.me, font, size, false);
  }
  ctx.restore();
}

// =====================================================================
// 版式（歌词层）。签名：fn(ctx, t, lt, a, sl, fr)  a = 退场透明度，sl = friend 落拍时刻，fr = 删除线等级
// =====================================================================
// 1) 左右分屏：左屏 “I don't wanna”，右屏 “be your”
function s8LayLR(ctx, t, lt, a) {
  s8Row(ctx, t, lt, S8_YOUR.slice(0, 3), { x: 480, y: 400, size: 110, maxW: 720, t0: 0.05, step: 0.22, alpha: a });
  s8Row(ctx, t, lt, S8_YOUR.slice(3), { x: 1440, y: 400, size: 130, maxW: 720, t0: 0.75, step: 0.33, alpha: a });
}
// 2) 上下分屏：上屏 “我不能不能做”，下屏 “你的朋友”
function s8LayTB(ctx, t, lt, a) {
  s8Row(ctx, t, lt, [{ s: '我' }, { s: '不能', c: PAL.me }, { s: '不能', c: PAL.me }, { s: '做' }],
    { x: 960, y: 265, size: 150, maxW: 1500, gap: 0.04, t0: 0.05, step: 0.3, alpha: a });
  s8Row(ctx, t, lt, [{ s: '你的' }, { s: '朋友', c: PAL.you }], { x: 960, y: 830, size: 150, maxW: 1500, gap: 0.04, t0: 1.5, step: 0.45, alpha: a });
}
// 3) 重复堆叠：四层渐隐的 “I don't wanna be your” 逐层落下，最下面一行是完整句，friend 砸下并划细删除线
function s8LayStack(ctx, t, lt, a, sl, fr) {
  const ghost = [];
  for (let i = 0; i < S8_YOUR.length; i++) ghost.push({ s: S8_YOUR[i].s, c: '#9a8cff' });
  for (let r = 0; r < 4; r++) {
    s8Row(ctx, t, lt, ghost, { x: 960, y: 140 + r * 95, size: 72, maxW: 1500, t0: r * 0.2, step: 0.03, alpha: a * (0.2 + 0.1 * r) });
  }
  const words = S8_YOUR.slice();
  words.push({ s: 'friend', c: PAL.you, slam: true, at: sl });
  const b = s8Row(ctx, t, lt, words, { x: 960, y: 525, size: 84, maxW: 1500, t0: 0.85, step: 0.08, alpha: a });
  s8Strike(ctx, b[5], lt, sl + 0.3, fr, a);
}
// 4) 环形：一圈 “I don't wanna be your •” 围绕中央的“我”旋转
function s8LayRing(ctx, t, lt, a) {
  s8RingText(ctx, t, lt, a, "I don't wanna be your • I don't wanna be your • ", { cx: 960, cy: 520, R: 280, spin: 1.3, fi: -1, sl: 0 });
}
// 5) 横向跑马灯：三条横带交替反向滚动，所有 friend 同时在拍点砸下，划粗删除线
function s8LayMarquee(ctx, t, lt, a, sl, fr) {
  const words = s8Words("I don't wanna be your friend");
  for (let r = 0; r < 3; r++) {
    s8Marquee(ctx, t, lt, a, words, { y: 190 + r * 165, size: 78, dir: r % 2 ? -1 : 1, speed: 240 + r * 40,
      phase: r * 370, delay: r * 0.2, sl: sl, level: fr });
  }
}
