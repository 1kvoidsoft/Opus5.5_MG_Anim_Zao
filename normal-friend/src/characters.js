'use strict';
// =====================================================================
// characters.js — 共用绘制件：“我”（珊瑚橙）、“你”（青绿）、眼睛、
//                 小手、爱心、对话气泡、打字点、云朵、问号。
// 所有参数显式传入，无帧间状态。坐标 (x, y) 为角色身体中心。
// =====================================================================

// 眨眼量：0 = 睁眼，1 = 完全闭眼。由 t 与种子决定，周期 3.2–4.7 秒。
function blinkAmt(t, seed) {
  const s = seed || 1;
  const period = 3.2 + hash01(s, 7) * 1.5;
  const ph = ((t + hash01(s, 3) * period) % period + period) % period;
  return ph < 0.16 ? Math.sin(ph / 0.16 * PI) : 0;
}

// 眼睛：o = { look: -1..1（左右看）, lookY: -1..1, blink: 0..1, mood: 'normal'|'sad'|'happy', eyeColor }
function drawEyes(ctx, x, y, r, o) {
  const look = o.look || 0, lookY = o.lookY || 0, blink = clamp01(o.blink || 0);
  const mood = o.mood || 'normal', col = o.eyeColor || '#1b1d33';
  const ex = r * 0.34, ey = -r * 0.12, er = r * 0.15;
  const dx = look * r * 0.2, dy = lookY * r * 0.14;
  for (let s = -1; s <= 1; s += 2) {
    const cx = x + s * ex + dx, cy = y + ey + dy;
    ctx.fillStyle = col; ctx.strokeStyle = col; // 每只眼重设（高光会改 fillStyle）
    if (mood === 'happy') {
      ctx.beginPath(); ctx.lineWidth = er * 0.7; ctx.lineCap = 'round';
      ctx.arc(cx, cy + er * 0.4, er, PI * 1.1, PI * 1.9); ctx.stroke();
      continue;
    }
    const h = er * (1 - blink * 0.92);
    ctx.beginPath(); ctx.ellipse(cx, cy, er, Math.max(0.6, h), 0, 0, TAU); ctx.fill();
    if (mood === 'sad') {
      // 下垂眉：内端高、外端低（八字眉）
      ctx.beginPath(); ctx.lineWidth = er * 0.45; ctx.lineCap = 'round';
      ctx.moveTo(cx - s * er * 1.3, cy - er * 2.3); ctx.lineTo(cx + s * er * 1.0, cy - er * 1.5); ctx.stroke();
    } else if (blink < 0.3) {
      circle(ctx, cx + er * 0.35, cy - er * 0.35, er * 0.3, 'rgba(255,255,255,0.85)');
    }
  }
}

// 极简小手：从身体边缘伸出的短线，angle 为方向（弧度），len 为长度倍数
function drawHand(ctx, x, y, r, angle, len, color) {
  const sx = x + Math.cos(angle) * r * 0.92, sy = y + Math.sin(angle) * r * 0.92;
  const L = r * (len || 0.55);
  const ex = sx + Math.cos(angle) * L, ey = sy + Math.sin(angle) * L;
  line(ctx, sx, sy, ex, ey, r * 0.14, color);
  circle(ctx, ex, ey, r * 0.1, color);
}

// 身体路径：shape = 'circle' | 'roundSquare' | 'triangle' | 'star'
function bodyPath(ctx, x, y, r, shape) {
  switch (shape) {
    case 'roundSquare': roundRectPath(ctx, x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, r * 0.35); break;
    case 'triangle': regularPolyPath(ctx, x, y + r * 0.15, r * 1.15, 3, -PI / 2); break;
    case 'star': starPath(ctx, x, y + r * 0.05, r * 1.15, r * 0.55, 5, -PI / 2); break;
    default: ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  }
}

