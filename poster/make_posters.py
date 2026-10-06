"""make_posters.py — 《普通朋友》（陶喆）社交媒体封面：SVG 矢量 + PNG。

画面元素与 MG 动画一致：夜空与星星、楼群剪影、路灯光锥、珊瑚色的“我”（胸前“朋友”徽章）、
青绿色的“你”、两人之间系着爱心的粉色细线、几何小件，以及片名“普通朋友”和“陶喆”。

用法：python mg-animation/poster/make_posters.py
输出：
  poster/cover-16x9.svg   1920×1080  B 站 / YouTube / 视频号横版封面
  poster/cover-3x4.svg    1080×1440  小红书 / Instagram 竖版
  poster/cover-9x16.svg   1080×1920  抖音 / Stories / 竖屏视频封面
  poster/png/*.png        同名 PNG（用本机 Edge 无头渲染；社交平台上传用这个）

注意：SVG 里的文字使用系统字体（Microsoft YaHei 等），在没有这些字体的设备上打开 SVG 会换字体；
PNG 已经把文字渲染成像素，不受影响。
"""
import random
import shutil
import subprocess
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
PNG_DIR = HERE / "png"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

PAL = {
    "me": "#ff7a59", "me_glow": "#ffb36b", "you": "#3ec1c9", "heart": "#ff5c8a",
    "cream": "#fff4e0", "ink": "#15142a", "indigo": "#262b5a", "window": "#e0a26a",
}
FONT_CN = "'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif"
TITLE = "普通朋友"
TITLE_COLORS = [PAL["cream"], PAL["cream"], PAL["you"], PAL["you"]]   # “朋友”青绿，与动画一致
ARTIST = "陶喆"
LYRIC = [("「我无法只是普通", PAL["cream"]), ("朋友", PAL["you"]), ("」", PAL["cream"])]
# 爱心：单位尺寸，中心在原点（与动画里的爱心同款：圆润双瓣 + 尖底）
HEART = ("M0,-0.45 C0,-0.85 -0.55,-1.0 -0.85,-0.7 C-1.15,-0.4 -1.0,0.05 -0.7,0.35 "
         "C-0.45,0.6 -0.1,0.85 0,1.0 C0.1,0.85 0.45,0.6 0.7,0.35 "
         "C1.0,0.05 1.15,-0.4 0.85,-0.7 C0.55,-1.0 0,-0.85 0,-0.45 Z")


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


class Svg:
    def __init__(self, w, h, seed):
        self.w, self.h = w, h
        self.rng = random.Random(seed)
        self.defs, self.body, self.uid = [], [], 0

    def new_id(self, prefix):
        self.uid += 1
        return f"{prefix}{self.uid}"

    def add(self, s):
        self.body.append(s + "\n")

    def text(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
                f'viewBox="0 0 {self.w} {self.h}">\n<title>普通朋友 · 陶喆</title>\n'
                f'<defs>\n{"".join(self.defs)}</defs>\n{"".join(self.body)}</svg>\n')


# ---------------------------------------------------------------- 基础件
def radial(s, color, op):
    gid = s.new_id("rg")
    s.defs.append(f'<radialGradient id="{gid}"><stop offset="0" stop-color="{color}" stop-opacity="{op}"/>'
                  f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>\n')
    return gid


def glow(s, cx, cy, rx, color, op, ry=None):
    gid = radial(s, color, op)
    s.add(f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry or rx)}" fill="url(#{gid})"/>')


def sky(s, gy):
    gid = s.new_id("sky")
    s.defs.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
                  '<stop offset="0" stop-color="#0b0e22"/><stop offset="0.55" stop-color="#1d2250"/>'
                  '<stop offset="1" stop-color="#3b2557"/></linearGradient>\n')
    s.add(f'<rect width="{s.w}" height="{s.h}" fill="url(#{gid})"/>')
    glow(s, s.w / 2, gy, s.w * 0.75, PAL["heart"], 0.16, ry=s.h * 0.26)   # 地平线的玫瑰色余晖


