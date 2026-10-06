'use strict';
// =====================================================================
// timeline.js — 数据驱动时间轴：总长、节拍、歌词、场景注册。
//
// 【两套时间】
//   原曲时间：播放器/进度条/音频的真实秒数（0 – 257）。
//   分镜时间：下面 LYRICS / SCENES 以及各 scenes_*.js 内部用的秒数（原始分镜设计）。
//   文件末尾的 SYNC 表把两者对应起来：每句歌词的分镜起点 → 原曲演唱起点，
//   中间按分段线性映射。画面编排保持原样，只按段拉伸/压缩到原曲节奏上。
//   SYNC 的原曲时间来自陶喆《普通朋友》的两份 LRC（GitHub 与网易云，逐句一致），秒级精度。
//
// 【如何对齐你手上的音频】
// 1) 整体偏移：如果整首歌的歌声都比画面早/晚同样的时间（例如音频前面多了 2 秒静音），
//    只改 AUDIO_OFFSET。歌声晚 2 秒 → AUDIO_OFFSET = 2；早 0.5 秒 → -0.5。
//    片头和片尾会自动吸收这段差值，总长仍是 257 秒。
// 2) 单句微调：在 SYNC 表里找到该句，改右边的“原曲秒”。画面和歌词会一起移动。
//    规则：右列必须严格递增；首行 [0, 0] 和末行 [257, 257] 不要改。
// 3) 节拍：BPM 控制全局节拍脉冲（光晕/粒子/心跳/落拍冲击），按原曲真实时间计算，
//    不受 SYNC 拉伸影响。若脉冲和鼓点有固定错位，调 BEAT_OFFSET（秒，0 – 0.67 之间即可）。
// 4) LYRIC_OFFSET 是旧参数，按“分镜秒”只移动歌词文字，一般保持 0。
// 5) 下面 LYRICS / SCENES 的 start / end 是分镜时间，对齐音频时不需要改它们。
// 调试技巧：打开 index.html?t=95&pause=1 可直接跳到原曲第 95 秒并暂停（&ui=0 隐藏控制栏）。
// =====================================================================

const TOTAL = 257;        // 总时长 4:17（秒），到此定格最后一帧
const BPM = 90;           // 节拍速度：90（按 LRC 乐句间隔推算，两小节 ≈ 5.33 秒）
const BEAT_OFFSET = 0;    // 节拍相位偏移（原曲秒），正数 = 节拍整体推后
const AUDIO_OFFSET = 0;   // 整体偏移（原曲秒），正数 = 画面与歌词整体推后
const LYRIC_OFFSET = 0;   // 旧参数：仅歌词偏移（分镜秒），一般保持 0

