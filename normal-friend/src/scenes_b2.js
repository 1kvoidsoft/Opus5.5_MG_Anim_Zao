'use strict';
// =====================================================================
// scenes_b2.js — S4 副歌一 后段（1:53–2:06）+ 歌词分派 + 登记 SCENE_IMPL.S4
//   113–115 「So I」（大字）：硬切黑场，单束聚光，“我”胸口发出心跳光环（扑通-扑通）
//   115–119 「我不能只是be 你的朋友」（大字，抖动迸发）：“我”放大发抖、放射光芒，
//            胸前“朋友”徽章翘起、脱落、旋转着掉出画面
//   119–121 「（你说对不对）」：“我”冒出小气泡，气泡里的文字微微倾斜，“我”转头看向观众
//   121–126 「我不能只是做你的朋友」（大字）：全屏两行排版，“不能”珊瑚色放大并盖章抖动
// S4 由本场景自己绘制歌词（ownsLyrics），普通句仍调用 lyrics.js 的 drawBottomLyric / drawHeroLine。
// =====================================================================

// ---- 113–115 So I ----
// 心跳：每拍两下（间隔 0.2 秒），返回最近一下的冲击强度 0..1
function s4Heartbeat(t, t0) {
  const b0 = beatIndex(t);
  let hb = 0;
  for (let k = 0; k < 2; k++) {
    for (let d = 0; d < 2; d++) {
      const tb = beatTime(b0 - k, d * 0.2);
      if (tb < t0 || tb > t) continue;
      hb = Math.max(hb, Math.exp(-(t - tb) * 9) * (d ? 0.7 : 1));
    }
  }
  return hb;
}
function s4HeartRings(ctx, t, t0, x, y, a) {
  const b0 = beatIndex(t);
  for (let k = 0; k < 3; k++) {
    for (let d = 0; d < 2; d++) {
      const tb = beatTime(b0 - k, d * 0.2), age = t - tb;
      if (tb < t0 || age < 0 || age > 1.4) continue;
      const f = 1 - age / 1.4;
      ring(ctx, x, y, 40 + easeOutCubic(age / 1.4) * 520, 3 + 9 * f, rgba(PAL.heart, a * 0.8 * f * (d ? 0.6 : 1)));
    }
  }
}
function s4SoI(ctx, t) {
  fillSky(ctx, '#040409', '#0a0816');
  const r = 62, mx = 960, my = GROUND_Y - r, on = prog(t, 113.0, 113.1);
  ctx.fillStyle = '#08070f'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  drawSpotCone(ctx, t, mx, GROUND_Y, 120, 420, on, PAL.heaven);
  const c = meChest(mx, my, r, 1, 0);
  s4HeartRings(ctx, t, 113.0, c.x, c.y, on);
  const hb = s4Heartbeat(t, 113.0);
  drawMe(ctx, mx, my, { t: t, r: r, squash: 1 + 0.12 * hb, look: 0, lookY: -0.1, groundY: GROUND_Y, glow: 0.4 + 0.6 * hb });
  drawFriendBadge(ctx, c.x, meChest(mx, my, r, 1 + 0.12 * hb, 0).y, r * 0.4, 0, 0);
}

