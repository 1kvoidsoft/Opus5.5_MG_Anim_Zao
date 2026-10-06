'use strict';
// =====================================================================
// lyrics.js — 歌词渲染：
//   1) 下三分之一歌词区：逐字错峰入场（pop 弹出 / rise 上滑 / type 打字机，
//      按场景变化）→ 停留 → 退场；括号英文作为下方小一号副行。
//   2) hero 句：画面中央大号 kinetic typography（下方不重复显示）。
//   3) 关键词高亮：颜色 + 放大 + 随节拍抖动。
// 同一时刻只取一条歌词（findLyric），且每句退场在 end 前完成，因此不会重叠。
// =====================================================================

// 关键词 → 高亮色（长词在前，先匹配的优先）
const LYRIC_KEYWORDS = [
  ['不是情人', PAL.heart], ['收不回来', PAL.meGlow], ['等待', PAL.meGlow], ['依赖', PAL.heart],
  ['失败', PAL.grey], ['深渊', '#8a8fff'], ['无奈', PAL.grey], ['改变', PAL.you],
  ['放手', PAL.heart], ['坦白', PAL.meGlow], ['friend', PAL.you], ['朋友', PAL.you],
  ['不能', PAL.me], ['耶', PAL.me], ['爱', PAL.heart]
];

// 各场景下方歌词的入场方式
const LYRIC_ANIM = { S1: 'rise', S2: 'type', S3: 'pop', S4: 'pop', S6: 'type', S7: 'pop', S8: 'rise' };

// 中央大字的动效风格（按歌词原文索引）
const HERO_STYLE = {
  '等待': 'breath',
  '这是爱': 'pulse',
  '从天堂掉落到深渊': 'fall',
  'I only want to be your friend': 'stamp',
  '不是情人': 'stamp',
  'So I': 'pulse',
  '我不能只是be 你的朋友': 'shake',
  '我不能只是做你的朋友': 'drop',
  "That's right": 'stamp',
  '我不能只是做 你的 friend': 'shake'
};

// 节拍强度：副歌与结尾更强
const BEAT_GAIN = { S4: 1, S7: 1.2, S8: 1.2 };
function beatGainAt(t) { const g = BEAT_GAIN[findScene(t).id]; return g === undefined ? 0.5 : g; }

// 歌词区布局常量（逻辑像素）
const LYR_Y = 905, LYR_SUB_Y = 980, LYR_SIZE = 66, LYR_SUB_SIZE = 36, LYR_MAXW = W * 0.86;
const HERO_X = W / 2, HERO_Y = 430, HERO_SIZE = 150, HERO_MAXW = W * 0.84;

function isCJK(ch) { const c = ch.charCodeAt(0); return c >= 0x2e80; }
function isLatin(ch) { return /[A-Za-z']/.test(ch); }

// ---- 每句的预处理缓存（字符、高亮、分词），只计算一次 ----
const _prepCache = new Map();
function computeHighlights(text, n) {
  const hl = new Array(n).fill(null);
  for (let k = 0; k < LYRIC_KEYWORDS.length; k++) {
    const kw = LYRIC_KEYWORDS[k][0], col = LYRIC_KEYWORDS[k][1];
    let from = 0;
    for (;;) {
      const i = text.indexOf(kw, from);
      if (i < 0) break;
      let free = true;
      for (let j = 0; j < kw.length; j++) if (hl[i + j]) free = false;
      if (free) for (let j = 0; j < kw.length; j++) hl[i + j] = col;
      from = i + kw.length;
    }
  }
  return hl;
}
// 分词单元：连续英文字母为一个单元（含其后空格），每个中文字符为一个单元
function computeUnits(chars) {
  const u = new Array(chars.length);
  let cur = -1, prevLatin = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === ' ') { u[i] = Math.max(cur, 0); prevLatin = false; continue; }
    const lat = isLatin(ch);
    if (!(lat && prevLatin)) cur++;
    u[i] = cur; prevLatin = lat;
  }
  return { map: u, count: cur + 1 };
}
function prepText(text) {
  let P = _prepCache.get(text);
  if (P) return P;
  // 文字均为 BMP 字符，Array.from 下标与字符串下标一致
  const chars = Array.from(text);
  P = { chars: chars, hl: computeHighlights(text, chars.length), units: computeUnits(chars), layouts: new Map() };
  _prepCache.set(text, P);
  return P;
}
// 按字号计算每个字符的宽度（缓存）；超宽时自动缩小字号
function layoutChars(ctx, P, size, maxW, weight, family) {
  const key = size + '|' + maxW + '|' + weight;
  let Lo = P.layouts.get(key);
  if (Lo) return Lo;
  let s = size;
  for (let pass = 0; pass < 2; pass++) {
    const f = fontStr(s, weight, family), ws = new Array(P.chars.length);
    let total = 0;
    for (let i = 0; i < P.chars.length; i++) {
      const ch = P.chars[i];
      ws[i] = measureW(ctx, ch, f) * (P.hl[i] ? 1.1 : 1) + (isCJK(ch) ? s * 0.06 : 0);
      // 汉字后紧跟 j（如“是just”）：j 的弯钩向左出头会压到前一个汉字 → 给前一个汉字加宽
      if (i > 0 && ch === 'j' && isCJK(P.chars[i - 1])) { ws[i - 1] += s * 0.2; total += s * 0.2; }
      total += ws[i];
    }
    Lo = { size: s, ws: ws, total: total, font: f };
    if (total <= maxW) break;
    s = s * maxW / total;
  }
  P.layouts.set(key, Lo);
  return Lo;
}