// 歌词：{ start, end, text, sub?, hero? }
//   sub  = 括号英文副行（显示在主行下方，小一号）
//   hero = true 表示在画面中央做大字 kinetic typography（此时下方歌词区不重复显示）
// 文字必须与原歌词逐字一致（含英文、括号；保留原文 "just give me change"）。
const LYRICS = [
  // ---- S1 等待 0:14–0:37 ----
  { start: 14, end: 18, text: '等待', hero: true },
  { start: 18, end: 23, text: '我随时随地在等待' },
  { start: 23, end: 28, text: '做你感情上的依赖' },
  { start: 28, end: 33, text: '我没有任何的疑问' },
  { start: 33, end: 37, text: '这是爱', hero: true },
  // ---- S2 我猜 / 失败 / 深渊 0:37–0:59 ----
  { start: 37, end: 40, text: '我猜' },
  { start: 40, end: 45, text: '你早就想要说明白' },
  { start: 45, end: 50, text: '我觉得自己好失败' },
  { start: 50, end: 55, text: '从天堂掉落到深渊', hero: true },
  { start: 55, end: 59, text: '多无奈' },
  // ---- S3 改变 / 重来 / 放手 0:59–1:25 ----
  { start: 59, end: 64, text: '我愿意改变', sub: '(what can I do?)' },
  { start: 64, end: 69, text: '重新再来一遍', sub: '(just give me change)' },
  { start: 69, end: 74, text: '我无法只是普通朋友' },
  { start: 74, end: 78, text: '感情已那么深' },
  { start: 78, end: 82, text: '叫我怎么能放手' },
  { start: 82, end: 85, text: '但你说' },
  // ---- S4 副歌一 1:25–2:06 ----
  { start: 85, end: 90, text: 'I only want to be your friend', hero: true },
  { start: 90, end: 93, text: '做个朋友' },
  { start: 93, end: 95, text: '我在' },
  { start: 95, end: 100, text: '你心中只是just a friend' },
  { start: 100, end: 103, text: '不是情人', hero: true },
  { start: 103, end: 108, text: '我感激你对我这样的坦白' },
  { start: 108, end: 113, text: '但我给你的爱暂时收不回来' },
  { start: 113, end: 115, text: 'So I', hero: true },
  { start: 115, end: 119, text: '我不能只是be 你的朋友', hero: true },
  { start: 119, end: 121, text: '（你说对不对）' },
  { start: 121, end: 126, text: '我不能只是做你的朋友', hero: true },
  // ---- S5 间奏 2:06–2:14（无歌词） ----
  // ---- S6 主歌二 2:14–2:58 ----
  { start: 134, end: 137, text: '我猜' },
  { start: 137, end: 141, text: '你早就想要说明白' },
  { start: 141, end: 143, text: "That's right", hero: true },
  { start: 143, end: 147, text: '我觉得自己好失败' },
  { start: 147, end: 151, text: '从天堂掉落到深渊' },
  { start: 151, end: 154, text: '多无奈' },
  { start: 154, end: 158, text: '我愿意改变', sub: '(what can I do?)' },
  { start: 158, end: 162, text: '重新再来一遍', sub: '(just give me change)' },
  { start: 162, end: 167, text: '我无法只是 只是做你的朋友' },
  { start: 167, end: 171, text: '感情已那么深' },
  { start: 171, end: 175, text: '叫我怎么能放手' },
  { start: 175, end: 178, text: '但你说' },
  // ---- S7 副歌二 2:58–3:35 ----
  { start: 178, end: 182, text: 'I only want to be your friend', hero: true },
  { start: 182, end: 185, text: '做个朋友' },
  { start: 185, end: 187, text: '我在' },
  { start: 187, end: 192, text: '你心中只是just a friend' },
  { start: 192, end: 195, text: '不是情人', hero: true },
  { start: 195, end: 200, text: '我感激你对我这样的坦白' },
  { start: 200, end: 205, text: '但我给你的爱暂时收不回来' },
  { start: 205, end: 207, text: 'So I', hero: true },
  { start: 207, end: 211, text: '我不能只是做 你的 friend', hero: true },
  { start: 211, end: 215, text: '我不能不能做 耶' },
  // ---- S8 结尾 Hook 3:35–4:06 ----
  { start: 215, end: 218, text: "I don't wanna be your" },
  { start: 218, end: 222, text: '我不能不能做你的朋友' },
  { start: 222, end: 225, text: "I don't wanna be your friend" },
  { start: 225, end: 227, text: "I don't wanna be your" },
  { start: 227, end: 230, text: "I don't wanna be your friend" },
  { start: 230, end: 232, text: "I don't wanna be your" },
  { start: 232, end: 235, text: "I don't wanna be your friend" },
  { start: 235, end: 237, text: "I don't wanna be your" },
  { start: 237, end: 240, text: "I don't wanna be your friend" },
  { start: 240, end: 246, text: "I don't wanna be your 只是做你的朋友" }
  // ---- S9 片尾 4:06–4:17（无歌词） ----
];

// 场景实现注册表：scenes_*.js 往这里登记 SCENE_IMPL.S0 = { draw, ownsHero?, ownsLyrics?, heroLayout? }
//   draw(ctx, t, lt, scene)  t=全局秒，lt=场景内秒
//   ownsHero   = true → 该场景自己绘制大字，lyrics.js 不再画中央大字
//   ownsLyrics = true → 该场景自己绘制全部歌词（含下方歌词区）
//   heroLayout(t, line) → 返回 {x, y, size} 覆盖大字默认位置/字号（避开角色）
// 未登记的场景使用 player.js 中的占位画面。
// 已实现：S0 → scenes_a.js，S1 → scenes_a1.js，S2 → scenes_a2.js，S3 → scenes_a3.js + scenes_a4.js，
//         S4 → scenes_b.js + scenes_b1.js + scenes_b2.js（ownsLyrics），S5 → scenes_b3.js，
//         S6 → scenes_c.js + scenes_c1.js + scenes_c2.js，S7 → scenes_c3.js（ownsLyrics），
//         S8 → scenes_d.js + scenes_d1.js（ownsLyrics），S9 → scenes_d2.js
const SCENE_IMPL = {};