def clear_of(x, y, pad, avoid):
    """avoid: 矩形 (x0, y0, x1, y1) 列表；点 (x, y) 外扩 pad 后不与任何矩形相交时返回 True。"""
    return all(not (x0 - pad < x < x1 + pad and y0 - pad < y < y1 + pad) for x0, y0, x1, y1 in avoid)


def pick(r, gen, pad, avoid, tries=200):
    for _ in range(tries):
        x, y = gen()
        if clear_of(x, y, pad, avoid):
            return x, y
    return None


def stars(s, n, y1, avoid=()):
    r = s.rng
    for _ in range(n):
        x, y = r.uniform(0, s.w), y1 * r.random() ** 1.35
        s.add(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r.uniform(0.8, 2.5))}" fill="{PAL["cream"]}" '
              f'opacity="{r.uniform(0.25, 0.95):.2f}"/>')
    for _ in range(6):   # 四角闪光：避开片名和月亮
        k = r.uniform(7, 13)
        p = pick(r, lambda: (r.uniform(20, s.w - 20), y1 * r.random() ** 1.5), k + 10, avoid)
        if not p:
            continue
        x, y = p
        s.add(f'<path d="M{f(x)},{f(y - k)} Q{f(x)},{f(y)} {f(x + k)},{f(y)} Q{f(x)},{f(y)} {f(x)},{f(y + k)} '
              f'Q{f(x)},{f(y)} {f(x - k)},{f(y)} Q{f(x)},{f(y)} {f(x)},{f(y - k)} Z" fill="{PAL["cream"]}" opacity="0.85"/>')


def bokeh(s, n, y1, avoid=()):
    """柔边光斑（径向渐变），只放在天空里，避开片名和月亮，读起来是“光”而不是“污点”。"""
    r = s.rng
    for _ in range(n):
        rad = r.uniform(18, 70)
        p = pick(r, lambda: (r.uniform(0, s.w), r.uniform(0, y1)), rad * 0.6, avoid)
        if not p:
            continue
        c = r.choice([PAL["cream"], PAL["me_glow"], PAL["you"], PAL["heart"]])
        glow(s, p[0], p[1], rad, c, r.uniform(0.10, 0.20))


def moon_box(cx, cy, rad, k=2.4):
    return (cx - k * rad, cy - k * rad, cx + k * rad, cy + k * rad)


def moon(s, cx, cy, rad):
    glow(s, cx, cy, rad * 3.2, "#ffe9c7", 0.22)
    mid = s.new_id("moon")
    s.defs.append(f'<mask id="{mid}"><rect x="{f(cx - 2 * rad)}" y="{f(cy - 2 * rad)}" width="{f(4 * rad)}" '
                  f'height="{f(4 * rad)}" fill="#fff"/><circle cx="{f(cx + 0.42 * rad)}" cy="{f(cy - 0.28 * rad)}" '
                  f'r="{f(rad * 0.92)}" fill="#000"/></mask>\n')
    s.add(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(rad)}" fill="#fff1d6" mask="url(#{mid})"/>')


