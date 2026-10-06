'use strict';
// =====================================================================
// scenes_c1.js — S6 主歌二 中段（2:27–2:42）
//   147–151 「从天堂掉落到深渊」：俯视下坠，镜头螺旋旋转，隧道环越来越暗，深度读数飞涨（比 S2 更深更暗）
//   151–154 「多无奈」：“我”落在巨大空旷的黑色空间里，镜头拉远直到“我”极小
//   154–158 「我愿意改变 (what can I do?)」：快速换几何配饰（眼镜 / 礼帽 / 领结 / 派对帽 / 全套），每次弹出
//   158–162 「重新再来一遍 (just give me change)」：磁带快速倒带，磁带轮逆转，VHS 色差
// =====================================================================

// ---- 147–151 螺旋下坠 ----
const S6E_CX = 960, S6E_CY = 470;
function s6Spiral(ctx, t) {
  const lt = t - 147, k = prog(t, 147, 151), dark = smoothstep(0, 0.65, k);
  const g = ctx.createRadialGradient(S6E_CX, S6E_CY, 0, S6E_CX, S6E_CY, 1200);
  g.addColorStop(0, mixColor('#3a2f8a', '#000000', dark));
  g.addColorStop(0.45, mixColor('#8a80e0', '#07060f', dark));
  g.addColorStop(1, mixColor('#d8d2ff', '#151233', dark));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 镜头旋转角：越往下转得越快（角速度线性增加）
  const rot = 0.9 * lt + 0.35 * lt * lt, fall = 0.55 * lt + 0.12 * lt * lt;
  const ringCol = mixColor(S6_ICE, '#4a3f9a', k);
  ctx.lineJoin = 'round';
  for (let i = 0; i < 16; i++) {
    const z = fract(i / 16 + fall), r = 26 * Math.pow(50, z);
    ctx.save(); ctx.translate(S6E_CX, S6E_CY); ctx.rotate(rot + z * 2.6);
    regularPolyPath(ctx, 0, 0, r, 6, 0);
    ctx.lineWidth = 2 + r * 0.025; ctx.strokeStyle = rgba(ringCol, clamp01(z * 3) * (0.55 - 0.25 * k));
    ctx.stroke();
    ctx.restore();
  }
  // 径向速度线 + 微光（向外飞 = 我们在向下坠）
  for (let i = 0; i < 44; i++) {
    const z = fract(hash01(i, 641) + lt * (1.0 + 0.6 * k)), a = hash01(i, 642) * TAU + rot * 0.7;
    const r1 = 50 * Math.pow(26, z), r2 = r1 * (1.18 + 0.2 * k);
    const ca = Math.cos(a), sa = Math.sin(a);
    line(ctx, S6E_CX + ca * r1, S6E_CY + sa * r1, S6E_CX + ca * r2, S6E_CY + sa * r2, 1.5 + z * 4,
      rgba(i % 3 ? S6_ICE : PAL.meGlow, 0.5 * z * (1 - 0.5 * k)));
  }
  // “我”：在画面中央随镜头一起旋转，越来越小（越来越深）
  const mr = lerp(74, 42, easeInQuad(k));
  softGlow(ctx, S6E_CX, S6E_CY, mr * 3.2, PAL.meGlow, 0.45);
  ctx.save(); ctx.translate(S6E_CX, S6E_CY); ctx.rotate(rot * 1.15);
  drawMe(ctx, 0, 0, { t: t, r: mr, look: Math.sin(t * 4) * 0.4, lookY: -0.7, shadow: false, glow: 0.3,
    hands: [{ a: -2.4, len: 0.6 }, { a: -0.7, len: 0.6 }], squash: 1 + 0.05 * Math.sin(t * 9) });
  ctx.restore();
  // 深度读数（右上）与竖向刻度
  const depth = Math.round(9999 * easeInCubic(k));
  fillRoundRect(ctx, 1500, 80, 320, 96, 18, 'rgba(7,7,15,0.55)');
  drawText(ctx, 'DEPTH', 1530, 108, 22, S6_ICE, { align: 'left', family: FONT_EN, weight: 700, shadow: false });
  drawText(ctx, '-' + depth + 'm', 1795, 140, 46, depth > 5000 ? PAL.heart : PAL.cream, { align: 'right', family: FONT_EN, weight: 800, shadow: false });
  line(ctx, 1790, 220, 1790, 760, 4, 'rgba(188,208,255,0.35)');
  for (let j = 0; j <= 9; j++) line(ctx, 1772, 220 + j * 60, 1790, 220 + j * 60, 3, 'rgba(188,208,255,0.35)');
  const py = lerp(220, 760, easeInCubic(k));
  ctx.beginPath(); ctx.moveTo(1784, py); ctx.lineTo(1760, py - 12); ctx.lineTo(1760, py + 12); ctx.closePath();
  ctx.fillStyle = PAL.me; ctx.fill();
  veil(ctx, '#ffffff', 0.7 * (1 - prog(t, 147, 147.25)));   // 硬切进来时的白闪
}

