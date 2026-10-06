'use strict';
// =====================================================================
// scenes_a.js — S0–S3 共用布景（夜晚街道、星空、几何楼群、地面、路灯、
//               时钟、参数化大爱心、降饱和）+ S0 片头（0:00–0:14）。
// 所有画面只由 t 决定：随机量全部来自 hash01（无状态种子哈希）。
// 后续场景文件可复用：GROUND_Y、LAMP_X、ME_X/ME_Y、YOU_X/YOU_Y、drawStreet、
//   drawStars、drawClockFace、heartShapePath、drawHeartHalves、desatScreen。
// =====================================================================

// ---- 共用布局 ----
const GROUND_Y = 800;                             // 地面线
const LAMP_X = 640, LAMP_H = 430;                 // 路灯底座 x、高度
const ME_X = LAMP_X + 70, ME_Y = GROUND_Y - 60;   // “我”站在路灯光下（r=60）
const YOU_X = 1250, YOU_Y = GROUND_Y - 78;        // “你”（r=78）
const STAR_N = 90, STAR_SEED = 41;

// ---- 星星（S0 片名粒子最终落到这些位置） ----
function starX(i) { return hash01(i, STAR_SEED) * W; }
function starY(i) { return 50 + hash01(i, STAR_SEED + 1) * 470; }
function starRadius(i) { return 1.2 + hash01(i, STAR_SEED + 2) * 2.4; }
function starTwinkle(t, i) { return 0.55 + 0.45 * Math.sin(t * (1.2 + hash01(i, STAR_SEED + 3) * 2.5) + i * 1.7); }
function drawStars(ctx, t, a) {
  if (a <= 0.01) return;
  for (let i = 0; i < STAR_N; i++) {
    ctx.globalAlpha = clamp01(a * starTwinkle(t, i));
    circle(ctx, starX(i), starY(i), starRadius(i), PAL.cream);
  }
  ctx.globalAlpha = 1;
}