def skyline(s, gy, hrange):
    """两层楼群剪影：远层暗淡、近层带亮窗。hrange(x) → (最矮, 最高)。"""
    r = s.rng
    for layer in (0, 1):
        x = -40.0
        color = "#1a1f45" if layer == 0 else "#141938"
        while x < s.w + 40:
            bw = r.uniform(100, 210)
            lo, hi = hrange(x + bw / 2)
            h = r.uniform(lo, hi) * (1.12 if layer == 0 else 0.86)
            bx, top = x + (r.uniform(-30, 30) if layer == 0 else 0), gy - h
            s.add(f'<rect x="{f(bx)}" y="{f(top)}" width="{f(bw - 10)}" height="{f(h + 2)}" fill="{color}"/>')
            if r.random() < 0.3:
                s.add(f'<rect x="{f(bx + bw * 0.3)}" y="{f(top - 26)}" width="{f(bw * 0.22)}" height="28" fill="{color}"/>')
            cols, rows = int((bw - 34) // 28), int((h - 36) // 40)
            lit_p, op = (0.12, (0.18, 0.35)) if layer == 0 else (0.32, (0.45, 0.9))
            for c in range(cols):
                for k in range(rows):
                    if r.random() < lit_p:
                        s.add(f'<rect x="{f(bx + 14 + c * 28)}" y="{f(top + 22 + k * 40)}" width="12" height="18" '
                              f'fill="{PAL["window"]}" opacity="{r.uniform(*op):.2f}"/>')
            x += bw


def ground(s, gy):
    gid = s.new_id("gnd")
    s.defs.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
                  '<stop offset="0" stop-color="#121633"/><stop offset="1" stop-color="#08091a"/></linearGradient>\n')
    s.add(f'<rect y="{f(gy)}" width="{s.w}" height="{f(s.h - gy)}" fill="url(#{gid})"/>')
    s.add(f'<rect y="{f(gy - 2)}" width="{s.w}" height="3" fill="#2c3366"/>')
    for x in range(40, s.w, 160):
        s.add(f'<rect x="{x}" y="{f(gy + 42)}" width="80" height="6" rx="3" fill="#1f2547"/>')


def lamp(s, x, gy, h, spread):
    top = gy - h
    bx, by = x + 92, top + 22
    gid = s.new_id("cone")
    s.defs.append(f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{f(bx)}" y1="{f(by)}" x2="{f(bx)}" y2="{f(gy)}">'
                  '<stop offset="0" stop-color="#ffe9c7" stop-opacity="0.45"/>'
                  '<stop offset="1" stop-color="#ffb36b" stop-opacity="0.05"/></linearGradient>\n')
    s.add(f'<polygon points="{f(bx - 18)},{f(by + 6)} {f(bx + 18)},{f(by + 6)} {f(bx + spread)},{f(gy)} '
          f'{f(bx - spread)},{f(gy)}" fill="url(#{gid})"/>')
    s.add(f'<ellipse cx="{f(bx)}" cy="{f(gy)}" rx="{f(spread)}" ry="24" fill="#ffe9c7" opacity="0.12"/>')
    pole = "#2b3272"
    s.add(f'<rect x="{f(x - 7)}" y="{f(top)}" width="14" height="{f(h)}" fill="{pole}"/>')
    s.add(f'<rect x="{f(x - 26)}" y="{f(gy - 14)}" width="52" height="14" rx="5" fill="{pole}"/>')
    s.add(f'<rect x="{f(x - 7)}" y="{f(top - 7)}" width="92" height="14" rx="7" fill="{pole}"/>')
    s.add(f'<rect x="{f(x + 62)}" y="{f(top - 12)}" width="60" height="26" rx="13" fill="#3b4392"/>')
    glow(s, bx, by, 180, PAL["me_glow"], 0.55)
    s.add(f'<circle cx="{f(bx)}" cy="{f(by)}" r="14" fill="#fff1d6"/>')