// 通用角色。o = {
//   r, color, glowColor, glow(0..1), squash(1=无形变；>1 压扁变宽), rot,
//   look, lookY, blink, mood, shape, hands:[{a, len}], shadow(bool), groundY, alpha }
function drawCharacter(ctx, x, y, o) {
  const r = o.r || 60, sq = o.squash || 1, col = o.color || PAL.me;
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  if (o.shadow !== false) {
    const gy = o.groundY === undefined ? y + r : o.groundY;
    const hgt = Math.max(0, gy - (y + r));
    groundShadow(ctx, x, gy + 4, r * 1.1 * sq / (1 + hgt / 300), r * 0.22, a / (1 + hgt / 200));
  }
  if (o.glow > 0) softGlow(ctx, x, y, r * 2.6, o.glowColor || PAL.meGlow, 0.55 * o.glow);
  ctx.translate(x, y + r); // 以脚底为挤压锚点
  ctx.rotate(o.rot || 0);
  ctx.scale(sq, 1 / sq);
  ctx.translate(0, -r);
  if (o.hands) {
    for (let i = 0; i < o.hands.length; i++) drawHand(ctx, 0, 0, r, o.hands[i].a, o.hands[i].len, col);
  }
  bodyPath(ctx, 0, 0, r, o.shape);
  ctx.fillStyle = col; ctx.fill();
  // 扁平高光（左上月牙）与暗部
  ctx.save(); ctx.clip();
  circle(ctx, -r * 0.35, -r * 0.4, r * 0.55, 'rgba(255,255,255,0.16)');
  circle(ctx, r * 0.45, r * 0.6, r * 0.8, 'rgba(0,0,0,0.12)');
  ctx.restore();
  drawEyes(ctx, 0, 0, r, o);
  ctx.restore();
}

// “我”：珊瑚橙小圆角色，默认带柔光
function drawMe(ctx, x, y, o) {
  const opt = o || {};
  const glow = opt.glow === undefined ? 0.6 : opt.glow;
  drawCharacter(ctx, x, y, {
    r: opt.r || 60, color: opt.color || PAL.me, glowColor: PAL.meGlow, glow: glow,
    squash: opt.squash, rot: opt.rot, look: opt.look, lookY: opt.lookY,
    blink: opt.blink === undefined ? blinkAmt(opt.t || 0, 11) : opt.blink,
    mood: opt.mood, shape: opt.shape, hands: opt.hands, shadow: opt.shadow,
    groundY: opt.groundY, alpha: opt.alpha
  });
}

// “你”：稍大的青绿圆角色
function drawYou(ctx, x, y, o) {
  const opt = o || {};
  drawCharacter(ctx, x, y, {
    r: opt.r || 78, color: opt.color || PAL.you, glowColor: PAL.you, glow: opt.glow || 0,
    squash: opt.squash, rot: opt.rot, look: opt.look, lookY: opt.lookY,
    blink: opt.blink === undefined ? blinkAmt(opt.t || 0, 23) : opt.blink,
    mood: opt.mood, shape: opt.shape, hands: opt.hands, shadow: opt.shadow,
    groundY: opt.groundY, alpha: opt.alpha
  });
}