// ---- 115–121 徽章脱落 + 小气泡 ----
const S4I_DETACH = 116.9, S4I_R = 100;
function s4Peel(ctx, t) {
  const beat = beatPulse(t), burst = env(t, 115.0, 119.4, 0.3, 0.9);
  fillSky(ctx, mixColor('#040409', '#3a1240', burst * 0.9 + 0.25 * (t > 119 ? 1 : 0)), '#0a0816');
  const r = lerp(62, S4I_R, easeOutBack(prog(t, 115.0, 115.45), 1.8)), cx0 = 960, cy0 = GROUND_Y - r;
  // 放射光芒（迸发）
  if (burst > 0) {
    ctx.save(); ctx.translate(cx0, cy0); ctx.rotate(t * 0.4);
    for (let i = 0; i < 16; i++) {
      ctx.rotate(TAU / 16);
      ctx.globalAlpha = clamp01(0.16 * burst * (1 + 0.6 * beat));
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-70, -1300); ctx.lineTo(70, -1300); ctx.closePath();
      ctx.fillStyle = i % 2 ? PAL.me : PAL.heart; ctx.fill();
    }
    ctx.restore();
  }
  ctx.fillStyle = '#0c0a18'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  drawSpotCone(ctx, t, cx0, GROUND_Y, 120, 460, 1, PAL.heaven);
  // 迸发火花：每拍从“我”身边向外飞
  if (burst > 0) {
    const b0 = beatIndex(t);
    for (let k = 0; k < 2; k++) {
      const tb = beatTime(b0 - k), age = t - tb;
      if (tb < 115.0 || age > 1.2) continue;
      for (let i = 0; i < 14; i++) {
        const a = hash01(i + k * 31 + b0 * 7, 451) * TAU, sp = 300 + hash01(i, 452) * 500, d = r + sp * age;
        ctx.globalAlpha = burst * (1 - age / 1.2);
        drawSparkle(ctx, cx0 + Math.cos(a) * d, cy0 + Math.sin(a) * d * 0.8, 12 * (1 - age / 1.2) + 3, i % 2 ? PAL.meGlow : PAL.heart, burst * (1 - age / 1.2));
      }
    }
    ctx.globalAlpha = 1;
  }
  // “我”：发抖（I 段）→ 平静、先看气泡再转头看观众（J 段）
  const shake = t < 119 ? (0.4 + beat) * 7 * burst : 0;
  const mx = cx0 + Math.sin(t * 53) * shake, my = cy0 + Math.cos(t * 47) * shake * 0.5;
  const follow = env(t, S4I_DETACH, 118.4, 0.15, 0.5);
  const toBubble = env(t, 119.1, 120.0, 0.3, 0.25), turn = prog(t, 120.0, 120.3, easeOutBack);
  const hop = t > 120.0 ? Math.sin(prog(t, 120.0, 120.35) * PI) * 22 : 0;
  drawMe(ctx, mx, my - hop, { t: t, r: r, look: 0.35 * follow + 0.75 * toBubble, lookY: 0.85 * follow - 0.55 * toBubble - 0.05 * turn,
    groundY: GROUND_Y, glow: 0.5 + 0.4 * beat * burst, squash: 1 + 0.06 * beat * burst,
    blink: t > 119.95 && t < 120.08 ? 1 : undefined });
  // 徽章：115.8–116.9 翘起（颤动），之后脱落、旋转下坠出画面
  const c = meChest(mx, my - hop, r, 1, 0), br = r * 0.4;
  if (t < S4I_DETACH) {
    const p = prog(t, 115.8, S4I_DETACH, easeInQuad);
    drawFriendBadge(ctx, c.x, c.y, br, 0, p > 0 ? p * (0.85 + 0.15 * Math.sin(t * 34)) : 0);
  } else {
    const dt = t - S4I_DETACH, c0 = meChest(cx0, GROUND_Y - S4I_R, S4I_R, 1, 0);
    const bx = c0.x + 150 * dt, by = c0.y - 140 * dt + 1500 * dt * dt;
    if (by < H + 80) drawFriendBadge(ctx, bx, by, br, -dt * 5, 0.6 + 0.4 * Math.sin(dt * 14));
  }
}
// 歌词层：「（你说对不对）」画在“我”冒出的小气泡里，文字微倾
function s4BubbleLyric(ctx, t, tl, L) {
  const lt = tl - L.start, dur = L.end - L.start;
  const g = prog(lt, 0.05, 0.4), e = prog(lt, dur - 0.25, dur, easeInCubic);
  if (g <= 0 || e >= 1) return;
  const bx = 1090, by = 300, bw = 600, bh = 170, tipX = 1035, tipY = 600, sc = easeOutBack(g, 1.8) * (1 - e);
  ctx.save();
  ctx.translate(tipX, tipY); ctx.scale(sc, sc); ctx.translate(-tipX, -tipY);
  drawBubble(ctx, bx + 8, by + 10, bw, bh, tipX + 8, tipY + 10, { fill: 'rgba(7,7,15,0.35)', r: 70 });
  drawBubble(ctx, bx, by, bw, bh, tipX, tipY, { fill: PAL.cream, r: 70 });
  const P = prepText(L.text), Lo = layoutChars(ctx, P, 62, bw - 80, 800, FONT_MIX);
  ctx.translate(bx + bw / 2, by + bh / 2); ctx.rotate(-0.07);
  let x = -Lo.total / 2;
  for (let i = 0; i < P.chars.length; i++) {
    const w = Lo.ws[i], k = clamp01((lt - 0.25 - i * 0.06) / 0.35);
    if (k > 0) {
      drawGlyph(ctx, P.chars[i], x + w / 2, Math.sin(t * 3 + i * 0.8) * 3, easeOutBack(k, 2), 0, clamp01(k * 3),
        P.hl[i] || PAL.indigo, Lo.font, Lo.size, false);
    }
    x += w;
  }
  ctx.restore();
}