def character(s, cx, gy, rad, color, look=(0.0, 0.0), badge=False, glow_color=None, glow_op=0.45):
    cy = gy - rad
    s.add(f'<ellipse cx="{f(cx)}" cy="{f(gy)}" rx="{f(rad * 0.95)}" ry="{f(rad * 0.14)}" fill="#000" opacity="0.35"/>')
    if glow_color:
        glow(s, cx, cy, rad * 2.4, glow_color, glow_op)
    cid = s.new_id("clip")
    s.defs.append(f'<clipPath id="{cid}"><circle cx="{f(cx)}" cy="{f(cy)}" r="{f(rad)}"/></clipPath>\n')
    s.add(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(rad)}" fill="{color}"/>')
    s.add(f'<g clip-path="url(#{cid})"><circle cx="{f(cx - 0.3 * rad)}" cy="{f(cy - 0.36 * rad)}" r="{f(0.62 * rad)}" '
          f'fill="#fff" opacity="0.18"/><circle cx="{f(cx + 0.32 * rad)}" cy="{f(cy + 0.42 * rad)}" r="{f(0.86 * rad)}" '
          f'fill="#000" opacity="0.12"/></g>')
    lx, ly = look
    ex, ey = cx + lx * 0.16 * rad, cy - 0.1 * rad + ly * 0.1 * rad
    for side in (-1, 1):
        x = ex + side * 0.2 * rad
        s.add(f'<circle cx="{f(x)}" cy="{f(ey)}" r="{f(0.085 * rad)}" fill="{PAL["ink"]}"/>')
        s.add(f'<circle cx="{f(x + 0.03 * rad)}" cy="{f(ey - 0.03 * rad)}" r="{f(0.032 * rad)}" fill="#fff"/>')
    if badge:   # 胸前“朋友”徽章（副歌里贴上的那枚）
        bx, by, br = cx + lx * 0.05 * rad, cy + 0.4 * rad, 0.27 * rad
        s.add(f'<circle cx="{f(bx)}" cy="{f(by)}" r="{f(br)}" fill="{PAL["you"]}"/>')
        s.add(f'<circle cx="{f(bx)}" cy="{f(by)}" r="{f(br * 0.8)}" fill="none" stroke="{PAL["cream"]}" '
              f'stroke-width="{f(br * 0.07)}" stroke-dasharray="{f(br * 0.18)} {f(br * 0.12)}"/>')
        s.add(f'<text x="{f(bx)}" y="{f(by)}" font-family="{FONT_CN}" font-size="{f(br * 0.68)}" font-weight="900" '
              f'fill="{PAL["cream"]}" text-anchor="middle" dominant-baseline="central">朋友</text>')


def thread_with_heart(s, a, b, hc, hs):
    """粉色细线：从“我”(a) 到爱心，再到“你”(b)，自然下垂；爱心系在中间。"""
    (ax, ay), (bx, by), (hx, hy) = a, b, hc
    l, r = (hx - 0.9 * hs, hy + 0.15 * hs), (hx + 0.9 * hs, hy + 0.15 * hs)
    sag = 0.6 * hs
    d = (f"M{f(ax)},{f(ay)} Q{f((ax + l[0]) / 2)},{f(max(ay, l[1]) + sag)} {f(l[0])},{f(l[1])} "
         f"M{f(r[0])},{f(r[1])} Q{f((r[0] + bx) / 2)},{f(max(by, r[1]) + sag)} {f(bx)},{f(by)}")
    s.add(f'<path d="{d}" fill="none" stroke="{PAL["heart"]}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>')


def heart(s, cx, cy, size):
    glow(s, cx, cy, size * 2.6, PAL["heart"], 0.35)
    s.add(f'<path d="{HEART}" transform="translate({f(cx)},{f(cy)}) scale({f(size)})" fill="{PAL["heart"]}"/>')
    s.add(f'<circle cx="{f(cx - 0.45 * size)}" cy="{f(cy - 0.5 * size)}" r="{f(0.17 * size)}" fill="#fff" opacity="0.28"/>')


def confetti(s, items):
    for kind, x, y, k, color, rot in items:
        tr = f'transform="rotate({rot} {f(x)} {f(y)})"'
        if kind == "tri":
            pts = f"{f(x)},{f(y - k)} {f(x + 0.87 * k)},{f(y + 0.5 * k)} {f(x - 0.87 * k)},{f(y + 0.5 * k)}"
            s.add(f'<polygon points="{pts}" fill="{color}" opacity="0.9" {tr}/>')
        elif kind == "ring":
            s.add(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(k)}" fill="none" stroke="{color}" stroke-width="{f(k * 0.32)}" opacity="0.9"/>')
        else:   # square / diamond
            ang = rot + (45 if kind == "diamond" else 0)
            s.add(f'<rect x="{f(x - k)}" y="{f(y - k)}" width="{f(2 * k)}" height="{f(2 * k)}" fill="{color}" '
                  f'opacity="0.9" transform="rotate({ang} {f(x)} {f(y)})"/>')