// 爱心路径：中心 (x, y)，s 为半宽
function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.25, y + s * 0.05, x - s * 0.95, y - s * 0.95, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.95, y - s * 0.95, x + s * 1.25, y + s * 0.05, x, y + s * 0.9);
  ctx.closePath();
}
// o = { fill, stroke, lw, rot, alpha }
function drawHeart(ctx, x, y, s, o) {
  const opt = o || {};
  if (s <= 0) return;
  ctx.save();
  ctx.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
  ctx.translate(x, y); ctx.rotate(opt.rot || 0);
  heartPath(ctx, 0, 0, s);
  if (opt.fill !== null) { ctx.fillStyle = opt.fill || PAL.heart; ctx.fill(); }
  if (opt.stroke) { ctx.lineWidth = opt.lw || 4; ctx.strokeStyle = opt.stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
  ctx.restore();
}

// 对话气泡：左上 (x, y)，宽高 w/h，尾巴尖端 (tx, ty)。o = { fill, stroke, lw, r, alpha }
function drawBubble(ctx, x, y, w, h, tx, ty, o) {
  const opt = o || {};
  const r = opt.r === undefined ? Math.min(w, h) * 0.3 : opt.r;
  ctx.save();
  ctx.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
  const cx = x + w / 2, cy = y + h / 2;
  const bw = Math.min(w * 0.18, 60);
  const bx = clamp(tx, x + r + bw / 2, x + w - r - bw / 2);
  const by = ty > cy ? y + h - 1 : y + 1;
  roundRectPath(ctx, x, y, w, h, r);
  ctx.moveTo(bx - bw / 2, by); ctx.lineTo(tx, ty); ctx.lineTo(bx + bw / 2, by);
  ctx.fillStyle = opt.fill || PAL.cream; ctx.fill();
  if (opt.stroke) { ctx.lineWidth = opt.lw || 4; ctx.strokeStyle = opt.stroke; ctx.stroke(); }
  ctx.restore();
  return { cx: cx, cy: cy };
}

// 打字 / 加载中三点：t 驱动依次跳动
function drawDots(ctx, x, y, t, o) {
  const opt = o || {};
  const gap = opt.gap || 26, r = opt.r || 8, col = opt.color || '#262b5a';
  for (let i = 0; i < 3; i++) {
    const ph = fract(t * (opt.speed || 1.6) - i * 0.18);
    const j = ph < 0.4 ? Math.sin(ph / 0.4 * PI) : 0;
    ctx.globalAlpha = (opt.alpha === undefined ? 1 : opt.alpha) * (0.45 + 0.55 * j);
    circle(ctx, x + (i - 1) * gap, y - j * r * 1.3, r, col);
  }
  ctx.globalAlpha = 1;
}

// 扁平云朵：中心 (x, y)，s 为尺度
function drawCloud(ctx, x, y, s, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha === undefined ? 1 : alpha;
  ctx.fillStyle = color || '#ffffff';
  ctx.beginPath();
  ctx.arc(x - s * 0.55, y + s * 0.1, s * 0.42, 0, TAU);
  ctx.arc(x, y - s * 0.12, s * 0.58, 0, TAU);
  ctx.arc(x + s * 0.58, y + s * 0.12, s * 0.38, 0, TAU);
  ctx.fill();
  fillRoundRect(ctx, x - s * 0.95, y + s * 0.05, s * 1.9, s * 0.45, s * 0.22, color || '#ffffff');
  ctx.restore();
}

// 问号符号（几何文字）
function drawQuestion(ctx, x, y, size, color, alpha, rot) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot || 0);
  drawText(ctx, '?', 0, 0, size, color || PAL.cream, { alpha: alpha === undefined ? 1 : alpha, family: FONT_EN, weight: 800 });
  ctx.restore();
}

// 几何路灯：底座 (x, groundY)，高度 h，亮度 light 0..1
function drawLamp(ctx, x, groundY, h, light) {
  const topY = groundY - h;
  if (light > 0) {
    // 光锥
    ctx.save();
    ctx.globalAlpha = 0.18 * light;
    ctx.beginPath();
    ctx.moveTo(x + 70, topY + 20); ctx.lineTo(x + 70 - 260, groundY); ctx.lineTo(x + 70 + 260, groundY);
    ctx.closePath(); ctx.fillStyle = PAL.meGlow; ctx.fill();
    ctx.restore();
    softGlow(ctx, x + 70, topY + 18, 140, PAL.meGlow, 0.7 * light);
  }
  fillRoundRect(ctx, x - 7, topY, 14, h, 6, '#2e3466');
  fillRoundRect(ctx, x - 7, topY - 4, 82, 12, 6, '#2e3466');
  fillRoundRect(ctx, x + 44, topY + 4, 52, 18, 8, '#3a4280');
  circle(ctx, x + 70, topY + 24, 12, light > 0 ? mixColor('#555a7a', PAL.heaven, light) : '#555a7a');
  fillRoundRect(ctx, x - 24, groundY - 14, 48, 14, 5, '#2e3466');
}
