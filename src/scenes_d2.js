'use strict';
// =====================================================================
// scenes_d2.js — S9 片尾 4:06–4:17（无歌词），登记 SCENE_IMPL.S9
//   回到开头的路灯街道；“你”慢慢走出右侧画面；“我”留在原地，胸口小爱心微光；
//   路灯闪两下；淡入小字“等待”（与开头的「等待」形成环形叙事）；
//   最后 2 秒（255–257）淡出黑场，正中留下小号片名“我不能只是做你的朋友”，256.4 秒后画面完全静止，
//   257.0 秒定格（player.js 把 t 钳制在 TOTAL，停在这一帧）。
// =====================================================================
const S9_WALK0 = 247.4, S9_WALK1 = 251.6, S9_BLACK0 = 255.0, S9_BLACK1 = 256.0;

// 路灯闪两下（短暂熄灭两次），其余时间常亮
function s9LampLight(t) {
  if (t >= 251.75 && t < 251.9) return 0.12;
  if (t >= 252.1 && t < 252.25) return 0.12;
  return 1;
}
function s9You(ctx, t) {
  const k = prog(t, S9_WALK0, S9_WALK1, easeInSine);
  const ux = lerp(S8_END_YOU_X, 2160, k);
  if (ux > W + 100) return;
  // 先看“我”，246.9 秒转身朝右，走路时随步伐上下颠
  const turn = prog(t, 246.9, 247.3, easeInOutCubic);
  const ph = Math.max(0, t - S9_WALK0) * 1.6, walking = t > S9_WALK0 ? 1 : 0;
  const bob = Math.abs(Math.sin(ph * PI)) * 12 * walking;
  drawYou(ctx, ux, GROUND_Y - 78 - bob, { t: t, r: 78, look: lerp(-0.8, 1, turn), lookY: lerp(-0.1, 0.15, turn),
    groundY: GROUND_Y, squash: 1 + 0.05 * Math.cos(ph * TAU) * walking });
}
function easeInSine(x) { return 1 - Math.cos(x * PI / 2); }
function s9Me(ctx, t, light) {
  // 目送“你”离开；“你”出画后慢慢低下头
  const down = prog(t, 251.8, 252.8, easeInOutCubic);
  const look = lerp(0.85, 0.35, down), lookY = lerp(-0.1, 0.45, down);
  drawMe(ctx, ME_X, ME_Y, { t: t, r: 60, look: look, lookY: lookY, groundY: GROUND_Y,
    glow: 0.25 + 0.3 * light, squash: 1 + 0.02 * Math.sin(t * 2.2) });
  // 胸口小爱心：缓慢呼吸的微光
  const c = meChest(ME_X, ME_Y, 60, 1, 0), hp = 0.5 + 0.5 * Math.sin((t - 246) * 2.4);
  softGlow(ctx, c.x, c.y, 60, PAL.heart, 0.35 + 0.35 * hp);
  drawHeart(ctx, c.x, c.y, 11 + 1.5 * hp, { fill: PAL.heart, alpha: 0.75 + 0.25 * hp });
}
function drawS9(ctx, t) {
  const light = s9LampLight(t);
  drawStreet(ctx, t, { light: light, win: 0.7 });
  drawBokeh(ctx, t, { count: 20, seed: 901, color: PAL.meGlow, alpha: 0.07, speed: 0.5 });
  s9You(ctx, t);
  s9Me(ctx, t, light);
  // 小字“等待”：两字分开排，慢慢淡入并轻微上浮
  const wa = prog(t, 252.6, 253.8, easeOutCubic) * (1 - prog(t, S9_BLACK0, S9_BLACK0 + 0.8));
  if (wa > 0) {
    const y = 300 - 16 * wa;
    softGlow(ctx, 960, y, 220, PAL.meGlow, 0.18 * wa);
    drawText(ctx, '等', 960 - 46, y, 72, PAL.meGlow, { alpha: wa, weight: 800, family: FONT_CN });
    drawText(ctx, '待', 960 + 46, y, 72, PAL.meGlow, { alpha: wa, weight: 800, family: FONT_CN });
  }
  veil(ctx, '#0b0d2c', 1 - prog(t, 246, 246.7));   // 从 S8 末尾的夜色淡入
  // 最后 2 秒：淡出黑场，正中留下小号片名；256.4 秒后完全静止（黑幕不透明，片名不透明）
  veil(ctx, '#000000', prog(t, S9_BLACK0, S9_BLACK1, easeInOutSine));
  const ta = prog(t, 255.5, 256.4, easeOutCubic);
  if (ta > 0) {
    drawText(ctx, S0_TITLE, 960, 530, 54, PAL.cream, { alpha: ta, weight: 800, family: FONT_CN, shadow: false });
    ctx.globalAlpha = ta; fillRoundRect(ctx, 960 - 120 * ta, 580, 240 * ta, 4, 2, PAL.me); ctx.globalAlpha = 1;
  }
}
SCENE_IMPL.S9 = { draw: function (ctx, t) { drawS9(ctx, t); } };
