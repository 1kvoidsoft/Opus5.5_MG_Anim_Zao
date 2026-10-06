# Opus5.5_MG_Anim_Zao

A self-contained Canvas motion-graphics animation for Tao Zhe's **《普通朋友》**, created with Opus 5.5.

## Contents

- `index.html` — generated, zero-dependency browser build.
- `src/` — modular source files for the timeline, lyrics, characters, scenes, and player.
- `build.py` — rebuilds `index.html` from `src/template.html`, `src/style.css`, and the ordered JavaScript scene files.
- `poster/` — SVG and PNG cover artwork matching the animation.

## Run locally

Open `index.html` directly in a modern browser, or serve the folder over HTTP:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000/>.

To regenerate the bundled page after editing the source files:

```powershell
python build.py
```

The animation loads without external assets. Use **加载音频** in the player to choose a local, legally obtained audio file when you want synchronized playback or recording. The browser recording control exports a WebM file locally.
