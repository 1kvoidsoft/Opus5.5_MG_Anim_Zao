'use strict';
// =====================================================================
// scenes_b1.js — S4 副歌一 中段（1:35–1:53）
//   95–100  「你心中只是just a friend」：镜头推进“你”胸口的爱心轮廓，里面是整齐相同的小圆格子
//            （像货架），“我”只是其中一格，挂上标签 “just a friend”
//   100–103 「不是情人」（大字）：“情人”被红色删除线划掉（s4Strike，歌词层），爱心图标被禁止斜线划过
//   103–108 「我感激你对我这样的坦白」：信封落下、打开，信纸抽出展开显示抽象文字线；“我”随拍点头，暖光
//   108–113 「但我给你的爱暂时收不回来」：“我”把爱心像回旋镖扔出画面，虚线画出“预期返回”路线，
//            爱心没回来，“我”伸手等；歌词里“收不回来”四字向远处拉伸变小（s4StretchLyric）
// =====================================================================

// ---- 95–100 胸口爱心货架 ----
const S4D_HX = 960, S4D_HY = 440, S4D_HS = 19, S4D_GAP = 54, S4D_CR = 20;
// 点是否在单位爱心多边形内（HEART_PTS，射线法；只在加载时用于生成格子表）
function s4InHeart(px, py) {
  let inside = false;
  for (let i = 0, j = HEART_N - 1; i < HEART_N; j = i++) {
    const xi = HEART_PTS[i * 2], yi = HEART_PTS[i * 2 + 1], xj = HEART_PTS[j * 2], yj = HEART_PTS[j * 2 + 1];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const S4D_CELLS = (function () {
  const out = [], m = (S4D_CR + 7) / S4D_HS;
  for (let row = -6; row <= 7; row++) {
    for (let col = -7; col <= 7; col++) {
      const wx = S4D_HX + col * S4D_GAP, wy = S4D_HY + 10 + row * S4D_GAP;
      const ux = (wx - S4D_HX) / S4D_HS, uy = (wy - S4D_HY) / S4D_HS;
      if (s4InHeart(ux, uy) && s4InHeart(ux - m, uy) && s4InHeart(ux + m, uy) && s4InHeart(ux, uy - m) && s4InHeart(ux, uy + m)) {
        out.push({ x: wx, y: wy, row: row });
      }
    }
  }
  return out;
})();
const S4D_ME = (function () {   // “我”所在的那一格：最接近 (1014, 504) 的格子
  let best = 0, bd = 1e9;
  for (let i = 0; i < S4D_CELLS.length; i++) {
    const d = Math.hypot(S4D_CELLS[i].x - 1014, S4D_CELLS[i].y - 504);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
})();
function s4Chest(ctx, t) {
  s4Backdrop(ctx, t, '#3a1f4a', '#161a38');
  s4Floor(ctx, t);
  const beat = beatPulse(t);
  // 镜头：0.13 倍（看到整个“你”）→ 1 倍（爱心填满画面），之后再缓慢推向“我”那一格
  const zk = prog(t, 95.0, 95.95, easeInOutCubic), z0 = 0.13, zb = z0 * Math.pow(1 / z0, zk);
  const k2 = prog(t, 96.7, 98.6, easeInOutCubic), me = S4D_CELLS[S4D_ME];
  const z = zb * (1 + 0.15 * k2), fx = lerp(S4D_HX, me.x, 0.3 * k2), fy = lerp(S4D_HY, me.y, 0.3 * k2);
  ctx.save();
  ctx.translate(960, lerp(650, 440, zk)); ctx.scale(z, z); ctx.translate(-fx, -fy);
  // “你”的身体（推近后眼睛等细节淡出，只剩青绿色铺满画面）
  circle(ctx, 960, 140, 1450, PAL.you);
  const eyeA = 1 - prog(zk, 0.25, 0.55);
  if (eyeA > 0) drawYou(ctx, 960, 140, { t: t, r: 1450, look: 0, lookY: 0.3, shadow: false, alpha: eyeA });
  // 胸口爱心：内部是整齐的格子货架
  const lw = 9 / Math.sqrt(z);
  ctx.save();
  heartShapePath(ctx, S4D_HX, S4D_HY, S4D_HS); ctx.fillStyle = '#23858c'; ctx.fill();
  ctx.clip();
  const ca = prog(zk, 0.35, 0.8);
  if (ca > 0) {
    let lastRow = 1e9;
    for (let i = 0; i < S4D_CELLS.length; i++) {
      const c = S4D_CELLS[i], k = prog(t, 95.45 + (c.row + 6) * 0.07, 95.85 + (c.row + 6) * 0.07);
      if (k <= 0) continue;
      if (c.row !== lastRow) {   // 每排一条货架横板
        lastRow = c.row;
        ctx.globalAlpha = 0.45 * ca;
        fillRoundRect(ctx, S4D_HX - 360, c.y + S4D_CR + 4, 720, 6, 3, PAL.cream);
      }
      const isMe = i === S4D_ME, sc = easeOutBack(k, 2.2), dy = -4 * beat;
      ctx.globalAlpha = ca;
      circle(ctx, c.x, c.y + dy, S4D_CR * sc, isMe ? PAL.me : '#9fe3e6');
      if (sc > 0.6) {   // 每格两只小眼睛（所有格子一模一样）
        circle(ctx, c.x - 6, c.y + dy - 3, 2.6, '#1b1d33');
        circle(ctx, c.x + 6, c.y + dy - 3, 2.6, '#1b1d33');
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  heartShapePath(ctx, S4D_HX, S4D_HY, S4D_HS); ctx.lineWidth = lw; ctx.strokeStyle = PAL.cream; ctx.lineJoin = 'round'; ctx.stroke();

  // “我”这一格：高亮虚线环 + 挂上 “just a friend” 标签
  const hk = prog(t, 96.8, 97.2, easeOutBack);
  if (hk > 0) {
    softGlow(ctx, me.x, me.y, 70, PAL.meGlow, 0.6 * hk * (0.7 + 0.3 * beat));
    ctx.save(); ctx.translate(me.x, me.y); ctx.rotate(t * 1.5);
    ctx.setLineDash([10, 8]); ring(ctx, 0, 0, (S4D_CR + 10) * hk, 4, PAL.meGlow);
    ctx.restore();
  }
  const tk = prog(t, 97.3, 97.75, easeOutBounce);
  if (tk > 0) {
    const since = t - 97.75, sw = since > 0 ? 0.22 * Math.exp(-since * 2.2) * Math.sin(since * 6) : 0.22;
    const px = me.x, py = me.y + S4D_CR + 2;
    ctx.save();
    ctx.translate(px, py); ctx.rotate(sw);
    const ty = lerp(-240, 92, tk), tw = 300, th = 66;
    line(ctx, 0, 0, 40, ty - th / 2, 3, PAL.cream);
    ctx.translate(40, ty); ctx.rotate(-0.06);
    fillRoundRect(ctx, -tw / 2 + 8, -th / 2 + 8, tw, th, 18, 'rgba(7,7,15,0.3)');
    fillRoundRect(ctx, -tw / 2, -th / 2, tw, th, 18, PAL.cream);
    circle(ctx, -tw / 2 + 22, 0, 8, '#23858c');
    drawText(ctx, 'just a friend', 14, 1, 36, PAL.indigo, { family: FONT_EN, weight: 800, shadow: false });
    ctx.restore();
  }
  ctx.restore();
  // 底部压暗带：青绿铺满画面时，歌词里青绿色的 friend 仍有足够对比度
  const g = ctx.createLinearGradient(0, 790, 0, H);
  g.addColorStop(0, 'rgba(7,7,15,0)'); g.addColorStop(0.35, rgba(PAL.abyss, 0.6 * zk)); g.addColorStop(1, rgba(PAL.abyss, 0.8 * zk));
  ctx.fillStyle = g; ctx.fillRect(0, 790, W, H - 790);
}

// ---- 100–103 「不是情人」：爱心图标 + 红色禁止圈斜线 ----
function s4NotLover(ctx, t) {
  s4Backdrop(ctx, t, '#2a1030', '#140c24', S4_RED);
  const since = t - 102.0, sh = since > 0 ? Math.exp(-since * 12) * 16 : 0;
  ctx.save();
  ctx.translate(Math.sin(t * 71) * sh, Math.cos(t * 59) * sh);
  const beat = beatPulse(t), hk = prog(t, 100.15, 100.6), slash = prog(t, 101.75, 102.0, easeOutCubic);
  const cx = 960, cy = 650;
  if (hk > 0) {
    const s = 100 * easeOutBack(hk, 2) * (1 + 0.07 * beat * (1 - slash));
    softGlow(ctx, cx, cy, 260, PAL.heart, 0.35 * (1 - slash * 0.7));
    drawHeart(ctx, cx, cy + 6, s, { fill: mixColor(PAL.heart, '#6a5a7a', slash * 0.75) });
  }
  const ra = prog(t, 101.6, 101.8, easeOutBack);
  if (ra > 0) {
    ring(ctx, cx, cy, 158 * ra, 18, S4_RED);
    if (slash > 0) {
      const d = 158 * 0.707;
      line(ctx, cx - d, cy - d, lerp(cx - d, cx + d, slash), lerp(cy - d, cy + d, slash), 18, S4_RED);
    }
  }
  ctx.restore();
}
// 歌词层：“情人”两个字上画红色删除线（与 drawHeroLine 同样的排版参数）
const S4E_LAY = { x: 960, y: 330, size: 190, maxW: HERO_MAXW };
function s4Strike(ctx, t, tl, L) {
  const P = prepText(L.text), Lo = layoutChars(ctx, P, S4E_LAY.size, S4E_LAY.maxW, 900, FONT_MIX);
  const i0 = L.text.indexOf('情人');
  if (i0 < 0) return;
  let xa = S4E_LAY.x - Lo.total / 2;
  for (let i = 0; i < i0; i++) xa += Lo.ws[i];
  const xb = xa + Lo.ws[i0] + Lo.ws[i0 + 1], pad = Lo.size * 0.08;
  const lt = tl - L.start, k = prog(lt, 1.35, 1.6, easeOutCubic);
  const exitDur = Math.min(0.35, (L.end - L.start) * 0.18), a = 1 - clamp01((tl - (L.end - exitDur)) / exitDur);
  if (k <= 0 || a <= 0) return;
  const x1 = xa - pad, x2 = lerp(x1, xb + pad, k), y1 = S4E_LAY.y + 22, y2 = lerp(y1, S4E_LAY.y - 6, k);
  ctx.globalAlpha = a;
  line(ctx, x1 + 6, y1 + 8, x2 + 6, y2 + 8, 22, 'rgba(7,7,15,0.5)');
  line(ctx, x1, y1, x2, y2, 22, S4_RED);
  ctx.globalAlpha = 1;
}

// ---- 103–108 信封与信 ----
const S4F_EX = 1160, S4F_EW = 440, S4F_EH = 280;
function s4Letter(ctx, t) {
  s4Backdrop(ctx, t, '#4a2440', '#1f1a3a', PAL.meGlow);
  s4Floor(ctx, t);
  const beat = beatPulse(t), warm = prog(t, 104.6, 105.8);
  // 暖光 + 慢转光芒
  softGlow(ctx, S4F_EX, 360, 680, PAL.meGlow, 0.15 + 0.3 * warm);
  if (warm > 0) {
    ctx.save(); ctx.translate(S4F_EX, 360); ctx.rotate(t * 0.15);
    ctx.globalAlpha = 0.09 * warm * (1 + 0.5 * beat);
    for (let i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -900); ctx.lineTo(60, -900); ctx.closePath();
      ctx.fillStyle = PAL.heaven; ctx.fill();
    }
    ctx.restore();
  }
  // “我”随拍点头，信打开后笑眼
  const nod = beatPulse(t, 5), r = 78;
  drawMe(ctx, 560, GROUND_Y - r, { t: t, r: r, look: 0.7, lookY: 0.1 + 0.6 * nod, rot: 0.1 * nod, squash: 1 + 0.08 * nod,
    groundY: GROUND_Y, glow: 0.5 + 0.4 * warm, mood: t > 105.4 ? 'happy' : 'normal' });
  // 信封：103.2 落下弹跳；104.0 封口翻开；104.4 信纸抽出；104.95 信纸上移展开，信封下移
  const ey = lerp(-300, 520, easeOutBounce(prog(t, 103.2, 103.75))) + 130 * prog(t, 104.9, 105.5, easeInOutCubic);
  const x0 = S4F_EX - S4F_EW / 2, x1 = S4F_EX + S4F_EW / 2, y0 = ey - S4F_EH / 2, y1 = ey + S4F_EH / 2;
  const flap = prog(t, 104.0, 104.4, easeInOutCubic), lift = prog(t, 104.4, 104.95, easeOutCubic);
  const unfold = prog(t, 104.95, 105.5, easeOutBack);
  fillRoundRect(ctx, x0 + 10, y0 + 12, S4F_EW, S4F_EH, 16, 'rgba(7,7,15,0.3)');
  fillRoundRect(ctx, x0, y0, S4F_EW, S4F_EH, 16, '#e8c79a');
  if (flap > 0.5) s4Flap(ctx, x0, x1, y0, 1 - 2 * flap, '#d9b583');
  if (unfold <= 0) s4Paper(ctx, t, S4F_EX, lerp(ey, ey - 190, lift), 160, 0);
  // 信封正面（下方 V 形口袋）
  ctx.beginPath();
  ctx.moveTo(x0, y0 + 10); ctx.lineTo(S4F_EX, y0 + S4F_EH * 0.56); ctx.lineTo(x1, y0 + 10);
  ctx.lineTo(x1, y1 - 16); ctx.arcTo(x1, y1, x1 - 16, y1, 16); ctx.lineTo(x0 + 16, y1); ctx.arcTo(x0, y1, x0, y1 - 16, 16);
  ctx.closePath(); ctx.fillStyle = '#ffe2b8'; ctx.fill();
  line(ctx, x0 + 12, y1 - 12, S4F_EX, y0 + S4F_EH * 0.6, 3, 'rgba(160,110,70,0.35)');
  line(ctx, x1 - 12, y1 - 12, S4F_EX, y0 + S4F_EH * 0.6, 3, 'rgba(160,110,70,0.35)');
  if (flap <= 0.5) {
    s4Flap(ctx, x0, x1, y0, 1 - 2 * flap, '#f3d3a3');
    const seal = 1 - prog(t, 103.95, 104.1);
    if (seal > 0) drawHeart(ctx, S4F_EX, y0 + S4F_EH * 0.55 * (1 - 2 * flap), 26 * seal, { fill: PAL.heart });
  }
  if (unfold > 0) s4Paper(ctx, t, S4F_EX, lerp(ey - 190, 330, unfold), lerp(160, 420, unfold), unfold);
}
// 信封封口三角：sy = 1 闭合（尖朝下），-1 完全翻开（尖朝上）
function s4Flap(ctx, x0, x1, y0, sy, col) {
  ctx.beginPath();
  ctx.moveTo(x0, y0 + 2); ctx.lineTo((x0 + x1) / 2, y0 + S4F_EH * 0.55 * sy); ctx.lineTo(x1, y0 + 2); ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
}
// 信纸：中心 (x, y)，高 h；u 为展开进度（折痕逐渐变淡，抽象文字线逐行写出）
function s4Paper(ctx, t, x, y, h, u) {
  const w = lerp(S4F_EW - 50, 400, clamp01(u)), l = x - w / 2, top = y - h / 2;
  fillRoundRect(ctx, l + 8, top + 10, w, h, 10, 'rgba(7,7,15,0.25)');
  fillRoundRect(ctx, l, top, w, h, 10, '#fffaf0');
  if (u <= 0) return;
  ctx.globalAlpha = 0.5 * (1 - 0.7 * clamp01(u));
  line(ctx, l + 8, top + h / 3, l + w - 8, top + h / 3, 2, '#c9b28f');
  line(ctx, l + 8, top + h * 2 / 3, l + w - 8, top + h * 2 / 3, 2, '#c9b28f');
  ctx.globalAlpha = 1;
  const write = prog(t, 105.4, 107.2);
  for (let i = 0; i < 7; i++) {
    const k = clamp01(write * 7 - i);
    if (k <= 0) break;
    const lw = (i === 6 ? 0.45 : 0.62 + 0.3 * hash01(i, 441)) * (w - 70), ly = top + 50 + i * (h - 100) / 6.5;
    line(ctx, l + 35, ly, l + 35 + lw * k, ly, 9, rgba(PAL.indigo, 0.5));
  }
  if (write >= 1) drawHeart(ctx, l + w - 60, top + h - 48, 20 * easeOutBack(prog(t, 107.2, 107.5), 2.5), { fill: PAL.heart });
}

// ---- 108–113 回旋镖爱心 ----
const S4G_MX = 430, S4G_R = 78, S4G_THROW = 108.75;
function s4BoomPt(u) {   // 抛出路线（二次贝塞尔），u=1 时已在画面右外侧
  const iu = 1 - u;
  return { x: iu * iu * 520 + 2 * iu * u * 1300 + u * u * 2200, y: iu * iu * 600 + 2 * iu * u * 110 + u * u * 380 };
}
function s4RetPt(u) {    // 预期返回路线（虚线）：从右侧画面边缘绕下方回到“我”的手边
  const iu = 1 - u;
  return { x: iu * iu * 1830 + 2 * iu * u * 1500 + u * u * 600, y: iu * iu * 330 + 2 * iu * u * 980 + u * u * 610 };
}
function s4Boomerang(ctx, t) {
  s4Backdrop(ctx, t, '#2a1f55', '#141a38', PAL.you);
  drawStars(ctx, t, 0.5);
  s4Floor(ctx, t);
  const my = GROUND_Y - S4G_R;
  // 姿态：蓄力后仰 → 甩出前倾 → 伸手等待
  const wind = prog(t, 108.2, 108.7, easeInOutCubic), thr = prog(t, S4G_THROW, S4G_THROW + 0.15, easeOutCubic);
  const rot = -0.22 * wind * (1 - thr) + 0.18 * thr * (1 - prog(t, 109.0, 109.6, easeInOutCubic));
  const wait = prog(t, 110.2, 110.6, easeOutBack);
  const ha = t < S4G_THROW ? lerp(-PI * 0.5, -PI * 0.85, wind) : lerp(-0.3, -0.15, wait);
  const hl = t < S4G_THROW ? 0.6 : lerp(0.6, 0.85, wait);
  const sad = prog(t, 112.0, 112.6);
  drawMe(ctx, S4G_MX, my, { t: t, r: S4G_R, rot: rot, look: lerp(0.4, 1, thr), lookY: lerp(-0.5, -0.2, wait) + 0.3 * sad,
    groundY: GROUND_Y, glow: 0.55, hands: [{ a: ha, len: hl }], mood: sad > 0.5 ? 'sad' : 'normal',
    squash: 1 + 0.05 * beatPulse(t) });
  if (t < S4G_THROW) {
    const tip = charHandTip(S4G_MX, my, S4G_R, ha, hl, rot);
    drawHeart(ctx, tip.x, tip.y - 20, 40, { fill: PAL.heart, rot: -0.3 * wind });
  } else {
    // 飞出：旋转 + 残影
    const u = prog(t, S4G_THROW, 110.0, easeInQuad);
    if (u < 1) {
      for (let j = 3; j >= 0; j--) {
        const p = s4BoomPt(Math.max(0, u - j * 0.035));
        drawHeart(ctx, p.x, p.y, 48, { fill: PAL.heart, rot: (t - S4G_THROW) * 16 - j * 0.5, alpha: j === 0 ? 1 : 0.22 * (4 - j) / 3 });
      }
    }
  }
  // 预期返回的虚线箭头（蚂蚁线滚动），但爱心始终没有回来
  const rk = prog(t, 110.1, 111.3, easeInOutCubic);
  if (rk > 0) {
    ctx.save();
    ctx.setLineDash([26, 20]); ctx.lineDashOffset = -t * 40;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const p = s4RetPt(rk * i / 40);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.lineWidth = 6; ctx.strokeStyle = rgba(PAL.cream, 0.7); ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
    if (rk >= 1) {
      const p = s4RetPt(1), q = s4RetPt(0.97), a = Math.atan2(p.y - q.y, p.x - q.x), ak = easeOutBack(prog(t, 111.3, 111.55), 2);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.scale(ak, ak);
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-22, -16); ctx.lineTo(-22, 16); ctx.closePath();
      ctx.fillStyle = rgba(PAL.cream, 0.8); ctx.fill();
      ctx.restore();
    }
  }
  // 头顶等待的三点
  if (t > 111.6) drawDots(ctx, S4G_MX, my - S4G_R - 50, t, { color: PAL.cream, r: 8, gap: 26, alpha: prog(t, 111.6, 111.9) });
}
// 歌词层：与下方歌词区相同的排版与 pop 入场，但“收不回来”四字向远处拉伸、变小（带残影）
function s4StretchLyric(ctx, t, tl, L) {
  const P = prepText(L.text), Lo = layoutChars(ctx, P, LYR_SIZE, LYR_MAXW, 800, FONT_MIX);
  const n = P.chars.length, i0 = L.text.indexOf('收不回来');
  const exitDur = Math.min(0.4, (L.end - L.start) * 0.15), exitStart = L.end - exitDur;
  const band = env(tl, L.start, L.end, 0.3, exitDur);
  if (band > 0) {
    const g = ctx.createLinearGradient(0, 780, 0, H);
    g.addColorStop(0, 'rgba(7,7,15,0)'); g.addColorStop(1, rgba(PAL.abyss, 0.5 * band));
    ctx.fillStyle = g; ctx.fillRect(0, 780, W, H - 780);
  }
  const stagger = Math.min(0.055, 0.6 / n), beat = beatPulse(t) * beatGainAt(t);
  const st = prog(tl, L.start + 2.0, L.start + 3.3, easeInOutCubic);
  const xs = new Array(n);
  let x = W / 2 - Lo.total / 2;
  for (let i = 0; i < n; i++) { xs[i] = x + Lo.ws[i] / 2; x += Lo.ws[i]; }
  const vpx = x + 230, vpy = LYR_Y - 34;   // 远处的消失点
  for (let i = 0; i < n; i++) {
    const k = clamp01((tl - L.start - i * stagger) / 0.45);
    if (k <= 0) continue;
    let sc = easeOutBack(k, 2.2), a = clamp01(k * 4), cx = xs[i], cy = LYR_Y;
    const e = clamp01((tl - exitStart - i * (exitDur * 0.4 / n)) / (exitDur * 0.6));
    a *= 1 - e; cy -= e * 24;
    const hc = P.hl[i];
    if (hc) {
      sc *= 1.1 + 0.07 * beat;
      cx += Math.sin(t * 31 + i * 1.7) * 2.2 * (0.3 + beat); cy += Math.cos(t * 27 + i * 2.3) * 1.8 * (0.3 + beat);
    }
    if (i0 >= 0 && i >= i0 && st > 0) {
      const d = st * (0.25 + (i - i0) * 0.2);
      const bx = cx, by = cy;
      cx = lerp(cx, vpx, d); cy = lerp(cy, vpy, d); sc *= lerp(1, 0.38, d);
      // 拉伸拖尾：从原位置拉向字的细速度线（不叠字形，保证可读）
      const hw = Lo.ws[i] * sc * 0.5;
      if (cx - hw - bx > 8) {
        ctx.globalAlpha = 0.35 * a;
        for (let s = -1; s <= 1; s++) {
          const oy = s * Lo.size * sc * 0.22;
          line(ctx, lerp(bx, cx - hw, 0.35), lerp(by, cy, 0.35) + oy, cx - hw - 6, cy + oy, Math.max(2, Lo.size * sc * 0.06), hc || PAL.cream);
        }
        ctx.globalAlpha = 1;
      }
    }
    drawGlyph(ctx, P.chars[i], cx, cy, sc, 0, a, hc || PAL.cream, Lo.font, Lo.size, false);
  }
}