// ---- 121–126 全屏排版 ----
function s4Full(ctx, t) {
  const beat = beatPulse(t);
  fillSky(ctx, '#1d1240', '#0d0a24');
  // 斜向滚动色条
  ctx.save();
  ctx.globalAlpha = 0.07 + 0.07 * beat;
  ctx.fillStyle = PAL.me;
  const off = fract(t * 0.45) * 260;
  for (let i = -3; i < 12; i++) {
    const x = i * 260 + off;
    ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + 110, -10); ctx.lineTo(x - 190, H + 10); ctx.lineTo(x - 300, H + 10); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  softGlow(ctx, 960, 470, 950, PAL.me, 0.12 + 0.2 * beat);
  drawBokeh(ctx, t, { count: 40, seed: 17, color: PAL.meGlow, alpha: 0.12, pulse: beat * 1.5, speed: 2 });
}
// 长投影大字（多层偏移暗色 + 主色；可选奶油白描边）
function s4LongGlyph(ctx, ch, x, y, sc, rot, a, col, font, size, outline) {
  if (a <= 0.002 || sc <= 0.001) return;
  ctx.save();
  ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.globalAlpha = clamp01(a);
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0a0718';
  // 半透明（入场/退场）时不叠长投影，避免多层半透明字形叠出脏边
  if (a > 0.97) for (let k = 6; k >= 1; k--) ctx.fillText(ch, k * size * 0.012, k * size * 0.016);
  if (outline) { ctx.lineWidth = size * 0.05; ctx.strokeStyle = PAL.cream; ctx.lineJoin = 'round'; ctx.strokeText(ch, 0, 0); }
  ctx.fillStyle = col; ctx.fillText(ch, 0, 0);
  ctx.restore();
}
function s4FullType(ctx, t, tl, L) {
  const lt = tl - L.start, dur = L.end - L.start, beat = beatPulse(t);
  const P = prepText(L.text), n = P.chars.length;
  const split = L.text.indexOf('做') > 0 ? L.text.indexOf('做') : Math.ceil(n / 2);
  const i0 = L.text.indexOf('不能');
  const S = 210, font = fontStr(S, 900, FONT_MIX), big = 1.45, gap = S * 0.08;
  const rows = [[0, split, 360], [split, n, 655]];
  const ex = prog(lt, dur - 0.4, dur, easeInCubic);
  for (let r = 0; r < 2; r++) {
    const a0 = rows[r][0], a1 = rows[r][1], y = rows[r][2];
    let tot = 0;
    for (let i = a0; i < a1; i++) tot += measureW(ctx, P.chars[i], font) * (i >= i0 && i < i0 + 2 ? big : 1) + gap;
    tot -= gap;
    let x = 960 - tot / 2;
    for (let i = a0; i < a1; i++) {
      const isBig = i0 >= 0 && i >= i0 && i < i0 + 2, w = measureW(ctx, P.chars[i], font) * (isBig ? big : 1);
      const cx = x + w / 2; x += w + gap;
      let sc = (isBig ? big : 1) * (1 + 0.025 * beat), a = 1, dx = 0, dy = 0, rot = 0;
      if (isBig) {   // “不能”：从 3 倍大砸下 + 持续抖动
        const k = clamp01((lt - 0.55 - (i - i0) * 0.12) / 0.2);
        if (k <= 0) continue;
        sc *= lerp(3, 1, easeOutCubic(k)); a = clamp01(k * 2.5);
        dx = Math.sin(t * 41 + i * 2.1) * 4 * (0.4 + beat); dy = Math.cos(t * 37 + i) * 4 * (0.4 + beat);
      } else if (r === 0) {
        const k = clamp01((lt - (i - a0) * 0.1) / 0.55);
        if (k <= 0) continue;
        dy = -(1 - easeOutBounce(k)) * 420; a = clamp01(k * 3); rot = (1 - k) * (hash01(i, 461) - 0.5) * 0.8;
      } else {
        const k = clamp01((lt - 0.95 - (i - a0) * 0.09) / 0.5);
        if (k <= 0) continue;
        dy = (1 - easeOutBack(k, 1.8)) * 300; a = clamp01(k * 3);
      }
      // 退场：逐字放大冲出画面
      const e = clamp01(ex * 1.6 - (i / n) * 0.6);
      sc *= 1 + 1.2 * e; a *= 1 - e;
      s4LongGlyph(ctx, P.chars[i], cx + dx, y + dy, sc, rot, a, P.hl[i] || PAL.cream, font, S, isBig);
    }
  }
  // “不能”盖章时的冲击环
  drawImpact(ctx, 960, 360, lt - 0.75, 160, PAL.me);
}

