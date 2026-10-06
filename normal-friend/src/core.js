'use strict';
// =====================================================================
// core.js — 通用工具：常量/调色板、缓动、插值、区间进度、种子随机、
//           颜色、基础绘图、文字测量缓存、节拍脉冲、背景散景粒子、转场。
// 所有函数都是纯函数（只依赖参数和 t），不在帧间累积状态。
// =====================================================================

// ---- 逻辑画布与安全区（四周 5% 边距） ----
const W = 1920, H = 1080;
const SAFE = { x: W * 0.05, y: H * 0.05, w: W * 0.9, h: H * 0.9, r: W * 0.95, b: H * 0.95 };
const PI = Math.PI, TAU = Math.PI * 2;

// ---- 字体 ----
const FONT_CN = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
const FONT_EN = '"Segoe UI", "Helvetica Neue", Arial';
// 英文字形用 Segoe UI，中文字形自动回退到雅黑等中文字体
const FONT_MIX = FONT_EN + ', ' + FONT_CN;

// ---- 调色板 ----
const PAL = {
  night: '#141a33',   // 夜空深蓝
  indigo: '#262b5a',  // 靛蓝
  me: '#ff7a59',      // “我” 珊瑚橙
  meGlow: '#ffb36b',  // “我” 光晕
  you: '#3ec1c9',     // “你” 青绿
  heart: '#ff5c8a',   // 爱心粉
  cream: '#fff4e0',   // 文字奶油白
  abyss: '#07070f',   // 深渊
  heaven: '#ffe9c7',  // 天堂暖白
  skyBlue: '#bfe3ff', // 天蓝
  dusk: '#b8577a',    // 玫瑰色黄昏
  grey: '#9aa3c7',    // 降饱和灰蓝
  violet: '#3a2f6b'   // 主歌二紫蓝夜色
};

// ---- 基础数学 ----
function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
function lerp(a, b, k) { return a + (b - a) * k; }
function invLerp(a, b, x) { return b === a ? 0 : (x - a) / (b - a); }
function remap(x, a, b, c, d) { return lerp(c, d, clamp01(invLerp(a, b, x))); }
function smoothstep(a, b, x) { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); }
function fract(x) { return x - Math.floor(x); }
function pingpong(x) { const f = fract(x * 0.5) * 2; return f > 1 ? 2 - f : f; }