def glyph(s, ch, x, y, size, color):
    common = (f'font-family="{FONT_CN}" font-size="{f(size)}" font-weight="900" text-anchor="middle" '
              f'dominant-baseline="central"')
    s.add(f'<text x="{f(x + 0.05 * size)}" y="{f(y + 0.07 * size)}" {common} fill="#07070f" opacity="0.5">{ch}</text>')
    s.add(f'<text x="{f(x)}" y="{f(y)}" {common} fill="{color}">{ch}</text>')


def title(s, cx, cy, size, gap, artist_size):
    """片名 + 珊瑚色下划线 + 演唱者（与动画片头同一套排版比例）。"""
    total = len(TITLE) * size + (len(TITLE) - 1) * gap
    glow(s, cx, cy, total * 0.72, "#3a3f86", 0.55, ry=size * 1.6)
    for i, ch in enumerate(TITLE):
        glyph(s, ch, cx - total / 2 + size / 2 + i * (size + gap), cy, size, TITLE_COLORS[i])
    hw, uh = total * 0.36, size * 0.045
    s.add(f'<rect x="{f(cx - hw)}" y="{f(cy + 0.64 * size)}" width="{f(2 * hw)}" height="{f(uh)}" rx="{f(uh / 2)}" fill="{PAL["me"]}"/>')
    ag = artist_size * 0.34
    for i, ch in enumerate(ARTIST):
        glyph(s, ch, cx + (i - 0.5) * (artist_size + ag), cy + 1.03 * size, artist_size, PAL["me_glow"])


def lyric_line(s, cx, y, size):
    spans = "".join(f'<tspan fill="{c}">{t}</tspan>' for t, c in LYRIC)
    s.add(f'<text x="{f(cx + size * 0.06)}" y="{f(y)}" font-family="{FONT_CN}" font-size="{f(size)}" font-weight="700" '
          f'text-anchor="middle" dominant-baseline="central" letter-spacing="{f(size * 0.12)}" opacity="0.78">{spans}</text>')


# ---------------------------------------------------------------- 三种版式
def cover_16x9():
    s, gy = Svg(1920, 1080, seed=11), 860
    avoid = [(110, 260, 1010, 650), moon_box(1745, 165, 54)]   # 片名 + 歌手 / 月亮
    sky(s, gy); stars(s, 150, 720, avoid); moon(s, 1745, 165, 54); bokeh(s, 14, gy, avoid)
    skyline(s, gy, lambda x: (110, 230) if x < 1020 else (170, 370))
    ground(s, gy)
    lamp(s, 1140, gy, 470, 250)
    me, you, hc, hs = (1262, 95), (1720, 120), (1495, 655), 50
    thread_with_heart(s, (me[0] + 0.9 * me[1], gy - me[1] + 8), (you[0] - 0.9 * you[1], gy - you[1] + 10), hc, hs)
    character(s, me[0], gy, me[1], PAL["me"], look=(1, -0.25), badge=True, glow_color=PAL["me_glow"])
    character(s, you[0], gy, you[1], PAL["you"], look=(-0.7, -0.15), glow_color=PAL["you"], glow_op=0.25)
    heart(s, *hc, hs)
    confetti(s, [("tri", 150, 150, 22, PAL["me"], 12), ("ring", 1000, 150, 17, PAL["you"], 0),
                 ("square", 1050, 560, 14, PAL["heart"], 20), ("diamond", 95, 640, 14, PAL["me_glow"], 0),
                 ("ring", 880, 700, 12, PAL["me"], 0), ("tri", 1440, 330, 18, PAL["heart"], -18),
                 ("square", 1850, 520, 12, PAL["you"], 30)])
    title(s, 560, 380, 200, 16, 76)
    return s


