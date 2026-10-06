'use strict';
// =====================================================================
// scenes_d1.js — S8 结尾 Hook：后五种版式（前五种的变体）、“我”和“你”的椭圆轨道、背景、
//                歌词分派，并登记 SCENE_IMPL.S8（ownsLyrics）。
//   轨道：两小节转一圈；240–245 秒线性减速，正好停在 θ = π（“我”在左、“你”在右），
//   244.3–245.3 秒落到地面并排站好，位置与 S9 开头一致。
// =====================================================================

// 6) 上下分屏（变体）：色板对调，上屏 “I don't wanna”，下屏 “be your”
function s8LayTB2(ctx, t, lt, a) {
  s8Row(ctx, t, lt, S8_YOUR.slice(0, 3), { x: 960, y: 270, size: 140, maxW: 1500, t0: 0.05, step: 0.16, alpha: a });
  s8Row(ctx, t, lt, S8_YOUR.slice(3), { x: 960, y: 820, size: 150, maxW: 1500, t0: 0.65, step: 0.3, alpha: a });
}
// 7) 左右分屏（变体）：左屏 “I don't wanna be”，右屏 “your friend”，friend 砸下并划双删除线
function s8LayLR2(ctx, t, lt, a, sl, fr) {
  s8Row(ctx, t, lt, S8_YOUR.slice(0, 4), { x: 480, y: 420, size: 100, maxW: 720, t0: 0.05, step: 0.2, alpha: a });
  const b = s8Row(ctx, t, lt, [{ s: 'your' }, { s: 'friend', c: PAL.you, slam: true, at: sl }],
    { x: 1440, y: 420, size: 120, maxW: 720, t0: 0.85, step: 0.2, alpha: a });
  s8Strike(ctx, b[1], lt, sl + 0.3, fr, a);
}
// 8) 竖向堆叠（重复堆叠的变体）：每个词一行，像积木一样逐个砸下叠成一列
const S8_TOWER_C = [PAL.cream, PAL.me, PAL.cream, PAL.you, PAL.heart];
function s8LayTower(ctx, t, lt, a) {
  for (let i = 0; i < S8_YOUR.length; i++) {
    s8Row(ctx, t, lt, [{ s: S8_YOUR[i].s, c: S8_TOWER_C[i], slam: true, at: 0.05 + i * 0.25 }],
      { x: 480, y: 170 + i * 130, size: 120, maxW: 720, alpha: a });
  }
}
// 9) 环形（变体）：完整句反向快转，friend 砸下后被大叉 + 弧形删除线划掉
const S8_RING2 = "I don't wanna be your friend • ";
function s8LayRing2(ctx, t, lt, a, sl, fr) {
  const o = { cx: 960, cy: 520, R: 280, spin: -1.9, fi: S8_RING2.indexOf('friend'), sl: sl, maxSize: 92 };
  const info = s8RingText(ctx, t, lt, a, S8_RING2, o);
  const ts = sl + 0.3, k = prog(lt, ts, ts + 0.25, easeOutCubic), k2 = prog(lt, ts + 0.12, ts + 0.36, easeOutCubic);
  if (k <= 0 || a <= 0) return;
  ctx.globalAlpha = clamp01(a);
  ctx.beginPath(); ctx.arc(o.cx, o.cy, o.R, info.a1 - 0.03, lerp(info.a1 - 0.03, info.a2 + 0.03, k));
  ctx.lineWidth = info.size * 0.13; ctx.strokeStyle = S4_RED; ctx.lineCap = 'round'; ctx.stroke();
  if (fr >= 4 && k2 > 0) {
    const am = (info.a1 + info.a2) / 2, hw = (info.a2 - info.a1) * o.R / 2 + 10, hh = info.size * 0.45;
    ctx.save();
    ctx.translate(o.cx + Math.cos(am) * o.R, o.cy + Math.sin(am) * o.R); ctx.rotate(am + PI / 2);
    s8StLine(ctx, -hw, -hh, hw, hh, info.size * 0.13, k2);
    s8StLine(ctx, -hw, hh, hw, -hh, info.size * 0.13, k2);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
// 10) 结尾：“I don't wanna be your” 跑马灯逐渐减速停在正中，“只是做你的朋友”落在下面
function s8LayFinal(ctx, t, lt, a) {
  const stop = easeOutCubic(prog(lt, 0, 3.2)), off = -1500 * (1 - stop), side = 1 - prog(lt, 2.4, 3.2);
  // 与 s8Marquee 一致：滑动中的副本裁剪在 5% 安全区内，不碰画框
  ctx.save();
  ctx.beginPath(); ctx.rect(SAFE.x, 290 - 110, SAFE.w, 220); ctx.clip();
  for (let r = -2; r <= 2; r++) {
    const aa = r === 0 ? a : a * side;
    if (aa <= 0.01) continue;
    s8Row(ctx, t, lt, S8_YOUR, { x: 960 + off + r * 1500, y: 290, size: 110, maxW: 1300, t0: -5, step: 0, alpha: aa });
  }
  ctx.restore();
  s8Row(ctx, t, lt, [{ s: '只是' }, { s: '做' }, { s: '你的' }, { s: '朋友', c: PAL.you }],
    { x: 960, y: 470, size: 130, maxW: 1500, gap: 0.04, t0: 1.8, step: 0.3, alpha: a });
}
const S8_LAY_FX = {
  splitLR: s8LayLR, splitTB: s8LayTB, stack: s8LayStack, ring: s8LayRing, marquee: s8LayMarquee,
  splitTB2: s8LayTB2, splitLR2: s8LayLR2, tower: s8LayTower, ring2: s8LayRing2, final: s8LayFinal
};

// ---- 椭圆轨道 ----
// rm/ru = “我”/“你”的半径；ring = 1 时“我”在中心（“你”绕着“我”转），文字环在两者之间
const S8_ORB = {
  splitLR: { cx: 960, cy: 740, rx: 260, ry: 55, rm: 52, ru: 66, ring: 0 },
  splitTB: { cx: 960, cy: 545, rx: 200, ry: 40, rm: 40, ru: 50, ring: 0 },
  stack: { cx: 960, cy: 755, rx: 300, ry: 60, rm: 52, ru: 66, ring: 0 },
  ring: { cx: 960, cy: 520, rx: 620, ry: 400, rm: 78, ru: 58, ring: 1 },
  marquee: { cx: 960, cy: 770, rx: 330, ry: 55, rm: 52, ru: 66, ring: 0 },
  splitTB2: { cx: 960, cy: 545, rx: 200, ry: 40, rm: 40, ru: 50, ring: 0 },
  splitLR2: { cx: 960, cy: 750, rx: 280, ry: 55, rm: 52, ru: 66, ring: 0 },
  tower: { cx: 1300, cy: 560, rx: 300, ry: 110, rm: 56, ru: 70, ring: 0 },
  ring2: { cx: 960, cy: 520, rx: 620, ry: 400, rm: 78, ru: 58, ring: 1 },
  final: { cx: 910, cy: 730, rx: 200, ry: 0, rm: 60, ru: 78, ring: 0 }
};
const S8_KEYS = ['cx', 'cy', 'rx', 'ry', 'rm', 'ru', 'ring'];
const S8_ORB_OUT = { cx: 0, cy: 0, rx: 0, ry: 0, rm: 0, ru: 0, ring: 0 };   // 复用的输出对象（每次完整覆盖）
function s8OrbAt(t) {
  const i = s8SegIdx(t), A = S8_ORB[S8_SEGS[i].lay], B = i > 0 ? S8_ORB[S8_SEGS[i - 1].lay] : A;
  const k = prog(t, S8_SEGS[i].t0, S8_SEGS[i].t0 + 0.45, easeInOutCubic);
  for (let j = 0; j < S8_KEYS.length; j++) S8_ORB_OUT[S8_KEYS[j]] = lerp(B[S8_KEYS[j]], A[S8_KEYS[j]], k);
  return S8_ORB_OUT;
}
const S8_OMEGA = TAU / (8 * 60 / BPM);       // 两小节一圈（按原曲时间）
const S8_END_YOU_X = 1110;                   // 结尾“你”站的位置（S9 开头沿用）
// 轨道角度：分镜 215–240 匀速，240–245 角速度线性减到 0，245 秒（分镜）时 θ = π。
// 角速度按原曲时间计算（songTime），所以 SYNC 压缩 Hook 段时转速仍是“两小节一圈”。
function s8Theta(t) {
  const u = clamp(t, 215, 245), s = songTime(u);
  const sA = songTime(215), sB = songTime(240), D = Math.max(0.001, songTime(245) - sB);
  const th0 = PI - S8_OMEGA * ((sB - sA) + D / 2);
  if (s <= sB) return th0 + S8_OMEGA * (s - sA);
  const v = s - sB;
  return th0 + S8_OMEGA * ((sB - sA) + v - v * v / (2 * D));
}
function s8Slow(t) { return 1 - prog(t, 242, 245.5); }
function s8Orbit(ctx, t) {
  const O = s8OrbAt(t), th = s8Theta(t), c = Math.cos(th), s = Math.sin(th), beat = beatPulse(t) * s8Slow(t);
  const st = prog(t, 244.3, 245.3, easeInOutCubic), mk = 1 - 0.94 * O.ring;
  let mx = O.cx + O.rx * c * mk, my = O.cy + O.ry * s * mk, ux = O.cx - O.rx * c, uy = O.cy - O.ry * s;
  // 轨道虚线（ring 模式下只是“你”的轨道）
  if (st < 1) {
    ctx.save();
    ctx.globalAlpha = 0.22 * (1 - st);
    ctx.setLineDash([14, 14]); ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); ctx.ellipse(O.cx, O.cy, Math.max(1, O.rx), Math.max(1, O.ry), 0, 0, TAU);
    ctx.lineWidth = 3; ctx.strokeStyle = PAL.cream; ctx.stroke();
    ctx.restore();
  }
  mx = lerp(mx, ME_X, st); my = lerp(my, GROUND_Y - O.rm, st);
  ux = lerp(ux, S8_END_YOU_X, st); uy = lerp(uy, GROUND_Y - O.ru, st);
  const ms = 1 + 0.12 * s * mk * (1 - st), us = 1 - 0.12 * s * (1 - st);
  const look = clamp((ux - mx) / 160, -1, 1), moving = 1 - st;
  const drawM = function () {
    for (let j = 3; j >= 1 && moving > 0.2; j--) {   // 运动残影
      const tj = th - j * 0.13 * s8Slow(t);
      circle(ctx, O.cx + O.rx * Math.cos(tj) * mk, O.cy + O.ry * Math.sin(tj) * mk, O.rm * ms * 0.8, rgba(PAL.me, 0.12 * (4 - j) / 3 * mk));
    }
    drawMe(ctx, mx, my, { t: t, r: O.rm * ms, look: look, lookY: -0.1, glow: 0.5 + 0.4 * beat, squash: 1 + 0.07 * beat,
      shadow: st > 0.5, groundY: GROUND_Y, mood: t > 245.4 ? 'happy' : undefined });
  };
  const drawU = function () {
    for (let j = 3; j >= 1 && moving > 0.2; j--) {
      const tj = th - j * 0.13 * s8Slow(t);
      circle(ctx, O.cx - O.rx * Math.cos(tj), O.cy - O.ry * Math.sin(tj), O.ru * us * 0.8, rgba(PAL.you, 0.12 * (4 - j) / 3));
    }
    drawYou(ctx, ux, uy, { t: t, r: O.ru * us, look: -look, lookY: -0.1, glow: 0.25 + 0.3 * beat, squash: 1 + 0.05 * beat,
      shadow: st > 0.5, groundY: GROUND_Y });
  };
  if (s * mk > 0) { drawU(); drawM(); } else { drawM(); drawU(); }
}

// ---- 背景：玫紫夜色 + 随拍脉冲（结尾减速时脉冲渐弱、地面淡入，衔接 S9 的街道） ----
function s8Backdrop(ctx, t, seg) {
  const sl = s8Slow(t), beat = beatPulse(t) * sl, O = s8OrbAt(t);
  fillSky(ctx, '#24123f', '#0b0d2c');
  softGlow(ctx, O.cx, O.cy, 900 + 120 * beat, PAL.heart, 0.08 + 0.16 * beat);
  drawBokeh(ctx, t, { count: 36, seed: 801, color: PAL.meGlow, alpha: 0.11, pulse: beat * 1.5, speed: 0.6 + 1.2 * sl });
  s8Panels(ctx, t, seg);
  drawBeatRipples(ctx, t, O.cx, O.cy, 215, 0.35 * sl, PAL.heart);
  const ga = prog(t, 243.6, 245.0);
  if (ga > 0) { ctx.globalAlpha = ga; drawGround(ctx, '#0f1329', '#2a3060'); ctx.globalAlpha = 1; }
  veil(ctx, PAL.heart, 0.06 * beat);
}
// friend 落拍的冲击强度（全局时间）
function s8Impact(t) {
  let s = 0;
  for (let i = 0; i < S8_SEGS.length; i++) {
    if (!S8_SEGS[i].fr) continue;
    const ts = S8_SEGS[i].t0 + LYRIC_OFFSET + s8SlamLt(S8_SEGS[i].t0), since = t - ts;
    if (since > 0 && since < 1.2) s += Math.exp(-since * 10);
  }
  return s;
}
function s8Lyrics(ctx, t, sc) {
  const L = findLyric(t);
  if (!L) return;
  const tl = t - LYRIC_OFFSET, lt = tl - L.start, dur = L.end - L.start;
  let seg = null;
  for (let i = 0; i < S8_SEGS.length; i++) if (S8_SEGS[i].t0 === L.start) seg = S8_SEGS[i];
  ctx.save();
  if (seg) S8_LAY_FX[seg.lay](ctx, t, lt, 1 - prog(lt, dur - 0.3, dur, easeInQuad), s8SlamLt(L.start), seg.fr);
  else if (L.hero) drawHeroLine(ctx, t, tl, L, null);
  else drawBottomLyric(ctx, t, tl, L, sc);
  ctx.restore();
}
function drawS8(ctx, t, sc) {
  const seg = S8_SEGS[s8SegIdx(t)], imp = s8Impact(t), sh = imp * 18 + 2 * beatPulse(t) * s8Slow(t);
  ctx.save();
  // 冲击抖动；同时略微放大，避免露出黑边
  ctx.translate(960 + Math.sin(t * 73) * sh, 540 + Math.cos(t * 61) * sh);
  const z = 1 + (sh + 1) * 0.0016; ctx.scale(z, z); ctx.translate(-960, -540);
  s8Backdrop(ctx, t, seg);
  s8Orbit(ctx, t);
  s8Lyrics(ctx, t, sc);
  ctx.restore();
  s4Vignette(ctx, t, 1.2 * s8Slow(t));
  veil(ctx, PAL.cream, 0.28 * Math.min(1, imp));   // friend 落拍闪白
  s4Trans(ctx, t, 215, PAL.me);                     // 揭示：S7 末尾的珊瑚色斜块向右离开
  veil(ctx, '#0b0d2c', prog(t, 245.4, 246, easeInQuad));   // 淡到夜色，S9 从同色淡入
}
SCENE_IMPL.S8 = { ownsLyrics: true, draw: function (ctx, t, lt, sc) { drawS8(ctx, t, sc); } };
