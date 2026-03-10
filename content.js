// content.js — injected into youtube.com and music.youtube.com

(function () {
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === "SCRAPE_QUEUE") {
      const tracks = scrapeTracks();
      sendResponse({ tracks });
    }
    if (msg.action === "CHECK_MIX") {
      sendResponse({ isMix: isMixPage() });
    }
    return true; // keep channel open for async
  });

  function isMixPage() {
    const url = window.location.href;
    // YouTube Mix: list=RD... or list=RDMM...
    // YouTube Music: similar patterns
    return (
      /[?&]list=RD/i.test(url) ||
      /[?&]list=RDMM/i.test(url) ||
      /[?&]list=RDCLAK/i.test(url) ||
      document.title.toLowerCase().includes("mix") ||
      !!document.querySelector('yt-formatted-string.title')?.textContent?.toLowerCase().includes("mix")
    );
  }

  function scrapeTracks() {
    const tracks = [];
    const seen = new Set();

    // ── YouTube (desktop) ──────────────────────────────────────────────
    // Queue panel items: ytd-playlist-panel-video-renderer
    document.querySelectorAll("ytd-playlist-panel-video-renderer").forEach((el) => {
      const titleEl = el.querySelector("#video-title");
      const channelEl = el.querySelector(".byline");
      const linkEl = el.querySelector("a#wc-endpoint, a.yt-simple-endpoint");
      const thumbEl = el.querySelector("img");

      const title = titleEl?.textContent?.trim();
      const artist = channelEl?.textContent?.trim() || "";
      const href = linkEl?.href || "";
      const videoId = extractVideoId(href);
      const thumb = thumbEl?.src || thumbEl?.getAttribute("data-thumb") || "";

      if (title && videoId && !seen.has(videoId)) {
        seen.add(videoId);
        tracks.push({ title, artist, videoId, thumb, url: `https://www.youtube.com/watch?v=${videoId}` });
      }
    });

    // ── YouTube Music ──────────────────────────────────────────────────
    if (tracks.length === 0) {
      // ytmusic-player-queue-item
      document.querySelectorAll("ytmusic-player-queue-item").forEach((el) => {
        const titleEl = el.querySelector(".song-title, .title");
        const artistEl = el.querySelector(".byline, .secondary-flex-columns");
        const videoId = el.getAttribute("video-id") || el.getAttribute("data-video-id") || extractVideoIdFromEl(el);
        const thumb = el.querySelector("img")?.src || "";

        const title = titleEl?.textContent?.trim();
        const artist = artistEl?.textContent?.trim() || "";

        if (title && videoId && !seen.has(videoId)) {
          seen.add(videoId);
          tracks.push({ title, artist, videoId, thumb, url: `https://music.youtube.com/watch?v=${videoId}` });
        }
      });
    }

    // ── Fallback: scan all visible queue-like list items ───────────────
    if (tracks.length === 0) {
      document.querySelectorAll("[data-video-id]").forEach((el) => {
        const videoId = el.getAttribute("data-video-id");
        const title =
          el.querySelector(".title, [title]")?.textContent?.trim() ||
          el.getAttribute("title") ||
          "";
        const artist = el.querySelector(".subtitle, .byline")?.textContent?.trim() || "";
        const thumb = el.querySelector("img")?.src || "";

        if (title && videoId && !seen.has(videoId)) {
          seen.add(videoId);
          tracks.push({ title, artist, videoId, thumb, url: `https://www.youtube.com/watch?v=${videoId}` });
        }
      });
    }

    return tracks;
  }

  function extractVideoId(url) {
    if (!url) return null;
    const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function extractVideoIdFromEl(el) {
    // Try finding a link inside the element
    const link = el.querySelector("a[href*='v=']");
    return link ? extractVideoId(link.href) : null;
  }
})();