// ---- 151–154 巨大黑色空间里的小小“我” ----
function s6Tiny(ctx, t) {
  fillSky(ctx, '#020206', '#05050c');
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.22 * starTwinkle(t, i);
    circle(ctx, hash01(i, 651) * W, hash01(i, 652) * 620, 1 + hash01(i, 653) * 1.3, S6_ICE);
  }
  ctx.globalAlpha = 1;
  const z = lerp(1, 0.2, prog(t, 151.3, 153.6, easeInOutCubic)), land = t - 151;
  withCamera(ctx, 960, 560, z, 0, function () {
    ctx.fillStyle = '#07070f'; ctx.fillRect(-6000, 620, 14000, 3200);
    ctx.fillStyle = 'rgba(138,123,255,0.22)'; ctx.fillRect(-6000, 620, 14000, 3 / z);
    softGlow(ctx, 960, 580, 240, S6_COLD, 0.16);
    // 落地灰尘
    if (land < 0.7) {
      const kk = land / 0.7;
      for (let i = 0; i < 6; i++) {
        const side = i < 3 ? -1 : 1, j = i % 3;
        ctx.globalAlpha = 0.5 * (1 - kk);
        circle(ctx, 960 + side * (60 + kk * (90 + j * 40)), 612 - Math.sin(kk * PI) * 10 * (j + 1), (12 - j * 2) * (1 - kk * 0.5), '#2a2a48');
      }
      ctx.globalAlpha = 1;
    }
    const sq = 1 + 0.45 * Math.exp(-7 * land) * Math.cos(land * 16);
    drawMe(ctx, 960, 560, { t: t, r: 60, squash: sq, mood: land > 0.5 ? 'sad' : undefined, look: -0.1, lookY: 0.5,
      glow: 0.22, groundY: 620 });
    // 头顶小乌云 + 雨
    const cs = easeOutBack(prog(t, 151.6, 152.0), 2);
    if (cs > 0) {
      drawCloud(ctx, 960 + Math.sin(t * 1.3) * 6, 405, 55 * cs, '#3a3d5a');
      for (let i = 0; i < 7; i++) {
        const ph = fract(t * 1.8 + hash01(i, 654)), x = 924 + i * 12, y = lerp(430, 496, ph);
        line(ctx, x, y, x, y + 12, 3, rgba(PAL.skyBlue, 0.7 * cs));
      }
    }
  });
  const g = ctx.createRadialGradient(960, 540, 300, 960, 540, 1100);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---- 154–158 换配饰 ----