// ---- 缓动函数（输入输出 0..1） ----
function easeLinear(x) { return x; }
function easeInQuad(x) { return x * x; }
function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }
function easeInOutQuad(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function easeInCubic(x) { return x * x * x; }
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function easeInOutSine(x) { return -(Math.cos(PI * x) - 1) / 2; }
function easeOutSine(x) { return Math.sin(x * PI / 2); }
function easeInExpo(x) { return x === 0 ? 0 : Math.pow(2, 10 * x - 10); }
function easeOutExpo(x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }
function easeOutBack(x, s) {
  const c1 = s === undefined ? 1.70158 : s, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function easeInBack(x, s) {
  const c1 = s === undefined ? 1.70158 : s, c3 = c1 + 1;
  return c3 * x * x * x - c1 * x * x;
}
function easeOutElastic(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1;
}
function easeOutBounce(x) {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) { x -= 1.5 / d1; return n1 * x * x + 0.75; }
  if (x < 2.5 / d1) { x -= 2.25 / d1; return n1 * x * x + 0.9375; }
  x -= 2.625 / d1; return n1 * x * x + 0.984375;
}
const Ease = {
  linear: easeLinear, inQuad: easeInQuad, outQuad: easeOutQuad, inOutQuad: easeInOutQuad,
  inCubic: easeInCubic, outCubic: easeOutCubic, inOutCubic: easeInOutCubic,
  inOutSine: easeInOutSine, outSine: easeOutSine, inExpo: easeInExpo, outExpo: easeOutExpo,
  outBack: easeOutBack, inBack: easeInBack, outElastic: easeOutElastic, outBounce: easeOutBounce
};

// 区间进度：t 在 [a,b] 内映射到 0..1（可选缓动）
function prog(t, a, b, ease) {
  const k = clamp01((t - a) / (b - a));
  return ease ? ease(k) : k;
}
// 包络：在 [a,b] 内显示，入场 fi 秒淡入，出场 fo 秒淡出，返回 0..1
function env(t, a, b, fi, fo) {
  if (t < a || t > b) return 0;
  const i = fi > 0 ? clamp01((t - a) / fi) : 1;
  const o = fo > 0 ? clamp01((b - t) / fo) : 1;
  return Math.min(i, o);
}

// ---- 种子随机 ----
// mulberry32：有状态 PRNG，只在加载时用于生成固定随机表
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
// 无状态哈希随机：同样的 (n, seed) 永远得到同样的 0..1 值，可在每帧调用
function hash01(n, seed) {
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(((seed | 0) + 0x632be5ab) | 0, 0xc2b2ae35);
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function hashRange(n, seed, a, b) { return a + (b - a) * hash01(n, seed); }
// 生成固定随机表（加载时一次性调用）
function makeRandTable(seed, n) {
  const r = mulberry32(seed), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = r();
  return out;
}

// ---- 颜色 ----
const _rgbCache = new Map();
function hexToRgb(hex) {
  let c = _rgbCache.get(hex);
  if (c) return c;
  let h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const v = parseInt(h, 16);
  c = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  _rgbCache.set(hex, c);
  return c;
}
const _rgbaCache = new Map();
function rgba(hex, a) {
  const q = Math.round(clamp01(a) * 255);
  const key = hex + '|' + q;
  let s = _rgbaCache.get(key);
  if (s) return s;
  const c = hexToRgb(hex);
  s = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (q / 255).toFixed(3) + ')';
  if (_rgbaCache.size > 4000) _rgbaCache.clear();
  _rgbaCache.set(key, s);
  return s;
}
function mixColor(h1, h2, k) {
  const a = hexToRgb(h1), b = hexToRgb(h2), m = clamp01(k);
  const r = Math.round(lerp(a[0], b[0], m)), g = Math.round(lerp(a[1], b[1], m)), bl = Math.round(lerp(a[2], b[2], m));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}
// 降饱和：k=1 时完全灰度
function desat(hex, k) {
  const c = hexToRgb(hex), l = Math.round(c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11);
  const g = '#' + ((1 << 24) | (l << 16) | (l << 8) | l).toString(16).slice(1);
  return mixColor(hex, g, k);
}

// ---- 基础绘图 ----
function circle(ctx, x, y, r, fill) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); ctx.fillStyle = fill; ctx.fill();
}
function ring(ctx, x, y, r, lw, stroke) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke();
}
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function fillRoundRect(ctx, x, y, w, h, r, fill) { roundRectPath(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
function regularPolyPath(ctx, x, y, r, n, rot) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + i * TAU / n;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}
function starPath(ctx, x, y, ro, ri, n, rot) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + i * PI / n, r = (i & 1) ? ri : ro;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}
function line(ctx, x1, y1, x2, y2, lw, stroke) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineCap = 'round'; ctx.stroke();
}
// 柔光（径向渐变，代替 shadowBlur）
function softGlow(ctx, x, y, r, hex, a) {
  if (a <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, a));
  g.addColorStop(0.45, rgba(hex, a * 0.35));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// 地面柔和投影（扁椭圆）