// 画单个字符（带偏移投影；高亮可选描边）
function drawGlyph(ctx, ch, x, y, sc, rot, alpha, color, font, size, outline) {
  if (alpha <= 0.002 || sc <= 0.001) return;
  ctx.save();
  ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.globalAlpha = clamp01(alpha);
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(7,7,15,0.45)';
  ctx.fillText(ch, size * 0.05, size * 0.07);
  if (outline) {
    ctx.lineWidth = Math.max(2, size * 0.06); ctx.strokeStyle = PAL.cream; ctx.lineJoin = 'round';
    ctx.strokeText(ch, 0, 0);
  }
  ctx.fillStyle = color;
  ctx.fillText(ch, 0, 0);
  ctx.restore();
}

// ---- 下方歌词区：一行逐字动画 ----
function drawCharsRow(ctx, t, tl, P, Lo, y, t0, t1, style, gain) {
  const n = P.chars.length;
  const stagger = style === 'type' ? Math.min(0.09, 1.3 / n) : Math.min(0.055, 0.6 / n);
  const dur = 0.45;
  const exitDur = Math.min(0.4, (t1 - t0) * 0.15), exitStart = t1 - exitDur;
  const beat = beatPulse(t) * gain;
  let x = W / 2 - Lo.total / 2, lastX = -1;
  for (let i = 0; i < n; i++) {
    const w = Lo.ws[i], cx = x + w / 2; x += w;
    const ch = P.chars[i];
    if (ch === ' ') continue;
    const k = clamp01((tl - t0 - i * stagger) / dur);
    if (k <= 0) continue;
    lastX = cx + w / 2;
    let a = 1, sc = 1, dy = 0, dx = 0;
    if (style === 'pop') { sc = easeOutBack(k, 2.2); a = clamp01(k * 4); }
    else if (style === 'type') { a = clamp01(k * 6); sc = 1 + 0.35 * (1 - easeOutCubic(clamp01(k * 2.5))); }
    else { dy = (1 - easeOutCubic(k)) * 46; a = easeOutQuad(k); }
    const e = clamp01((tl - exitStart - i * (exitDur * 0.4 / n)) / (exitDur * 0.6));
    a *= 1 - e; dy -= e * 24;
    const hc = P.hl[i];
    if (hc) {
      sc *= 1.1 + 0.07 * beat;
      dx = Math.sin(t * 31 + i * 1.7) * 2.2 * (0.3 + beat);
      dy += Math.cos(t * 27 + i * 2.3) * 1.8 * (0.3 + beat);
    }
    drawGlyph(ctx, ch, cx + dx, y + dy, sc, 0, a, hc || PAL.cream, Lo.font, Lo.size, false);
  }
  // 打字机光标
  if (style === 'type' && lastX > 0 && tl - t0 < n * stagger + 0.6 && fract(tl * 2.5) < 0.6) {
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(lastX + 6, y - Lo.size * 0.42, Math.max(3, Lo.size * 0.06), Lo.size * 0.84);
  }
}

function drawBottomLyric(ctx, t, tl, L, sc) {
  const style = LYRIC_ANIM[sc.id] || 'rise', gain = beatGainAt(t);
  const P = prepText(L.text);
  const Lo = layoutChars(ctx, P, LYR_SIZE, LYR_MAXW, 800, FONT_MIX);
  // 底部柔和压暗带，保证可读性
  const exitDur = Math.min(0.4, (L.end - L.start) * 0.15);
  const band = env(tl, L.start, L.end, 0.3, exitDur);
  if (band > 0) {
    const g = ctx.createLinearGradient(0, 780, 0, H);
    g.addColorStop(0, 'rgba(7,7,15,0)');
    g.addColorStop(1, rgba(PAL.abyss, 0.5 * band));
    ctx.fillStyle = g; ctx.fillRect(0, 780, W, H - 780);
  }
  drawCharsRow(ctx, t, tl, P, Lo, LYR_Y, L.start, L.end, style, gain);
  if (L.sub) {
    const PS = prepText(L.sub);
    const LoS = layoutChars(ctx, PS, LYR_SUB_SIZE, LYR_MAXW, 600, FONT_EN);
    drawCharsRow(ctx, t, tl, PS, LoS, LYR_SUB_Y, L.start + 0.35, L.end, 'rise', gain * 0.5);
  }
}