// ---- 几何楼群（常量表，加载时生成一次） ----
const SKYLINE = (function () {
  const out = [];
  let x = -30, i = 0;
  while (x < W + 30) {
    const w = 110 + hash01(i, 61) * 150, h = 150 + hash01(i, 62) * 290;
    out.push({ x: x, w: w, h: h, i: i });
    x += w + 10 + hash01(i, 63) * 40; i++;
  }
  return out;
})();
// rise 0..1：楼群从地面错峰升起；col：楼体颜色；win：窗灯亮度
function drawSkyline(ctx, t, rise, col, win) {
  for (let b = 0; b < SKYLINE.length; b++) {
    const B = SKYLINE[b];
    const k = clamp01(rise * 1.6 - hash01(B.i, 64) * 0.6);
    if (k <= 0) continue;
    const hh = B.h * easeOutBack(k, 1.4), top = GROUND_Y - hh;
    ctx.fillStyle = col;
    ctx.fillRect(B.x, top, B.w, hh + 2);
    if (hash01(B.i, 65) < 0.5) ctx.fillRect(B.x + B.w * 0.3, top - 18, B.w * 0.25, 18);
    if (win <= 0) continue;
    const cols = Math.floor((B.w - 20) / 30), rows = Math.floor((B.h - 30) / 40);
    for (let r = 0; r < rows; r++) {
      const wy = top + 22 + r * 40;
      if (wy > GROUND_Y - 30) break;
      for (let c = 0; c < cols; c++) {
        const id = B.i * 400 + r * 20 + c;
        if (hash01(id, 66) > 0.32) continue;
        const fl = 0.75 + 0.25 * Math.sin(t * (0.5 + hash01(id, 67)) + id);
        ctx.fillStyle = rgba(PAL.meGlow, win * 0.5 * fl);
        ctx.fillRect(B.x + 14 + c * 30, wy, 12, 18);
      }
    }
  }
}
function drawGround(ctx, col, rim) {
  ctx.fillStyle = col; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = rim; ctx.fillRect(0, GROUND_Y, W, 5);
  ctx.fillStyle = 'rgba(255,244,224,0.06)';
  for (let x = 40; x < W; x += 160) ctx.fillRect(x, GROUND_Y + 60, 80, 6);
}
// 路灯：grow 0..1 从地面弹性长出；light 0..1 亮度
function drawStreetLamp(ctx, grow, light) {
  if (grow <= 0) return;
  ctx.save();
  ctx.translate(LAMP_X, GROUND_Y); ctx.scale(1, easeOutBack(clamp01(grow), 1.6)); ctx.translate(-LAMP_X, -GROUND_Y);
  drawLamp(ctx, LAMP_X, GROUND_Y, LAMP_H, light);
  ctx.restore();
}
// 夜晚街道。o = { top, bot, starA, rise, bld, gnd, rim, win, lampGrow, light, back(), mid() }
//   back() 在星星之后、楼群之前绘制（太阳/月亮）；mid() 在地面之后、路灯之前绘制（时钟）
function drawStreet(ctx, t, o) {
  fillSky(ctx, o.top || PAL.night, o.bot || PAL.indigo);
  drawStars(ctx, t, o.starA === undefined ? 1 : o.starA);
  if (o.back) o.back();
  drawSkyline(ctx, t, o.rise === undefined ? 1 : o.rise, o.bld || '#1c2246', o.win === undefined ? 1 : o.win);
  drawGround(ctx, o.gnd || '#0f1329', o.rim || '#2a3060');
  if (o.mid) o.mid();
  drawStreetLamp(ctx, o.lampGrow === undefined ? 1 : o.lampGrow, o.light === undefined ? 1 : o.light);
}
// ---- 圆形时钟：minuteAng 为分针角度（弧度，0 = 12 点）；blur 为飞转残影（正 = 顺时针） ----
function drawClockFace(ctx, x, y, r, minuteAng, a, col, blur) {
  if (a <= 0 || r <= 0) return;
  const k = r / 230;
  ctx.save();
  ctx.globalAlpha = clamp01(a);
  circle(ctx, x, y, r, rgba(PAL.indigo, 0.6));
  ring(ctx, x, y, r, 10 * k, rgba(col, 0.6));
  for (let i = 0; i < 12; i++) {
    const an = i / 12 * TAU, big = i % 3 === 0, r1 = r * (big ? 0.76 : 0.84), r2 = r * 0.92;
    line(ctx, x + Math.cos(an) * r1, y + Math.sin(an) * r1, x + Math.cos(an) * r2, y + Math.sin(an) * r2,
      (big ? 8 : 4) * k, rgba(col, 0.6));
  }
  const ma = minuteAng - PI / 2, ha = minuteAng / 12 - PI / 2;
  if (blur) {
    const b = clamp(blur, -1, 1);
    ctx.beginPath(); ctx.moveTo(x, y);
    if (b > 0) ctx.arc(x, y, r * 0.8, ma - 1.2 * b, ma); else ctx.arc(x, y, r * 0.8, ma, ma - 1.2 * b);
    ctx.closePath(); ctx.fillStyle = rgba(PAL.me, 0.28 * Math.abs(b)); ctx.fill();
  }
  line(ctx, x, y, x + Math.cos(ha) * r * 0.5, y + Math.sin(ha) * r * 0.5, 12 * k, col);
  line(ctx, x, y, x + Math.cos(ma) * r * 0.78, y + Math.sin(ma) * r * 0.78, 7 * k, PAL.me);
  circle(ctx, x, y, 12 * k, col);
  ctx.restore();
}

