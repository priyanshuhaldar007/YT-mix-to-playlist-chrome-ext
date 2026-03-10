# Mix→List  🎵  YouTube Mix to Playlist Converter

A Chrome/Edge browser extension that lets you **save any YouTube Mix (auto-generated radio playlist) as a real, shareable playlist** — with one click.

---

## ✨ Features

- **Scan Queue** — Extracts all tracks currently loaded in the YouTube Mix queue
- **Remove tracks** — Edit the list before exporting
- **Copy Links** — All YouTube URLs to clipboard
- **Copy Track List** — Numbered title/artist list to clipboard
- **Export CSV** — Spreadsheet-ready export
- **Export JSON** — Full structured data export
- **Open as Playlist in YouTube** — Opens all tracks as a YouTube watch_videos playlist and copies the shareable URL

Works on both **youtube.com** and **music.youtube.com**.

---

## 🚀 Installation (Developer Mode)

1. **Download / unzip** this folder somewhere on your computer.
2. Open Chrome (or Edge) and go to: `chrome://extensions`
3. Toggle **Developer mode** ON (top-right corner).
4. Click **"Load unpacked"**.
5. Select the `yt-mix-exporter` folder.
6. The extension icon will appear in your toolbar. Pin it for easy access.

---

## 📖 How to Use

1. On YouTube, start playing any **Mix** or **Radio** playlist  
   *(URL will contain `?list=RD...` or similar)*
2. **Open the queue panel** on the right side so the tracks are visible in the DOM
3. Click the **Mix→List** extension icon in your toolbar
4. Click **"Scan Queue"** — your tracks appear instantly
5. Name your playlist and choose an export option:
   - **Copy Links** → paste into any playlist tool or share directly
   - **Export CSV** → open in Excel / Google Sheets
   - **Export JSON** → use with automation tools
   - **Open as Playlist in YouTube** → creates a `watch_videos` URL that YouTube recognises as a playlist session (URL is also copied to clipboard for sharing)

---

## ⚠️ Limitations

- YouTube Mixes are **dynamically generated** — only tracks currently loaded in the queue panel are captured. Scroll down in the queue to load more before scanning.
- The **"Open as Playlist"** feature uses YouTube's `watch_videos` endpoint. This is a temporary session playlist — to make it permanent, click **"Save"** in YouTube's own UI after it opens.
- YouTube frequently updates its DOM — if scraping stops working after a YouTube update, the selectors in `content.js` may need updating.

---

## 🗂 Files

```
yt-mix-exporter/
├── manifest.json     Extension manifest (MV3)
├── content.js        DOM scraper injected into YouTube tabs
├── popup.html        Extension popup UI
├── popup.js          Popup logic & export functions
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🔒 Permissions

| Permission | Why |
|---|---|
| `activeTab` | Read the current YouTube tab |
| `scripting` | Inject the queue scraper |
| `storage` | (Reserved for future settings) |
| `youtube.com/*` | Access YouTube queue DOM |
| `music.youtube.com/*` | Access YouTube Music queue DOM |

No data is sent to any server. Everything runs locally in your browser.
