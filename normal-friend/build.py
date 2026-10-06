"""build.py — 把 src/ 下的 style.css 与所有 js 按固定顺序内联进 template.html，
输出零外部依赖的单文件 index.html（file:// 双击即可打开）。

用法：python mg-animation/build.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "index.html"

TEMPLATE = "template.html"
STYLE = "style.css"
# 固定顺序：后面的文件依赖前面文件定义的全局函数/常量。新增场景文件请按顺序加到 player.js 之前。
JS_ORDER = [
    "core.js",        # 常量、缓动、随机、绘图工具
    "timeline.js",    # TOTAL / BPM / LYRIC_OFFSET / LYRICS / SCENES / SCENE_IMPL
    "characters.js",  # 角色与共用绘制件
    "lyrics.js",      # 歌词区与中央大字
    "scenes_a.js",    # S0–S3 共用布景 + S0 片头
    "scenes_a1.js",   # S1 等待
    "scenes_a2.js",   # S2 我猜 / 失败 / 深渊（含下坠 drawDive）
    "scenes_a3.js",   # S3 前半：改变 / VHS 倒带 / 拍立得
    "scenes_a4.js",   # S3 后半：深海 / 气球 / 气泡（登记 SCENE_IMPL.S3）
    "scenes_b.js",    # S4 共用件 + 85–95（气泡 / 徽章 / 聚光）
    "scenes_b1.js",   # S4 95–113（胸口货架 / 不是情人 / 信 / 回旋镖）
    "scenes_b2.js",   # S4 113–126 + 歌词分派（登记 SCENE_IMPL.S4）
    "scenes_b3.js",   # S5 间奏（登记 SCENE_IMPL.S5）
    "scenes_c.js",    # S6 共用件 + 134–147（问号 / “…”气泡 / 对勾 / 碎心）
    "scenes_c1.js",   # S6 147–162（螺旋下坠 / 极小的我 / 配饰 / 磁带倒带）
    "scenes_c2.js",   # S6 162–178（回声 / 树根 / 拉手 / 气泡，登记 SCENE_IMPL.S6）
    "scenes_c3.js",   # S7 副歌二（复用 S4 + 强化，登记 SCENE_IMPL.S7）
    "scenes_d.js",    # S8 版式与文字工具（分屏 / 堆叠 / 环形 / 跑马灯 / 删除线）
    "scenes_d1.js",   # S8 椭圆轨道 + 歌词分派（登记 SCENE_IMPL.S8）
    "scenes_d2.js",   # S9 片尾（登记 SCENE_IMPL.S9，257 秒定格）
    "player.js",      # 主循环、UI、录制（最后加载，加载即启动）
]

STYLE_MARK = "/*@@STYLE@@*/"
SCRIPTS_MARK = "<!--@@SCRIPTS@@-->"


def read(name: str) -> str:
    p = SRC / name
    if not p.is_file():
        sys.exit(f"[build] 缺少源文件: {p}")
    text = p.read_text(encoding="utf-8-sig")  # 容忍 BOM
    if not text.strip():
        sys.exit(f"[build] 源文件为空: {p}")
    return text.replace("\r\n", "\n")


def main() -> None:
    tpl = read(TEMPLATE)
    for mark in (STYLE_MARK, SCRIPTS_MARK):
        if tpl.count(mark) != 1:
            sys.exit(f"[build] template.html 中占位符 {mark} 必须恰好出现一次")

    css = read(STYLE)
    if re.search(r"</style", css, re.I):
        sys.exit("[build] style.css 中不能包含 </style")

    blocks = []
    for name in JS_ORDER:
        js = read(name)
        if re.search(r"</script", js, re.I):
            sys.exit(f"[build] {name} 中不能包含 </script（会提前结束内联脚本）")
        blocks.append(f"<script>\n// ===== src/{name} =====\n{js.rstrip()}\n</script>")
        print(f"[build] + {name:<15} {len(js.encode('utf-8')):>8} bytes")

    html = tpl.replace(STYLE_MARK, css.rstrip()).replace(SCRIPTS_MARK, "\n".join(blocks))
    if re.search(r"<(script|link)[^>]+(src|href)\s*=\s*[\"']?https?:", html, re.I):
        sys.exit("[build] 检测到外部依赖（http/https 资源），单文件必须零外部依赖")

    OUT.write_text(html, encoding="utf-8", newline="\n")
    size = OUT.stat().st_size
    if size == 0:
        sys.exit("[build] 输出文件为空")
    print(f"[build] -> {OUT} ({size} bytes)")


if __name__ == "__main__":
    main()