// ---- 歌词分派（S4 自己绘制歌词；时间都用 tl = t - LYRIC_OFFSET） ----
const S4_LYRIC_FX = {
  'I only want to be your friend': s4BubbleWords,
  '不是情人': function (ctx, t, tl, L) { drawHeroLine(ctx, t, tl, L, S4E_LAY); s4Strike(ctx, t, tl, L); },
  '但我给你的爱暂时收不回来': s4StretchLyric,
  'So I': function (ctx, t, tl, L) { drawHeroLine(ctx, t, tl, L, { x: 960, y: 300, size: 180 }); },
  '我不能只是be 你的朋友': function (ctx, t, tl, L) { drawHeroLine(ctx, t, tl, L, { x: 960, y: 235, size: 130 }); },
  '（你说对不对）': s4BubbleLyric,
  '我不能只是做你的朋友': s4FullType
};
function s4Lyrics(ctx, t, sc) {
  const L = findLyric(t);
  if (!L) return;
  const tl = t - LYRIC_OFFSET, fx = S4_LYRIC_FX[L.text];
  ctx.save();
  if (fx) fx(ctx, t, tl, L);
  else if (L.hero) drawHeroLine(ctx, t, tl, L, null);
  else drawBottomLyric(ctx, t, tl, L, sc);
  ctx.restore();
}

function drawS4(ctx, t, sc) {
  ctx.save();
  if (t < 90) s4Bubble(ctx, t);
  else if (t < 93) s4BadgeScene(ctx, t);
  else if (t < 95) s4Spot(ctx, t);
  else if (t < 100) s4Chest(ctx, t);
  else if (t < 103) s4NotLover(ctx, t);
  else if (t < 108) s4Letter(ctx, t);
  else if (t < 113) s4Boomerang(ctx, t);
  else if (t < 115) s4SoI(ctx, t);
  else if (t < 121) s4Peel(ctx, t);
  else s4Full(ctx, t);
  ctx.restore();
  // 段落转场（113 为硬切黑场，115/119 为连续镜头，不加转场）
  s4Trans(ctx, t, 90, PAL.you);
  s4Trans(ctx, t, 95, PAL.indigo);
  s4Trans(ctx, t, 100, PAL.heart);
  s4Trans(ctx, t, 103, PAL.meGlow);
  s4Trans(ctx, t, 108, PAL.indigo);
  s4Trans(ctx, t, 121, PAL.me);
  s4Trans(ctx, t, 126, PAL.me);   // 只有盖住的前半段落在 S4 内，揭示的后半段在 S5
  if (t < 113 || t >= 115) s4Vignette(ctx, t, 1);
  s4Lyrics(ctx, t, sc);
}
SCENE_IMPL.S4 = { ownsLyrics: true, draw: function (ctx, t, lt, sc) { drawS4(ctx, t, sc); } };