const S6G_SW = [154.5, 155.2, 155.9, 156.6, 157.3];
const S6G_SET = [['glasses'], ['top'], ['bow'], ['party', 'glasses'], ['top', 'glasses', 'bow']];
const S6G_COL = [S6_COLD, PAL.you, PAL.heart, '#ffc94a', PAL.me];
const S6G_INK = '#1b1d33';
function s6Glasses(ctx, x, y, r, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let side = -1; side <= 1; side += 2) {
    circle(ctx, side * r * 0.34, 0, r * 0.25, 'rgba(191,227,255,0.3)');
    ring(ctx, side * r * 0.34, 0, r * 0.25, r * 0.07, S6G_INK);
    line(ctx, side * r * 0.59, -r * 0.04, side * r * 0.86, -r * 0.1, r * 0.05, S6G_INK);
  }
  line(ctx, -r * 0.1, -r * 0.02, r * 0.1, -r * 0.02, r * 0.06, S6G_INK);
  ctx.restore();
}
function s6TopHat(ctx, x, y, r, s, rot) {
  ctx.save(); ctx.translate(x, y + r * 0.12); ctx.rotate(rot); ctx.scale(s, s);
  fillRoundRect(ctx, -r * 0.48, -r * 0.95, r * 0.96, r * 0.95, r * 0.08, S6G_INK);
  ctx.fillStyle = PAL.heart; ctx.fillRect(-r * 0.48, -r * 0.3, r * 0.96, r * 0.16);
  fillRoundRect(ctx, -r * 0.8, -r * 0.06, r * 1.6, r * 0.16, r * 0.08, S6G_INK);
  ctx.restore();
}
function s6Bow(ctx, x, y, r, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(side * r * 0.4, -r * 0.22); ctx.lineTo(side * r * 0.4, r * 0.22); ctx.closePath();
    ctx.fillStyle = PAL.heart; ctx.fill(); ctx.lineWidth = r * 0.04; ctx.strokeStyle = '#a8264f'; ctx.stroke();
  }
  circle(ctx, 0, 0, r * 0.09, '#a8264f');
  ctx.restore();
}
function s6PartyHat(ctx, x, y, r, s) {
  ctx.save(); ctx.translate(x, y + r * 0.1); ctx.rotate(0.22); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-r * 0.36, 0); ctx.lineTo(0, -r * 1.05); ctx.lineTo(r * 0.36, 0); ctx.closePath();
  ctx.fillStyle = '#ffc94a'; ctx.fill();
  ctx.save(); ctx.clip();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = PAL.you; ctx.fillRect(-r, -r * (0.18 + i * 0.26), r * 2, r * 0.09); }
  ctx.restore();
  circle(ctx, 0, -r * 1.07, r * 0.12, PAL.cream);
  ctx.restore();
}
function s6Gear(ctx, t) {
  let idx = -1;
  for (let i = 0; i < S6G_SW.length; i++) if (t >= S6G_SW[i]) idx = i;
  const col = idx >= 0 ? S6G_COL[idx] : S6_COLD, ts = idx >= 0 ? S6G_SW[idx] : 154, since = t - ts, beat = beatPulse(t);
  fillSky(ctx, '#17134a', '#0b0a22');
  ctx.save(); ctx.globalAlpha = 0.08;
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * TAU + t * 0.35;
    ctx.beginPath(); ctx.moveTo(960, 520);
    ctx.lineTo(960 + Math.cos(a - 0.1) * 1400, 520 + Math.sin(a - 0.1) * 1400);
    ctx.lineTo(960 + Math.cos(a + 0.1) * 1400, 520 + Math.sin(a + 0.1) * 1400);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  ctx.restore();
  drawBokeh(ctx, t, { count: 26, seed: 661, color: col, alpha: 0.1, pulse: beat * 0.6, speed: 1.4 });
  const gy = 650, r = 115;
  ctx.beginPath(); ctx.ellipse(960, gy, 260, 46, 0, 0, TAU); ctx.fillStyle = rgba(col, 0.22); ctx.fill();
  // 换装瞬间的爆环 + 彩点
  if (idx >= 0 && since < 0.6) {
    const kk = since / 0.6;
    ring(ctx, 960, gy - r, r * 1.2 + kk * 240, 10 * (1 - kk), rgba(col, 1 - kk));
    for (let j = 0; j < 12; j++) {
      const a = j / 12 * TAU + idx, d = r * 1.1 + easeOutCubic(kk) * 260;
      circle(ctx, 960 + Math.cos(a) * d, gy - r + Math.sin(a) * d, 9 * (1 - kk), j % 2 ? col : PAL.cream);
    }
  }
  const sq = 1 + (idx >= 0 ? 0.22 * Math.exp(-since * 9) * Math.cos(since * 20) : 0.03 * beat);
  const happy = idx === 4 && since > 0.3;
  drawMe(ctx, 960, gy - r, { t: t, r: r, squash: sq, look: Math.sin(t * 1.7) * 0.3, lookY: -0.1, glow: 0.55,
    groundY: gy, mood: happy ? 'happy' : undefined, blink: happy ? 0 : undefined });
  if (idx < 0) return;
  // 配饰锚点（考虑以脚底为锚点的挤压：竖直方向 1/sq）
  const sy = 1 / sq, cy = gy - r * sy, top = gy - 2 * r * sy, pop = easeOutElastic(clamp01(since / 0.6));
  const set = S6G_SET[idx];
  for (let i = 0; i < set.length; i++) {
    const s = pop;
    if (set[i] === 'glasses') s6Glasses(ctx, 960, cy - r * 0.12 * sy, r, s);
    else if (set[i] === 'top') s6TopHat(ctx, 960, top, r, s, -0.1 + Math.sin(t * 2) * 0.04);
    else if (set[i] === 'bow') s6Bow(ctx, 960, cy + r * 0.66 * sy, r, s);
    else if (set[i] === 'party') s6PartyHat(ctx, 960, top, r, s);
  }
}

