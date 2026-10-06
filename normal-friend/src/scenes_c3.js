'use strict';
// =====================================================================
// scenes_c3.js — S7 副歌二（2:58–3:35）+ 登记 SCENE_IMPL.S7
// 结构与 S4 相同：直接复用 S4 各段的绘制函数（scenes_b*.js），给时间加偏移：
//   178–182 → S4 85–89（偏移 93）；182–211 → S4 90–119（偏移 92，正好 138 拍，节拍相位一致）
// 视觉强化（全部用真实时间 t 计算）：
//   · 更多粒子：额外一层散景 + 每拍迸发的彩色纸屑
//   · 强拍（每小节第一拍）短暂反色闪帧，持续 < 0.03 秒（60fps 下 ≤ 2 帧）
//   · 轻微镜头震动（随拍衰减），画面放大 2.5% 以免露出黑边
// 新增最后一段 211–215「我不能不能做 耶」：“耶”巨大，放射光线 + 彩色纸屑爆发，“我”变大发光。
// =====================================================================
const S7_OFF = 92, S7_OFF0 = 93;
const S7_CUTS = [182, 187, 192, 195, 200, 205, 207, 211];   // 段落边界（附近不做反色闪帧）

function s7Base(ctx, t) {
  const t4 = t - S7_OFF;
  if (t < 182) s4Bubble(ctx, t - S7_OFF0);
  else if (t < 185) s4BadgeScene(ctx, t4);
  else if (t < 187) s4Spot(ctx, t4);
  else if (t < 192) s4Chest(ctx, t4);
  else if (t < 195) s4NotLover(ctx, t4);
  else if (t < 200) s4Letter(ctx, t4);
  else if (t < 205) s4Boomerang(ctx, t4);
  else if (t < 207) s4SoI(ctx, t4);
  else if (t < 211) s4Peel(ctx, t4);
  else s7Yeah(ctx, t);
}
function s7Quiet(t) { return (t >= 185 && t < 187) || (t >= 205 && t < 207); }   // 暗场聚光段，强化减弱
// 镜头震动：轻微常驻抖动 + 每拍衰减
function s7Cam(ctx, t) {
  const a = 2 + 6 * beatPulse(t, 7);
  ctx.translate(960 + Math.sin(t * 67) * a, 540 + Math.cos(t * 53) * a);
  ctx.scale(1.025, 1.025);
  ctx.translate(-960, -540);
}
// 额外粒子：散景 + 每拍从画面上方迸出的纸屑
const S7_CONF = [PAL.me, PAL.heart, PAL.you, PAL.meGlow, PAL.cream];
function s7Particles(ctx, t) {
  const beat = beatPulse(t), q = s7Quiet(t) ? 0.35 : 1;
  // 178–182 画面大部分是奶油色气泡，叠加散景会变成白斑，只保留纸屑
  if (t >= 182) drawBokeh(ctx, t, { count: 40, seed: 701, color: PAL.heart, alpha: 0.12 * q, pulse: beat * 1.6, speed: 2.2, maxR: 30 });
  const b0 = beatIndex(t);
  for (let k = 0; k < 3; k++) {
    const b = b0 - k, tb = beatTime(b), age = t - tb;
    if (tb < 178 || age > 1.8) continue;
    for (let i = 0; i < 12; i++) {
      const id = b * 31 + i, x0 = hash01(id, 702) * W, vx = (hash01(id, 703) - 0.5) * 300;
      const x = x0 + vx * age, y = -20 + (120 + 260 * hash01(id, 704)) * age + 180 * age * age;
      if (y > H + 20) continue;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(age * (4 + 6 * hash01(id, 705)) + id);
      ctx.globalAlpha = 0.75 * q * (1 - age / 1.8);
      ctx.fillStyle = S7_CONF[i % 5]; ctx.fillRect(-8, -4, 16, 8);
      ctx.restore();
    }
  }
}
// 强拍反色闪帧（≤ 2 帧）
function s7Flash(ctx, t) {
  if (s7Quiet(t) || beatIndex(t) % 4 !== 0) return;
  if (beatPhase(t) * 60 / BPM >= 0.03) return;
  for (let i = 0; i < S7_CUTS.length; i++) if (Math.abs(t - S7_CUTS[i]) < 0.08) return;
  ctx.save();
  ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ---- 211–215 「我不能不能做 耶」 ----
const S7_YX = 1330, S7_YY = 520, S7_YEAH = 212.5, S7_ME_X = 540;
const S7_RAYS = [PAL.me, PAL.heart, PAL.meGlow];
function s7Yeah(ctx, t) {
  const since = t - S7_YEAH, on = since > 0, beat = beatPulse(t), ex = on ? Math.exp(-since * 2) : 0;
  fillSky(ctx, mixColor('#1d1240', '#4a1238', on ? 0.55 + 0.45 * ex : 0), '#0d0a24');
  const ra = on ? 0.16 + 0.26 * Math.exp(-since * 3) + 0.08 * beat : 0.05;
  ctx.save(); ctx.translate(S7_YX, S7_YY); ctx.rotate(t * 0.35);
  for (let i = 0; i < 20; i++) {
    ctx.rotate(TAU / 20);
    ctx.globalAlpha = clamp01(ra);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-80, -1800); ctx.lineTo(80, -1800); ctx.closePath();
    ctx.fillStyle = S7_RAYS[i % 3]; ctx.fill();
  }
  ctx.restore(); ctx.globalAlpha = 1;
  softGlow(ctx, S7_YX, S7_YY, 760, PAL.meGlow, 0.15 + (on ? 0.35 * Math.exp(-since * 1.5) : 0));
  drawBokeh(ctx, t, { count: 34, seed: 711, color: PAL.meGlow, alpha: 0.12, pulse: beat * 1.5, speed: 2 });
  s4Floor(ctx, t);
  // “我”：“耶”落下时弹性变大、发光
  const grow = easeOutElastic(prog(t, S7_YEAH, S7_YEAH + 0.9)), r = lerp(70, 150, grow), my = GROUND_Y - r;
  softGlow(ctx, S7_ME_X, my, r * 4, PAL.meGlow, 0.3 + 0.5 * grow);
  if (grow > 0) ring(ctx, S7_ME_X, my, r * 1.3 + beat * 24, 6, rgba(PAL.meGlow, 0.5 * clamp01(grow)));
  drawMe(ctx, S7_ME_X, my, { t: t, r: r, look: 0.6, lookY: -0.4, mood: since > 0.2 ? 'happy' : undefined,
    glow: 0.6 + 0.4 * clamp01(grow), groundY: GROUND_Y, squash: 1 + 0.08 * beat,
    hands: on ? [{ a: -PI * 0.8, len: 0.5 }, { a: -PI * 0.2, len: 0.5 }] : undefined });
  // 纸屑爆发：从“耶”中心向四周炸开，阻尼 + 重力
  if (on) {
    for (let i = 0; i < 90; i++) {
      const a = hash01(i, 712) * TAU, v = 600 + hash01(i, 713) * 1000, d = v * (1 - Math.exp(-2 * since)) / 2;
      const x = S7_YX + Math.cos(a) * d, y = S7_YY + Math.sin(a) * d + 160 * since * since;
      if (y > H + 30) continue;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(since * (5 + 8 * hash01(i, 714)) + i);
      ctx.scale(1, Math.cos(since * 9 + i));
      ctx.globalAlpha = 1 - prog(since, 2.0, 2.5);
      ctx.fillStyle = S7_CONF[i % 5]; ctx.fillRect(-10, -5, 20, 10);
      ctx.restore();
    }
  }
}
// 歌词层：“我不能不能做”在上方逐字弹出；“耶”巨大，从 3 倍砸下 + 抖动（同一句歌词，逐字原样）
function s7YeahLyric(ctx, t, tl, L) {
  const lt = tl - L.start, dur = L.end - L.start, beat = beatPulse(t);
  const iy = L.text.indexOf('耶'), head = L.text.slice(0, iy).replace(/\s+$/, '');
  const ex = prog(lt, dur - 0.35, dur, easeInCubic);
  const P = prepText(head), Lo = layoutChars(ctx, P, 112, W * 0.8, 900, FONT_MIX);
  let x = 960 - Lo.total / 2;
  for (let i = 0; i < P.chars.length; i++) {
    const w = Lo.ws[i], cx = x + w / 2; x += w;
    const k = clamp01((lt - 0.1 - i * 0.12) / 0.4);
    if (k <= 0) continue;
    const hc = P.hl[i], sc = easeOutBack(k, 2.2) * (hc ? 1.08 + 0.06 * beat : 1) * (1 + 0.2 * ex);
    drawGlyph(ctx, P.chars[i], cx, 175, sc, 0, clamp01(k * 3) * (1 - ex), hc || PAL.cream, Lo.font, Lo.size, false);
  }
  const ky = clamp01((lt - (S7_YEAH - L.start)) / 0.2);
  if (ky <= 0) return;
  const since = lt - (S7_YEAH - L.start), sh = since > 0 ? Math.exp(-since * 8) * 22 + 4 * beat : 0;
  const S = 400, sc = lerp(3, 1, easeOutCubic(ky)) * (1 + 0.06 * beat) * (1 + 0.25 * ex);
  s4LongGlyph(ctx, '耶', S7_YX + Math.sin(t * 61) * sh, S7_YY + Math.cos(t * 53) * sh, sc, (1 - ky) * -0.3,
    clamp01(ky * 2.5) * (1 - ex), PAL.me, fontStr(S, 900, FONT_CN), S, true);
}