// ---- 中央大字 kinetic typography ----
// lay = { x, y, size, maxW } 可由场景 heroLayout 覆盖
function drawHeroLine(ctx, t, tl, L, lay) {
  const style = HERO_STYLE[L.text] || 'drop';
  const P = prepText(L.text);
  const size = Math.round((lay && lay.size) || HERO_SIZE);
  const maxW = (lay && lay.maxW) || HERO_MAXW;
  const cxL = (lay && lay.x !== undefined) ? lay.x : HERO_X;
  const cyL = (lay && lay.y !== undefined) ? lay.y : HERO_Y;
  const Lo = layoutChars(ctx, P, size, maxW, 900, FONT_MIX);
  const n = P.chars.length, s = Lo.size, gain = beatGainAt(t), beat = beatPulse(t) * gain;
  const lt = tl - L.start, dur = L.end - L.start;
  const exitDur = Math.min(0.35, dur * 0.18), e = clamp01((tl - (L.end - exitDur)) / exitDur);
  // 呼吸字距（breath），保证不超出 maxW
  let track = 0;
  if (style === 'breath') {
    const room = Math.max(0, (maxW - Lo.total) / Math.max(1, n - 1));
    track = Math.min(room, s * (0.15 + 0.35 * (0.5 + 0.5 * Math.sin(lt * 2.2))));
  }
  const totalW = Lo.total + track * (n - 1);
  // 盖章冲击：每个单元落下时整行抖动
  const U = P.units, ustag = Math.min(0.32, dur * 0.45 / Math.max(1, U.count));
  let shake = 0;
  if (style === 'stamp') {
    for (let u = 0; u < U.count; u++) {
      const since = lt - (u * ustag + 0.22);
      if (since > 0) shake += Math.exp(-since * 14) * s * 0.06;
    }
  }
  const shx = Math.sin(t * 73) * shake, shy = Math.cos(t * 61) * shake;
  const cstag = Math.min(0.08, dur * 0.35 / n);
  let x = cxL - totalW / 2;
  for (let i = 0; i < n; i++) {
    const w = Lo.ws[i], cx = x + w / 2; x += w + track;
    const ch = P.chars[i];
    if (ch === ' ') continue;
    const hc = P.hl[i];
    let a = 1, sc = 1, dx = 0, dy = 0, rot = 0;
    if (style === 'stamp') {
      const k = clamp01((lt - U.map[i] * ustag) / 0.22);
      if (k <= 0) continue;
      sc = lerp(2.4, 1, easeOutCubic(k)); a = clamp01(k * 2);
    } else {
      const k = clamp01((lt - i * cstag) / 0.55);
      if (k <= 0) continue;
      if (style === 'drop') { dy = -(1 - easeOutBounce(k)) * 320; a = clamp01(k * 3); rot = (1 - k) * (hash01(i, 5) - 0.5) * 0.8; }
      else if (style === 'pulse') { sc = easeOutBack(k, 2.4) * (1 + 0.1 * beat); a = clamp01(k * 3); }
      else if (style === 'shake') {
        sc = easeOutElastic(k); a = clamp01(k * 3);
        dx = Math.sin(t * 40 + i * 2.1) * s * 0.025 * (0.4 + beat);
        dy = Math.cos(t * 47 + i * 1.3) * s * 0.025 * (0.4 + beat);
      } else if (style === 'fall') {
        dy = -(1 - easeOutCubic(k)) * 200 + lt * 14; a = clamp01(k * 2);
      } else { dy = (1 - easeOutCubic(k)) * 60; a = easeOutQuad(k); } // breath
    }
    if (hc) { sc *= 1.08 + 0.06 * beat; }
    sc *= 1 + 0.15 * e; a *= 1 - e;
    // 下坠速度线
    if (style === 'fall' && a > 0.05) {
      for (let j = 0; j < 3; j++) {
        const ph = fract(lt * 1.8 + hash01(i * 3 + j, 9));
        const lx = cx + (hash01(i * 3 + j, 4) - 0.5) * w;
        const ly = cyL + dy - s * 0.6 - ph * s * 1.4;
        ctx.globalAlpha = 0.5 * a * (1 - ph);
        line(ctx, lx, ly, lx, ly - s * 0.5, 3, PAL.cream);
      }
      ctx.globalAlpha = 1;
    }
    drawGlyph(ctx, ch, cx + dx + shx, cyL + dy + shy, sc, rot, a, hc || PAL.cream, Lo.font, s, !!hc && style === 'stamp');
  }
}

// ---- 入口：由 player.js 在场景之后调用 ----
function drawLyrics(ctx, t, sc) {
  const impl = SCENE_IMPL[sc.id];
  if (impl && impl.ownsLyrics) return;
  const L = findLyric(t);
  if (!L) return;
  const tl = t - LYRIC_OFFSET;
  ctx.save();
  if (L.hero) {
    if (!(impl && impl.ownsHero)) drawHeroLine(ctx, t, tl, L, impl && impl.heroLayout ? impl.heroLayout(t, L) : null);
  } else {
    drawBottomLyric(ctx, t, tl, L, sc);
  }
  ctx.restore();
}