function sceneDraw(id) {
  return function (ctx, t, lt, sc) {
    const impl = SCENE_IMPL[id];
    if (impl && typeof impl.draw === 'function') impl.draw(ctx, t, lt, sc);
    else drawPlaceholderScene(ctx, t, lt, sc);
  };
}

// 场景：{ id, start, end, draw, title }，必须首尾相接覆盖 0 – TOTAL
const SCENES = [
  { id: 'S0', start: 0, end: 14, title: '片头', draw: sceneDraw('S0') },
  { id: 'S1', start: 14, end: 37, title: '等待', draw: sceneDraw('S1') },
  { id: 'S2', start: 37, end: 59, title: '我猜 / 失败 / 深渊', draw: sceneDraw('S2') },
  { id: 'S3', start: 59, end: 85, title: '改变 / 重来 / 放手', draw: sceneDraw('S3') },
  { id: 'S4', start: 85, end: 126, title: '副歌一', draw: sceneDraw('S4') },
  { id: 'S5', start: 126, end: 134, title: '间奏', draw: sceneDraw('S5') },
  { id: 'S6', start: 134, end: 178, title: '主歌二', draw: sceneDraw('S6') },
  { id: 'S7', start: 178, end: 215, title: '副歌二', draw: sceneDraw('S7') },
  { id: 'S8', start: 215, end: 246, title: '结尾 Hook', draw: sceneDraw('S8') },
  { id: 'S9', start: 246, end: 257, title: '片尾', draw: sceneDraw('S9') }
];

// 查找 t 时刻所在场景（t >= TOTAL 时返回最后一个场景，用于片尾定格）
function findScene(t) {
  for (let i = 0; i < SCENES.length; i++) {
    if (t >= SCENES[i].start && t < SCENES[i].end) return SCENES[i];
  }
  return t < 0 ? SCENES[0] : SCENES[SCENES.length - 1];
}
// 查找 t 时刻正在显示的歌词（已计入 LYRIC_OFFSET），没有则返回 null
function findLyric(t) {
  const tl = t - LYRIC_OFFSET;
  for (let i = 0; i < LYRICS.length; i++) {
    const L = LYRICS[i];
    if (tl >= L.start && tl < L.end) return L;
  }
  return null;
}