function groundShadow(ctx, x, y, rx, ry, a) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, 'rgba(0,0,0,' + (0.45 * a).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
  ctx.restore();
}
// 竖向渐变全屏背景
function fillSky(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---- 文字：字体串缓存 + 测量缓存 ----
const _fontCache = new Map();
function fontStr(size, weight, family) {
  const key = size + '|' + (weight || 700) + '|' + (family || FONT_MIX);
  let f = _fontCache.get(key);
  if (!f) { f = (weight || 700) + ' ' + Math.round(size) + 'px ' + (family || FONT_MIX); _fontCache.set(key, f); }
  return f;
}
const _measureCache = new Map();
function measureW(ctx, text, font) {
  const key = font + '\u0001' + text;
  let w = _measureCache.get(key);
  if (w === undefined) {
    ctx.save(); ctx.font = font; w = ctx.measureText(text).width; ctx.restore();
    if (_measureCache.size > 6000) _measureCache.clear();
    _measureCache.set(key, w);
  }
  return w;
}
// 简单文字绘制（居中），带偏移投影以增强可读性（不用 shadowBlur）
function drawText(ctx, text, x, y, size, color, o) {
  const opt = o || {};
  ctx.font = fontStr(size, opt.weight, opt.family);
  ctx.textAlign = opt.align || 'center';
  ctx.textBaseline = opt.baseline || 'middle';
  ctx.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
  if (opt.shadow !== false) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillText(text, x + size * 0.05, y + size * 0.06);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

// ---- 节拍 ----
// BPM / BEAT_OFFSET / songTime / storyTime 定义在 timeline.js（运行时读取）。
// 场景传入的 t 是分镜时间；节拍按原曲真实时间计算，所以先用 songTime 换算，
// 这样分镜被拉伸/压缩时节拍速度仍恒定为 BPM。
function beatSpb() { return 60 / (typeof BPM === 'number' ? BPM : 90); }
function beatOff() { return typeof BEAT_OFFSET === 'number' ? BEAT_OFFSET : 0; }
function beatPos(t) {
  const s = typeof songTime === 'function' ? songTime(t) : t;
  return (s - beatOff()) / beatSpb();
}
// 第 b 拍（可带原曲秒偏移 dt）对应的分镜时间
function beatTime(b, dt) {
  const s = b * beatSpb() + beatOff() + (dt || 0);
  return typeof storyTime === 'function' ? storyTime(s) : s;
}
function beatIndex(t) { return Math.floor(beatPos(t)); }
function beatPhase(t) { return fract(beatPos(t)); }
// 每拍开头为 1，按指数衰减到 0
function beatPulse(t, sharp) { return Math.exp(-beatPhase(t) * (sharp || 6)); }

// ---- 背景散景粒子（无状态：位置由 t 和索引哈希决定） ----
// o: { count, seed, color, alpha, speed, minR, maxR, drift }
function drawBokeh(ctx, t, o) {
  const n = o.count || 30, seed = o.seed || 1, sp = o.speed === undefined ? 1 : o.speed;
  const minR = o.minR || 6, maxR = o.maxR || 40, baseA = o.alpha === undefined ? 0.18 : o.alpha;
  const pulse = o.pulse || 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const r = lerp(minR, maxR, hash01(i, seed + 3));
    const vx = (hash01(i, seed + 5) - 0.5) * 30 * sp;
    const vy = -(8 + hash01(i, seed + 7) * 24) * sp;
    const span = W + maxR * 4, spanY = H + maxR * 4;
    let x = hash01(i, seed) * span + vx * t;
    let y = hash01(i, seed + 1) * spanY + vy * t;
    x = ((x % span) + span) % span - maxR * 2;
    y = ((y % spanY) + spanY) % spanY - maxR * 2;
    const tw = 0.6 + 0.4 * Math.sin(t * (0.6 + hash01(i, seed + 9)) + i);
    const a = baseA * tw * (1 + pulse * 0.6);
    ctx.globalAlpha = clamp01(a);
    circle(ctx, x, y, r * (1 + pulse * 0.15), o.color || PAL.cream);
  }
  ctx.restore();
}

// ---- 转场 / 镜头 ----
// 圆形遮罩：只在圆内执行 fn
function withCircleClip(ctx, x, y, r, fn) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); ctx.clip(); fn(); ctx.restore();
}
// 斜向擦除：k 从 0→1，用色块从左到右斜着盖满画面
function diagWipe(ctx, k, color, slant) {
  if (k <= 0) return;
  const s = slant === undefined ? 300 : slant, x = lerp(-s, W + s, k);
  ctx.beginPath();
  ctx.moveTo(-10, -10); ctx.lineTo(x + s, -10); ctx.lineTo(x - s, H + 10); ctx.lineTo(-10, H + 10);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
// 镜头：以 (cx,cy) 为焦点缩放/旋转/平移
function withCamera(ctx, cx, cy, zoom, rot, fn) {
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(rot || 0); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
  fn(); ctx.restore();
}
// 全屏压暗/叠色
function veil(ctx, color, a) {
  if (a <= 0) return;
  ctx.globalAlpha = clamp01(a); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
}