// ---- 158–162 磁带倒带 ----
function s6Reel(ctx, x, y, pack, ang) {
  circle(ctx, x, y, pack, '#4a2e22');
  ring(ctx, x, y, pack - 4, 2, 'rgba(255,255,255,0.12)');
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  // 高速旋转的残影扇区
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, pack - 6, 0, 1.1); ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
  circle(ctx, 0, 0, 42, PAL.cream);
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate(i / 6 * TAU); ctx.fillStyle = S6_DEEP; ctx.fillRect(-5, -28, 10, 14); ctx.restore();
  }
  circle(ctx, 0, 0, 13, S6_DEEP);
  ctx.restore();
}
function s6Tape(ctx, t) {
  const lt = t - 158, k = prog(t, 158.2, 161.8, easeInOutSine), fr = Math.floor(t * 30);
  fillSky(ctx, S6_DEEP, '#06050f');
  // 倒带速度线（向左飞）
  for (let i = 0; i < 30; i++) {
    const sp = 2400 * (0.6 + hash01(i, 671)), span = W + 600;
    const x = ((hash01(i, 672) * span - lt * sp) % span + span) % span - 300, y = hash01(i, 673) * H;
    line(ctx, x, y, x + 160 + hash01(i, 674) * 160, y, 3, rgba(S6_ICE, 0.16));
  }
  ctx.save();
  ctx.translate(960 + Math.sin(t * 30) * 2, 440); ctx.rotate(-0.03 + Math.sin(t * 23) * 0.004);
  fillRoundRect(ctx, -404, -240, 840, 520, 36, 'rgba(0,0,0,0.45)');
  fillRoundRect(ctx, -420, -260, 840, 520, 36, '#2a2560');
  fillRoundRect(ctx, -370, -225, 740, 150, 18, PAL.cream);
  ctx.save(); roundRectPath(ctx, -370, -225, 740, 150, 18); ctx.clip();
  ctx.fillStyle = PAL.me; ctx.fillRect(-370, -225, 740, 34); ctx.restore();
  drawText(ctx, 'SIDE B', -340, -130, 46, PAL.indigo, { align: 'left', family: FONT_EN, weight: 900, shadow: false });
  drawText(ctx, '◀◀  x16', 340, -130, 40, PAL.me, { align: 'right', family: FONT_EN, weight: 800, shadow: false });
  // 窗口 + 磁带轮：倒带 = 磁带从右轮卷回左轮，两轮逆时针飞转
  const win = [-330, -55, 660, 225];
  fillRoundRect(ctx, win[0], win[1], win[2], win[3], 40, '#0d0b22');
  const rl = lerp(62, 108, k), rr = lerp(108, 62, k), ang = -(lt * 22 + lt * lt * 2);
  ctx.save(); roundRectPath(ctx, win[0], win[1], win[2], win[3], 40); ctx.clip();
  s6Reel(ctx, -165, 58, rl, ang);
  s6Reel(ctx, 165, 58, rr, ang * rl / rr * 0.6);
  line(ctx, -165, 58 + rl, 165, 58 + rr, 4, '#4a2e22');
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-230, 260); ctx.lineTo(-190, 178); ctx.lineTo(190, 178); ctx.lineTo(230, 260); ctx.closePath();
  ctx.fillStyle = '#221e50'; ctx.fill();
  for (let i = -1; i <= 1; i += 2) circle(ctx, i * 120, 222, 14, S6_DEEP);
  for (let i = 0; i < 4; i++) circle(ctx, (i % 2 ? 1 : -1) * 385, (i < 2 ? -1 : 1) * 225, 9, '#4a4590');
  ctx.restore();
  // VHS 叠层：色差 → 噪声带 → 扫描线 → 噪点 → HUD
  const burst = Math.max(env(t, 158, 158.3, 0.02, 0.2), env(t, 160.4, 160.65, 0.03, 0.15));
  rgbShift(ctx, 5 + 4 * hash01(fr, 675) + 22 * burst);
  vhsBands(ctx, t, burst);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
  for (let i = 0; i < 60 + burst * 120; i++) {
    ctx.fillStyle = rgba('#ffffff', 0.12 + 0.3 * hash01(fr * 131 + i, 676));
    ctx.fillRect(hash01(fr * 97 + i, 677) * W, hash01(fr * 89 + i, 678) * H, 2 + hash01(i, 679) * 10, 2);
  }
  if (fract(t * 1.6) < 0.68) drawText(ctx, '◀◀ REWIND', SAFE.x + 20, SAFE.y + 50, 56, '#ffffff', { align: 'left', family: FONT_EN, weight: 800 });
  const cnt = Math.max(0, Math.floor(lerp(2140, 0, k)));
  drawText(ctx, 'COUNTER ' + ('000' + cnt).slice(-4), SAFE.r - 20, SAFE.y + 50, 40, '#ffffff', { align: 'right', family: FONT_EN, weight: 700 });
}
