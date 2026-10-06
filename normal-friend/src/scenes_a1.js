'use strict';
// =====================================================================
// scenes_a1.js — S1 等待 0:14–0:37
//   14–18 大字「等待」：路灯下的“我”，背后淡入大圆形时钟
//   18–23 昼夜交替（太阳/月亮划过）、落叶→下雨→下雪，头顶“加载中”三点，时钟飞转
//   23–28 “你”从右侧滑入，“我”向“你”倾斜，两人之间粉色细线正弦摆动
//   28–33 问号浮起，依次破裂变成小爱心/闪光
//   33–37 大字「这是爱」：细线卷成大爱心并填满粉色，随节拍心跳，背景转玫瑰色黄昏
// =====================================================================
const S1_DAY0 = 18, S1_DAY1 = 23;

// 昼夜信息：f = 日相 0..1（前半白天/后半夜晚），day = 白天程度，e = 昼夜段包络
function s1DayInfo(t) {
  const e = env(t, S1_DAY0, S1_DAY1, 0.5, 0.5);
  const f = fract(prog(t, S1_DAY0, S1_DAY1) * 2 - 1e-6);
  return { f: f, e: e, day: clamp01(Math.sin(f * TAU) * 1.8) * e };
}
function s1SunMoon(ctx, t, info) {
  if (info.e <= 0 || t < S1_DAY0) return;
  const up = info.f < 0.5, u = up ? info.f / 0.5 : (info.f - 0.5) / 0.5;
  const x = lerp(-120, W + 120, u), y = 700 - Math.sin(u * PI) * 560;
  ctx.save();
  ctx.globalAlpha = info.e;
  if (up) {
    softGlow(ctx, x, y, 240, '#ffd36b', 0.6);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU + t * 1.5;
      line(ctx, x + Math.cos(a) * 82, y + Math.sin(a) * 82, x + Math.cos(a) * 112, y + Math.sin(a) * 112, 8, '#ffd36b');
    }
    circle(ctx, x, y, 64, '#ffd36b');
  } else {
    softGlow(ctx, x, y, 170, PAL.cream, 0.35);
    circle(ctx, x, y, 52, PAL.cream);
    circle(ctx, x - 14, y - 12, 10, 'rgba(38,43,90,0.18)');
    circle(ctx, x + 16, y + 14, 7, 'rgba(38,43,90,0.18)');
  }
  ctx.restore();
}
// 四季：落叶 → 下雨 → 下雪（位置全部由 t 与索引哈希决定）
function s1Seasons(ctx, t) {
  const leafA = env(t, 18.0, 19.9, 0.3, 0.4), rainA = env(t, 19.6, 21.5, 0.3, 0.4), snowA = env(t, 21.2, 23.3, 0.3, 0.5);
  const leafCols = ['#ff9a4a', '#e8673c', '#ffc35a'];
  if (leafA > 0) {
    for (let i = 0; i < 26; i++) {
      const sp = 120 + hash01(i, 102) * 90;
      const y = fract(hash01(i, 101) + t * sp / 1200) * 1200 - 80;
      const x = hash01(i, 103) * W + Math.sin(t * 2 + i) * 60;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2.4 + i); ctx.globalAlpha = leafA;
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 7, 0, 0, TAU); ctx.fillStyle = leafCols[i % 3]; ctx.fill();
      ctx.restore();
    }
  }
  if (rainA > 0) {
    for (let i = 0; i < 70; i++) {
      const y = fract(hash01(i, 111) + t * 1.6) * 1250 - 100;
      const x = hash01(i, 112) * (W + 200) - 100 - y * 0.15;
      line(ctx, x, y, x - 8, y + 34, 2.5, rgba(PAL.skyBlue, 0.55 * rainA));
    }
  }
  if (snowA > 0) {
    for (let i = 0; i < 70; i++) {
      const y = fract(hash01(i, 121) + t * 0.18) * 1150 - 50;
      const x = hash01(i, 122) * W + Math.sin(t * 1.5 + i) * 30;
      ctx.globalAlpha = snowA * 0.9;
      circle(ctx, x, y, 2 + hash01(i, 123) * 4, PAL.cream);
    }
    ctx.globalAlpha = 1;
  }
}
// 粉色细线：A→B 之间正弦摆动；33–34.5 秒卷成大爱心（逐点插值到心形曲线），之后填色并随节拍跳动
function s1Thread(ctx, t, ax, ay, bx, by) {
  const reveal = prog(t, 24.2, 25.2, easeOutCubic);
  if (reveal <= 0) return;
  const m = prog(t, 33.0, 34.5, easeInOutCubic);
  const fillK = prog(t, 34.2, 34.9, easeOutCubic), beat = beatPulse(t);
  const hb = 1 + 0.08 * beat * fillK;
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const amp = 20 * (1 - m), N = HEART_N, cnt = m > 0 ? N : Math.max(2, Math.round(N * reveal));
  if (fillK > 0) softGlow(ctx, HEART_CX, HEART_CY, 340, PAL.heart, 0.4 * fillK * (0.75 + 0.25 * beat));
  ctx.beginPath();
  for (let i = 0; i <= cnt; i++) {
    const s = i / N, w = Math.sin(s * PI) * Math.sin(s * PI * 3 - t * 3.2) * amp;
    const px = ax + dx * s + nx * w, py = ay + dy * s + ny * w;
    const j = i % N;
    const hx = HEART_CX + HEART_PTS[j * 2] * HEART_S * hb, hy = HEART_CY + HEART_PTS[j * 2 + 1] * HEART_S * hb;
    const x = lerp(px, hx, m), y = lerp(py, hy, m);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  if (fillK > 0) { ctx.closePath(); ctx.fillStyle = rgba(PAL.heart, fillK); ctx.fill(); }
  ctx.lineWidth = lerp(4, 8, m); ctx.strokeStyle = PAL.heart; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.stroke();
  if (fillK > 0) circle(ctx, HEART_CX - 7 * HEART_S * hb, HEART_CY - 6 * HEART_S * hb, 2.6 * HEART_S * fillK, 'rgba(255,255,255,0.22)');
}
// 问号依次浮起 → 破裂（圆环 + 碎线）→ 变成小爱心 / 闪光上飘
function s1Questions(ctx, t) {
  if (t < 28 || t > 33.5) return;
  const fadeAll = 1 - prog(t, 32.9, 33.4);
  for (let i = 0; i < 6; i++) {
    const ta = 28.1 + i * 0.3, tp = 29.5 + i * 0.5;
    if (t < ta) continue;
    const ang = -PI * 0.9 + i * (PI * 0.8 / 5), rad = 150 + (i % 2) * 45;
    const bx = ME_X + Math.cos(ang) * rad, by = ME_Y - 30 + Math.sin(ang) * rad * 0.9;
    if (t < tp) {
      const k = prog(t, ta, ta + 0.45), s = easeOutBack(k, 2.4) * (1 + 0.18 * prog(t, tp - 0.25, tp));
      drawQuestion(ctx, bx, by - (t - ta) * 12, 64 * s, PAL.cream, clamp01(k * 2) * fadeAll, Math.sin(t * 3 + i) * 0.2);
      continue;
    }
    const dt = t - tp, y0 = by - (tp - ta) * 12;
    if (dt < 0.4) {
      const kk = dt / 0.4;
      ring(ctx, bx, y0, 20 + kk * 50, 4 * (1 - kk), rgba(PAL.cream, 1 - kk));
      for (let j = 0; j < 6; j++) {
        const a = j / 6 * TAU + i, r1 = 24 + kk * 40, r2 = r1 + 16 * (1 - kk);
        line(ctx, bx + Math.cos(a) * r1, y0 + Math.sin(a) * r1, bx + Math.cos(a) * r2, y0 + Math.sin(a) * r2, 3, rgba(PAL.meGlow, 1 - kk));
      }
    }
    const hy = y0 - dt * 26, sc = easeOutBack(prog(t, tp, tp + 0.4), 2.2);
    if (i % 2 === 0) drawHeart(ctx, bx, hy, 24 * sc, { fill: PAL.heart, alpha: fadeAll, rot: Math.sin(t * 2 + i) * 0.2 });
    else drawSparkle(ctx, bx, hy, 26 * sc * (0.85 + 0.15 * Math.sin(t * 6 + i)), PAL.meGlow, fadeAll);
  }
}
// 时钟：14.2 秒弹出，18–23 秒飞转（约 7 圈），24.6 秒前淡出
function s1Clock(ctx, t) {
  const a = env(t, 14.2, 24.6, 1.0, 1.0) * 0.9;
  if (a <= 0) return;
  const r = 230 * easeOutBack(prog(t, 14.2, 15.2), 1.8);
  const ang = 0.6 * (t - 14) + 44 * easeInOutCubic(prog(t, S1_DAY0, S1_DAY1));
  drawClockFace(ctx, ME_X + 30, 520, r, ang, a, PAL.cream, env(t, 18.3, 22.7, 0.8, 0.8));
}
// “你”从右侧滑入（速度线 + 停稳时挤压回弹）
function s1You(ctx, t) {
  if (t < 23) return;
  const k = prog(t, 23.0, 24.3), x = lerp(2120, YOU_X, easeOutCubic(k)), land = t - 24.3;
  if (k < 1) {
    for (let i = 0; i < 4; i++) {
      const ly = YOU_Y - 40 + i * 26, l = 160 * (1 - k) * (0.6 + 0.4 * hash01(i, 131));
      line(ctx, x + 90 + i * 10, ly, x + 90 + i * 10 + l, ly, 5, rgba(PAL.you, 0.5 * (1 - k)));
    }
  }
  const sq = land > 0 ? 1 + 0.18 * Math.exp(-6 * land) * Math.cos(land * 14) : 0.92;
  const lk = prog(t, 33.2, 34, easeInOutCubic);
  drawYou(ctx, x, YOU_Y, { t: t, r: 78, look: lerp(-0.8, -0.5, lk), lookY: -0.5 * lk, squash: sq,
    rot: k < 1 ? -0.1 * (1 - k) : 0, groundY: GROUND_Y, mood: t > 34.6 ? 'happy' : undefined });
}
function s1Me(ctx, t) {
  const beat = beatPulse(t), lean = 0.16 * prog(t, 23.9, 24.8, easeOutBack);
  let look = -0.25, lookY = lerp(-0.7, 0, prog(t, 17.4, 18.2, easeInOutCubic));
  if (t >= 18 && t < 23) look = lerp(-0.25, Math.sin(t * 0.8) * 0.25, prog(t, 18, 18.6));
  if (t >= 23) look = lerp(look, 0.85, prog(t, 23.2, 23.7, easeInOutCubic));
  if (t >= 28 && t < 33) { look = Math.sin(t * 2.2) * 0.9; lookY = -0.5; }
  if (t >= 33) { look = 0.9; lookY = -0.6; }
  drawMe(ctx, ME_X, ME_Y, { t: t, r: 60, rot: lean, look: look, lookY: lookY,
    squash: 1 + Math.sin(t * 2.2) * 0.025 + 0.05 * beat, glow: 0.55 + 0.3 * beat,
    mood: t > 34.6 ? 'happy' : undefined, groundY: GROUND_Y });
  const da = env(t, 18.2, 23.0, 0.3, 0.3);
  if (da > 0) drawDots(ctx, ME_X, ME_Y - 108, t, { color: PAL.cream, alpha: da, r: 9, gap: 28 });
  return lean;
}
function drawS1(ctx, t) {
  const info = s1DayInfo(t), d = info.day, dusk = prog(t, 33.4, 35.6, easeInOutSine);
  const top = mixColor(mixColor(PAL.night, '#5fa8ee', d), '#4a2452', dusk);
  const bot = mixColor(mixColor(PAL.indigo, PAL.skyBlue, d), PAL.dusk, dusk);
  drawStreet(ctx, t, {
    top: top, bot: bot, starA: (1 - d) * (1 - dusk * 0.7),
    bld: mixColor(mixColor('#1c2246', '#5d74a8', d), '#3a2346', dusk),
    gnd: mixColor(mixColor('#0f1329', '#34466b', d), '#2a1a33', dusk),
    win: 1 - d, light: 1 - 0.8 * d,
    back: function () { s1SunMoon(ctx, t, info); },
    mid: function () { s1Clock(ctx, t); }
  });
  drawBokeh(ctx, t, { count: 24, seed: 13, color: mixColor(PAL.meGlow, PAL.heart, dusk), alpha: 0.08, pulse: beatPulse(t) * 0.5 });
  s1Seasons(ctx, t);
  const lean = s1Me(ctx, t);
  s1You(ctx, t);
  s1Thread(ctx, t, ME_X + 55 + lean * 60, ME_Y - 4, YOU_X - 72, YOU_Y + 6);
  s1Questions(ctx, t);
}
SCENE_IMPL.S1 = {
  draw: function (ctx, t) { drawS1(ctx, t); },
  // 大字放在上方，避开时钟、路灯和爱心
  heroLayout: function () { return { x: 960, y: 190, size: 160, maxW: W * 0.6 }; }
};