// ---- 歌词分派（S7 自己绘制歌词） ----
const S7_LYRIC_FX = {
  'I only want to be your friend': function (ctx, t, tl, L) {
    s4BubbleWords(ctx, t - S7_OFF0, tl - S7_OFF0, { start: L.start - S7_OFF0, end: L.end - S7_OFF0, text: L.text });
  },
  '不是情人': function (ctx, t, tl, L) { drawHeroLine(ctx, t, tl, L, S4E_LAY); s4Strike(ctx, t, tl, L); },
  '但我给你的爱暂时收不回来': s4StretchLyric,
  'So I': function (ctx, t, tl, L) { drawHeroLine(ctx, t, tl, L, { x: 960, y: 300, size: 180 }); },
  '我不能只是做 你的 friend': function (ctx, t, tl, L) { drawHeroLine(ctx, t, tl, L, { x: 960, y: 235, size: 130, maxW: 1500 }); },
  '我不能不能做 耶': s7YeahLyric
};
function s7Lyrics(ctx, t, sc) {
  const L = findLyric(t);
  if (!L) return;
  const tl = t - LYRIC_OFFSET, fx = S7_LYRIC_FX[L.text];
  ctx.save();
  if (fx) fx(ctx, t, tl, L);
  else if (L.hero) drawHeroLine(ctx, t, tl, L, null);
  else drawBottomLyric(ctx, t, tl, L, sc);
  ctx.restore();
}

function drawS7(ctx, t, sc) {
  ctx.save();
  s7Cam(ctx, t);
  s7Base(ctx, t);
  s7Particles(ctx, t);
  ctx.restore();
  s4Trans(ctx, t, 182, PAL.you);
  s4Trans(ctx, t, 187, PAL.indigo);
  s4Trans(ctx, t, 192, PAL.heart);
  s4Trans(ctx, t, 195, PAL.meGlow);
  s4Trans(ctx, t, 200, PAL.indigo);
  s4Trans(ctx, t, 211, PAL.me);
  s4Trans(ctx, t, 215, PAL.me);   // 只有盖住的前半段在 S7 内，揭示的后半段在 S8
  if (t < 205 || t >= 207) s4Vignette(ctx, t, 1.2);
  s7Flash(ctx, t);
  // 歌词也跟随镜头震动（气泡里的逐词文字必须与气泡同一变换）
  ctx.save();
  s7Cam(ctx, t);
  s7Lyrics(ctx, t, sc);
  ctx.restore();
}
SCENE_IMPL.S7 = { ownsLyrics: true, draw: function (ctx, t, lt, sc) { drawS7(ctx, t, sc); } };