// ---- 参数化大爱心（经典心形曲线，96 点；y 向下为正，顶部凹口 y=-5，底尖 y=17） ----
const HEART_N = 96;
const HEART_PTS = (function () {
  const a = new Float32Array(HEART_N * 2);
  for (let i = 0; i < HEART_N; i++) {
    const th = PI + i / HEART_N * TAU, s = Math.sin(th);
    a[i * 2] = 16 * s * s * s;
    a[i * 2 + 1] = -(13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th));
  }
  return a;
})();
const HEART_CX = 985, HEART_CY = 470, HEART_S = 10.5;   // S1 末尾大爱心的位置与尺度
function heartShapePath(ctx, cx, cy, s) {
  ctx.beginPath();
  for (let i = 0; i < HEART_N; i++) {
    const x = cx + HEART_PTS[i * 2] * s, y = cy + HEART_PTS[i * 2 + 1] * s;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
// 锯齿裂纹（单位爱心坐标，x,y 交替）：从凹口上方穿到底尖下方
const HEART_CRACK = [0, -9, 0, -5, 2.4, -1.5, -1.9, 1.8, 2.7, 4.8, -2.1, 7.8, 1.7, 10.8, -1.1, 13.8, 0, 17, 0, 21];
function crackPolyline(ctx, s, k) {
  const n = HEART_CRACK.length / 2, upto = k * (n - 1);
  ctx.beginPath(); ctx.moveTo(HEART_CRACK[0] * s, HEART_CRACK[1] * s);
  for (let i = 1; i < n; i++) {
    if (i <= upto) { ctx.lineTo(HEART_CRACK[i * 2] * s, HEART_CRACK[i * 2 + 1] * s); continue; }
    const f = upto - (i - 1);
    if (f > 0) {
      ctx.lineTo(lerp(HEART_CRACK[i * 2 - 2], HEART_CRACK[i * 2], f) * s, lerp(HEART_CRACK[i * 2 - 1], HEART_CRACK[i * 2 + 1], f) * s);
    }
    break;
  }
}
// 爱心（可裂开）。o = { sep: 两半分开距离, crack: 裂纹绘制进度 0..1, fill, scale }
function drawHeartHalves(ctx, cx, cy, s, o) {
  const sep = o.sep || 0, crack = o.crack || 0, fill = o.fill || PAL.heart;
  const ink = 'rgba(20,16,40,0.85)';
  if (sep <= 0.01) {
    ctx.save(); ctx.translate(cx, cy);
    heartShapePath(ctx, 0, 0, s); ctx.fillStyle = fill; ctx.fill();
    circle(ctx, -7 * s, -6 * s, 2.6 * s, 'rgba(255,255,255,0.22)');
    if (crack > 0) {
      ctx.save(); heartShapePath(ctx, 0, 0, s); ctx.clip();   // 裂纹只画在心形内
      crackPolyline(ctx, s, crack); ctx.lineWidth = 7; ctx.strokeStyle = ink; ctx.lineJoin = 'miter'; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    return;
  }
  for (let side = -1; side <= 1; side += 2) {
    ctx.save();
    ctx.translate(cx + side * sep, cy + sep * 0.25);
    ctx.translate(0, 17 * s); ctx.rotate(side * sep / 700); ctx.translate(0, -17 * s);
    // 以裂纹为界裁出半边
    ctx.beginPath(); ctx.moveTo(HEART_CRACK[0] * s, HEART_CRACK[1] * s);
    for (let i = 1; i < HEART_CRACK.length / 2; i++) ctx.lineTo(HEART_CRACK[i * 2] * s, HEART_CRACK[i * 2 + 1] * s);
    ctx.lineTo(side * 30 * s, 21 * s); ctx.lineTo(side * 30 * s, -9 * s); ctx.closePath();
    ctx.clip();
    heartShapePath(ctx, 0, 0, s); ctx.fillStyle = fill; ctx.fill();
    if (side < 0) circle(ctx, -7 * s, -6 * s, 2.6 * s, 'rgba(255,255,255,0.22)');
    heartShapePath(ctx, 0, 0, s); ctx.clip();
    crackPolyline(ctx, s, 1); ctx.lineWidth = 8; ctx.strokeStyle = ink; ctx.stroke();
    ctx.restore();
  }
}
// 全屏降饱和（只影响已画内容；歌词在场景之后绘制，不受影响）
function desatScreen(ctx, k) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = clamp01(k);
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
// 四角闪光
function drawSparkle(ctx, x, y, s, col, a) {
  if (a <= 0 || s <= 0) return;
  ctx.globalAlpha = clamp01(a);
  starPath(ctx, x, y, s, s * 0.32, 4, -PI / 2); ctx.fillStyle = col; ctx.fill();
  ctx.globalAlpha = 1;
}
// 节拍同心波纹：每拍从 (x, y) 发出一圈，最近 5 拍可见；t0 之前的拍不发
function drawBeatRipples(ctx, t, x, y, t0, a, col) {
  if (a <= 0) return;
  const b0 = beatIndex(t);
  for (let k = 0; k < 5; k++) {
    const tb = beatTime(b0 - k);
    if (tb < t0) break;
    const age = t - tb, f = 1 - age / 3.2;
    if (f <= 0) continue;
    ring(ctx, x, y, 34 + easeOutCubic(clamp01(age / 3.2)) * 900, 2 + 5 * f, rgba(col, a * 0.75 * f));
  }
}

// =====================================================================
// S0 片头 0:00–0:14：黑屏 → 珊瑚点弹出 + 节拍波纹 → 片名/副标题错峰落下 →
//   10.0 秒片名碎成粒子 → 粒子飞成星星 → 镜头揭示夜晚街道与路灯，点落地变成“我”
// =====================================================================
const S0_TITLE = '普通朋友';           // 歌名
const S0_SUB = '陶喆';                  // 演唱者
const S0_SUB_HI = S0_SUB.indexOf('陶喆');   // 从这里开始高亮
const S0_TY = 500, S0_SY = 685, S0_TSIZE = 180, S0_SSIZE = 64;
const S0_SHATTER = 10.0, S0_STAR_DONE = 12.3;
let _s0Lay = null;   // 文字测量缓存（只与字体有关，与 t 无关）
function s0Row(ctx, text, size, weight, family, track, y) {
  const chars = Array.from(text), font = fontStr(size, weight, family), ws = [], xs = [];
  let total = 0;
  for (let i = 0; i < chars.length; i++) { ws.push(measureW(ctx, chars[i], font)); total += ws[i]; }
  total += track * (chars.length - 1);
  let x = W / 2 - total / 2;
  for (let i = 0; i < chars.length; i++) { xs.push(x + ws[i] / 2); x += ws[i] + track; }
  return { chars: chars, ws: ws, xs: xs, y: y, font: font, size: size, w: total };
}
function s0Layout(ctx) {
  if (!_s0Lay) {
    _s0Lay = {
      title: s0Row(ctx, S0_TITLE, S0_TSIZE, 900, FONT_CN, 26, S0_TY),
      sub: s0Row(ctx, S0_SUB, S0_SSIZE, 700, FONT_CN, 22, S0_SY)
    };
  }
  return _s0Lay;
}
// “普通”奶油白，“朋友”青绿（与全片 friend / 朋友 的高亮色一致）
function s0TitleColor(i) { return i >= 2 ? PAL.you : PAL.cream; }
// 珊瑚点的位置：中央弹出 → 上移到片名上方 → 11.6–13.0 弧线落到路灯下
function s0DotPos(t) {
  let x = 960, y = lerp(540, 330, prog(t, 1.8, 2.6, easeInOutCubic)), r = 26;
  const k = prog(t, 11.6, 13.0);
  if (k > 0) {
    const e = easeInOutCubic(k);
    x = lerp(960, ME_X, e);
    y = lerp(330, ME_Y, easeInQuad(k)) - Math.sin(k * PI) * 140;
    r = lerp(26, 60, e);
  }
  return { x: x, y: y, r: r, k: k };
}
// 片名 + 副标题：逐字错峰落下（弹跳），碎裂前颤抖
function s0Title(ctx, t, lay) {
  if (t < 2.3 || t >= S0_SHATTER + 0.08) return;
  const fade = 1 - prog(t, S0_SHATTER, S0_SHATTER + 0.08);
  const shake = prog(t, 9.2, S0_SHATTER, easeInQuad) * 8, beat = beatPulse(t) * 0.5;
  const T = lay.title;
  for (let i = 0; i < T.chars.length; i++) {
    const t0 = 2.3 + i * 0.16, k = prog(t, t0, t0 + 0.75);
    if (k <= 0) continue;
    const dy = -(1 - easeOutBounce(k)) * 300, rot = (1 - k) * (hash01(i, 81) - 0.5) * 0.9;
    const sx = Math.sin(t * 61 + i * 2.1) * shake, sy = Math.cos(t * 53 + i * 1.3) * shake;
    drawGlyph(ctx, T.chars[i], T.xs[i] + sx, S0_TY + dy + sy, 1 + 0.035 * beat, rot, clamp01(k * 3) * fade,
      s0TitleColor(i), T.font, S0_TSIZE, false);
  }
  const u = prog(t, 3.3, 4.1, easeOutCubic);
  if (u > 0) {
    const hw = T.w * 0.36;
    ctx.globalAlpha = fade; fillRoundRect(ctx, 960 - hw * u, S0_TY + 120, 2 * hw * u, 8, 4, PAL.me); ctx.globalAlpha = 1;
  }
  const S = lay.sub;
  for (let j = 0; j < S.chars.length; j++) {
    if (S.chars[j] === ' ') continue;
    const t0 = 3.6 + j * 0.1, k = prog(t, t0, t0 + 0.6);
    if (k <= 0) continue;
    const dy = -(1 - easeOutBounce(k)) * 140;
    const sx = Math.sin(t * 57 + j) * shake * 0.6;
    drawGlyph(ctx, S.chars[j], S.xs[j] + sx, S0_SY + dy, 1, 0, clamp01(k * 3) * fade,
      j >= S0_SUB_HI ? PAL.meGlow : PAL.cream, S.font, S0_SSIZE, false);
  }
}
// 环绕片名的几何小件：错峰弹出、自转，碎裂时向外炸开
function s0Decor(ctx, t) {
  const cols = [PAL.me, PAL.you, PAL.heart, PAL.meGlow];
  const ex = prog(t, S0_SHATTER, S0_SHATTER + 0.7, easeOutCubic);
  if (ex >= 1) return;
  for (let i = 0; i < 8; i++) {
    const t0 = 4.2 + i * 0.16, k = prog(t, t0, t0 + 0.6);
    if (k <= 0) continue;
    const ang = i / 8 * TAU + 0.3, f = 0.85 + 0.15 * hash01(i, 91);
    const x = 960 + Math.cos(ang) * (720 * f + ex * 500);
    const y = 520 + Math.sin(ang) * (300 * f + ex * 500) + Math.sin(t * 1.3 + i) * 10;
    const sc = easeOutBack(k, 2.5) * (1 + 0.12 * beatPulse(t)), col = cols[i % 4];
    ctx.save();
    ctx.translate(x, y); ctx.rotate(t * 0.6 * (i % 2 ? 1 : -1) + i); ctx.scale(sc, sc);
    ctx.globalAlpha = 0.85 * (1 - ex);
    if (i % 3 === 0) { regularPolyPath(ctx, 0, 0, 22, 3, 0); ctx.fillStyle = col; ctx.fill(); }
    else if (i % 3 === 1) ring(ctx, 0, 0, 18, 6, col);
    else { ctx.fillStyle = col; ctx.fillRect(-15, -15, 30, 30); }
    ctx.restore();
  }
}
// 碎裂粒子：从片名字形处炸开（指数阻尼），10.5–12.3 秒缓动到星星位置，之后由 drawStars 接管
function s0Particles(ctx, t, lay) {
  const dt = t - S0_SHATTER;
  if (dt < 0) return;
  const m = prog(t, 10.5, S0_STAR_DONE, easeInOutCubic);
  const fly = (1 - Math.exp(-3.2 * dt)) / 3.2;
  for (let i = 0; i < STAR_N; i++) {
    let ox, oy, col;
    if (i < 60) {
      const c = i % lay.title.chars.length;
      ox = lay.title.xs[c] + (hash01(i, 71) - 0.5) * lay.title.ws[c];
      oy = S0_TY + (hash01(i, 72) - 0.5) * S0_TSIZE * 0.8; col = s0TitleColor(c);
    } else {
      const c = Math.floor(hash01(i, 73) * lay.sub.chars.length);
      ox = lay.sub.xs[c]; oy = S0_SY + (hash01(i, 74) - 0.5) * 30; col = PAL.cream;
    }
    const ang = hash01(i, 75) * TAU, sp = 260 + hash01(i, 76) * 640;
    const bx = ox + Math.cos(ang) * sp * fly, by = oy + Math.sin(ang) * sp * fly - 60 * dt;
    ctx.globalAlpha = clamp01(lerp(1, starTwinkle(t, i), m));
    circle(ctx, lerp(bx, starX(i), m), lerp(by, starY(i), m), lerp(5 - hash01(i, 77) * 2, starRadius(i), m),
      m > 0.6 ? PAL.cream : col);
  }
  ctx.globalAlpha = 1;
}
function s0Flash(ctx, t) {
  const k = prog(t, S0_SHATTER, S0_SHATTER + 0.6);
  if (k <= 0 || k >= 1) return;
  ring(ctx, 960, 560, 40 + easeOutCubic(k) * 1100, 30 * (1 - k), rgba(PAL.cream, 0.8 * (1 - k)));
  veil(ctx, PAL.cream, 0.35 * (1 - prog(t, S0_SHATTER, S0_SHATTER + 0.2)));
}
function s0LampLight(t) {
  if (t < 12.6) return 0;
  if (t < 13.1) return hash01(Math.floor(t * 14), 95) < 0.5 ? 0.15 : 0.9;   // 通电闪烁
  return 1;
}
// 镜头揭示街道：从 1.5 倍推近的上空缓缓拉回全景，楼群错峰升起，路灯长出并闪亮
function s0Street(ctx, t) {
  const e = prog(t, 10.9, 12.9, easeInOutCubic);
  withCamera(ctx, lerp(ME_X, 960, e), lerp(430, 540, e), lerp(1.5, 1, e), 0, function () {
    drawSkyline(ctx, t, prog(t, 11.0, 12.6), '#1c2246', prog(t, 12.3, 13.0));
    ctx.globalAlpha = prog(t, 10.9, 11.5);
    drawGround(ctx, '#0f1329', '#2a3060');
    ctx.globalAlpha = 1;
    drawStreetLamp(ctx, prog(t, 11.9, 12.6), s0LampLight(t));
  });
}
// 珊瑚点 → “我”
function s0Dot(ctx, t, d) {
  if (t < 0.6) return;
  const beat = beatPulse(t);
  if (t < 11.6) {
    const pop = easeOutElastic(prog(t, 0.6, 1.5));
    const r = d.r * pop * (1 + 0.12 * beat * (t < S0_SHATTER ? 1 : 0.3));
    softGlow(ctx, d.x, d.y, r * 4, PAL.meGlow, 0.5 + 0.3 * beat);
    circle(ctx, d.x, d.y, r, PAL.me);
    circle(ctx, d.x - r * 0.3, d.y - r * 0.35, r * 0.35, 'rgba(255,255,255,0.25)');
    return;
  }
  const land = t - 13.0;
  if (land < 0) {
    drawMe(ctx, d.x, d.y, { t: t, r: d.r, blink: 1 - prog(t, 11.7, 12.1), shadow: false, glow: 0.7,
      rot: Math.sin(d.k * PI) * 0.35, squash: lerp(1, 0.86, prog(t, 12.5, 13.0)) });
    return;
  }
  const sq = 1 + 0.45 * Math.exp(-7 * land) * Math.cos(land * 16);
  const lk = prog(t, 13.4, 13.8, easeInOutCubic);
  // 落地灰尘
  if (land < 0.7) {
    const kk = land / 0.7;
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1, j = i % 3;
      ctx.globalAlpha = 0.5 * (1 - kk);
      circle(ctx, ME_X + side * (60 + kk * (70 + j * 40)), GROUND_Y - 8 - Math.sin(kk * PI) * (10 + j * 8),
        (12 - j * 2) * (1 - kk * 0.5), '#3a4280');
    }
    ctx.globalAlpha = 1;
  }
  drawMe(ctx, ME_X, ME_Y, { t: t, r: 60, squash: sq, look: -0.25 * lk, lookY: -0.7 * lk,
    groundY: GROUND_Y, glow: 0.6 + 0.3 * beat });
}
function drawS0(ctx, t) {
  const lay = s0Layout(ctx);
  const skyA = prog(t, 10.6, 12.6, easeInOutSine);
  fillSky(ctx, mixColor('#05060d', PAL.night, skyA), mixColor('#05060d', PAL.indigo, skyA));
  const introA = env(t, 0.6, 10.4, 1.2, 0.4);
  if (introA > 0) {
    softGlow(ctx, 960, 470, 760, PAL.indigo, 0.55 * introA);
    drawBokeh(ctx, t, { count: 22, seed: 5, color: PAL.meGlow, alpha: 0.07 * introA, pulse: beatPulse(t) * 0.5 });
  }
  if (t >= S0_STAR_DONE) drawStars(ctx, t, 1); else s0Particles(ctx, t, lay);
  if (t > 10.9) s0Street(ctx, t);
  const d = s0DotPos(t);
  drawBeatRipples(ctx, t, d.x, d.y, 0.8, env(t, 0.8, S0_SHATTER + 0.4, 0.2, 0.4), PAL.me);
  s0Decor(ctx, t);
  s0Title(ctx, t, lay);
  s0Flash(ctx, t);
  s0Dot(ctx, t, d);
}
SCENE_IMPL.S0 = { draw: function (ctx, t) { drawS0(ctx, t); } };