// =====================================================================
// SYNC：分镜时间 → 原曲时间（陶喆《普通朋友》）
//   每行 [分镜秒, 原曲秒]。★ = 原曲时间直接取自 LRC（误差 ≤ 1 秒）；
//   其余是 LRC 没有记录的和声/即兴句或场景边界，按前后锚点插值。
//   左列与 LYRICS 的 start 一一对应，不要改；对齐时只改右列。
// =====================================================================
const SYNC = [
  [0, 0],          // S0 片头
  // ---- 主歌一 ----
  [14, 19],        // ★ 0:19 等待
  [18, 22],        // ★ 0:22 我随时随地在等待
  [23, 27],        // ★ 0:27 做你感情上的依赖
  [28, 33],        // ★ 0:33 我没有任何的疑问
  [33, 37],        // ★ 0:37 这是爱
  [37, 41],        // ★ 0:41 我猜
  [40, 43],        // ★ 0:43 你早就想要说明白
  [45, 49],        // ★ 0:49 我觉得自己好失败
  [50, 54],        // ★ 0:54 从天堂掉落到深渊
  [55, 59],        // ★ 0:59 多无奈
  [59, 62],        // ★ 1:02 我愿意改变 (what can I do?)
  [64, 68],        // ★ 1:08 重新再来一遍(just give me change)
  [69, 74],        // ★ 1:14 我无法只是普通朋友
  [74, 79],        // ★ 1:19 感情已那么深
  [78, 81],        // ★ 1:21 叫我怎么能放手
  [82, 86],        // ★ 1:26 但你说
  // ---- 副歌一 ----
  [85, 89],        // ★ 1:29 I only want to be your friend
  [90, 94],        // ★ 1:34 做个朋友
  [93, 97],        // ★ 1:37 我在
  [95, 100],       // ★ 1:40 你心中只是just a friend
  [100, 105],      // ★ 1:45 不是情人
  [103, 108],      // ★ 1:48 我感激你对我这样的坦白
  [108, 113],      // ★ 1:53 但我给你的爱暂时收不回来
  [113, 119],      // ★ 1:59 So I
  [115, 123],      // ★ 2:03 我不能只是be 你的朋友
  [119, 126.5],    //   2:06.5 （你说对不对）
  [121, 129],      // ★ 2:09 我不能只是做你的朋友
  [126, 132],      //   2:12 S5 间奏（压缩成 3 秒的时间流逝转场）
  // ---- 主歌二 ----
  [134, 135],      // ★ 2:15 我猜
  [137, 138],      // ★ 2:18 你早就想要说明白
  [141, 141.5],    //   2:21.5 That's right
  [143, 143],      // ★ 2:23 我觉得自己好失败
  [147, 149],      // ★ 2:29 从天堂掉落到深渊
  [151, 153],      // ★ 2:33 多无奈
  [154, 157],      // ★ 2:37 我愿意改变 (what can I do?)
  [158, 162],      // ★ 2:42 重新再来一遍(just give me change)
  [162, 167],      // ★ 2:47 我无法只是 只是做你的朋友
  [167, 173],      // ★ 2:53 感情已那么深
  [171, 175],      // ★ 2:55 叫我怎么能放手
  [175, 181],      // ★ 3:01 但你说
  // ---- 副歌二 ----
  [178, 184],      // ★ 3:04 I only want to be your friend
  [182, 188],      // ★ 3:08 做个朋友
  [185, 192],      // ★ 3:12 我在
  [187, 195],      // ★ 3:15 你心中只是just a friend
  [192, 199],      // ★ 3:19 不是情人
  [195, 203],      // ★ 3:23 我感激你对我这样的坦白
  [200, 208],      // ★ 3:28 但我给你的爱暂时收不回来
  [205, 213],      // ★ 3:33 So I
  [207, 216],      // ★ 3:36 我不能只是做 你的 friend
  [211, 221],      //   3:41 我不能不能做 耶
  // ---- 结尾 Hook（LRC 只记录了主唱，和声句按节奏均分） ----
  [215, 227],      // ★ 3:47 I don't wanna be your
  [218, 228.25],   //   我不能不能做你的朋友
  [222, 230.5],    //   I don't wanna be your friend
  [225, 232.25],   //   I don't wanna be your
  [227, 233.5],    //   I don't wanna be your friend
  [230, 235.25],   //   I don't wanna be your
  [232, 236.5],    //   I don't wanna be your friend
  [235, 238.25],   //   I don't wanna be your
  [237, 239.5],    //   I don't wanna be your friend
  [240, 241],      // ★ 4:01 I don't wanna be your 只是做你的朋友
  [246, 248],      //   4:08 S9 片尾
  [257, 257]       //   4:17 定格
];

// ---- 时间映射（分段线性；超出两端按斜率 1 外推） ----
const SYNC_STORY = [], SYNC_SONG = [];
(function buildSync() {
  const last = SYNC.length - 1;
  for (let i = 0; i <= last; i++) {
    SYNC_STORY.push(SYNC[i][0]);
    SYNC_SONG.push(SYNC[i][1] + (i > 0 && i < last ? AUDIO_OFFSET : 0));
  }
  for (let i = 1; i <= last; i++) {
    if (!(SYNC_STORY[i] > SYNC_STORY[i - 1]) || !(SYNC_SONG[i] > SYNC_SONG[i - 1])) {
      const msg = '[timeline] SYNC 第 ' + (i + 1) + ' 行时间不是严格递增：' + JSON.stringify(SYNC[i]) +
        '（AUDIO_OFFSET = ' + AUDIO_OFFSET + '）';
      if (typeof window !== 'undefined' && window.__reportError) window.__reportError(msg);
      else if (typeof console !== 'undefined') console.error(msg);
    }
  }
})();
function syncInterp(xs, ys, x) {
  const n = xs.length - 1;
  if (x <= xs[0]) return ys[0] + (x - xs[0]);
  if (x >= xs[n]) return ys[n] + (x - xs[n]);
  let lo = 0, hi = n;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= x) lo = mid; else hi = mid; }
  const span = xs[hi] - xs[lo];
  return span > 0 ? ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / span : ys[lo];
}
// 原曲时间 → 分镜时间（render 用）
function storyTime(t) { return syncInterp(SYNC_SONG, SYNC_STORY, t); }
// 分镜时间 → 原曲时间（节拍用）
function songTime(s) { return syncInterp(SYNC_STORY, SYNC_SONG, s); }