def cover_3x4():
    s, gy = Svg(1080, 1440, seed=23), 1180
    avoid = [(110, 240, 970, 610), moon_box(935, 120, 46)]
    sky(s, gy); stars(s, 120, 980, avoid); moon(s, 935, 120, 46); bokeh(s, 12, gy, avoid)
    skyline(s, gy, lambda x: (200, 420))
    ground(s, gy)
    lamp(s, 190, gy, 480, 240)
    me, you, hc, hs = (320, 90), (810, 115), (585, 905), 54
    thread_with_heart(s, (me[0] + 0.9 * me[1], gy - me[1] + 8), (you[0] - 0.9 * you[1], gy - you[1] + 10), hc, hs)
    character(s, me[0], gy, me[1], PAL["me"], look=(1, -0.25), badge=True, glow_color=PAL["me_glow"])
    character(s, you[0], gy, you[1], PAL["you"], look=(-0.7, -0.15), glow_color=PAL["you"], glow_op=0.25)
    heart(s, *hc, hs)
    confetti(s, [("tri", 110, 140, 20, PAL["me"], 12), ("ring", 975, 630, 15, PAL["you"], 0),
                 ("square", 95, 600, 13, PAL["heart"], 20), ("diamond", 560, 700, 11, PAL["me_glow"], 0),
                 ("tri", 760, 160, 16, PAL["heart"], -18)])
    title(s, 540, 350, 190, 16, 70)
    lyric_line(s, 540, 1325, 40)
    return s


def cover_9x16():
    s, gy = Svg(1080, 1920, seed=37), 1560
    avoid = [(90, 440, 990, 840), moon_box(905, 210, 56)]
    sky(s, gy); stars(s, 170, 1300, avoid); moon(s, 905, 210, 56); bokeh(s, 16, gy, avoid)
    skyline(s, gy, lambda x: (230, 520))
    ground(s, gy)
    lamp(s, 190, gy, 600, 260)
    me, you, hc, hs = (330, 100), (815, 128), (590, 1250), 62
    thread_with_heart(s, (me[0] + 0.9 * me[1], gy - me[1] + 8), (you[0] - 0.9 * you[1], gy - you[1] + 10), hc, hs)
    character(s, me[0], gy, me[1], PAL["me"], look=(1, -0.25), badge=True, glow_color=PAL["me_glow"])
    character(s, you[0], gy, you[1], PAL["you"], look=(-0.7, -0.15), glow_color=PAL["you"], glow_op=0.25)
    heart(s, *hc, hs)
    confetti(s, [("tri", 130, 250, 22, PAL["me"], 12), ("ring", 965, 900, 16, PAL["you"], 0),
                 ("square", 100, 860, 14, PAL["heart"], 20), ("diamond", 620, 960, 12, PAL["me_glow"], 0),
                 ("tri", 700, 330, 18, PAL["heart"], -18), ("ring", 300, 360, 11, PAL["me_glow"], 0)])
    title(s, 540, 560, 200, 18, 74)
    lyric_line(s, 540, 1735, 46)
    return s


FORMATS = {"cover-16x9": cover_16x9, "cover-3x4": cover_3x4, "cover-9x16": cover_9x16}


def export_png(svg_path, png_path, w, h):
    profile = tempfile.mkdtemp(prefix="poster_")
    try:
        subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--no-first-run", f"--user-data-dir={profile}",
                        "--hide-scrollbars", f"--window-size={w},{h}", "--force-device-scale-factor=1",
                        f"--screenshot={png_path}", svg_path.as_uri()], capture_output=True, timeout=120)
    finally:
        shutil.rmtree(profile, ignore_errors=True)


def main():
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    for name, build in FORMATS.items():
        s = build()
        svg_path, png_path = HERE / f"{name}.svg", PNG_DIR / f"{name}.png"
        svg_path.write_text(s.text(), encoding="utf-8")
        if png_path.exists():
            png_path.unlink()
        export_png(svg_path, png_path, s.w, s.h)
        png_size = png_path.stat().st_size if png_path.exists() else 0
        print(f"{name}: {s.w}x{s.h}  svg {svg_path.stat().st_size} B  png {png_size} B")
        if not png_size:
            raise SystemExit(f"PNG 导出失败：{png_path}")


if __name__ == "__main__":
    main()
