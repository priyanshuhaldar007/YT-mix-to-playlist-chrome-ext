// background.js — service worker
// Handles OAuth token acquisition and all YouTube Data API calls

const YT_API = "https://www.googleapis.com/youtube/v3";

// ── Message router ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.action) {
        case "GET_AUTH_TOKEN":
          sendResponse(await getAuthToken(msg.interactive));
          break;
        case "SIGN_OUT":
          sendResponse(await signOut());
          break;
        case "GET_USER_INFO":
          sendResponse(await getUserInfo());
          break;
        case "CREATE_PLAYLIST":
          sendResponse(await createPlaylist(msg.name, msg.description, msg.privacy));
          break;
        case "ADD_TRACKS":
          sendResponse(await addTracksToPlaylist(msg.playlistId, msg.videoIds, msg.onProgress));
          break;
        case "CREATE_AND_FILL_PLAYLIST":
          sendResponse(await createAndFillPlaylist(msg.name, msg.description, msg.privacy, msg.videoIds, msg.tabId));
          break;
        default:
          sendResponse({ error: "Unknown action" });
      }
    } catch (err) {
      sendResponse({ error: err.message || String(err) });
    }
  })();
  return true; // keep channel open
});

// ── Auth ──────────────────────────────────────────────────────────────────────
async function getAuthToken(interactive = false) {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message, token: null });
      } else {
        resolve({ token });
      }
    });
  });
}

async function signOut() {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, () => {
          // Also revoke server-side
          fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).catch(() => {});
          resolve({ success: true });
        });
      } else {
        resolve({ success: true });
      }
    });
  });
}

async function getUserInfo() {
  const { token, error } = await getAuthToken(false);
  if (error || !token) return { user: null };

  const resp = await fetch(
    "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!resp.ok) return { user: null };
  const user = await resp.json();
  return { user };
}

// ── YouTube API helpers ───────────────────────────────────────────────────────
async function ytFetch(path, options = {}) {
  const { token, error } = await getAuthToken(false);
  if (error || !token) throw new Error("Not authenticated");

  const url = path.startsWith("http") ? path : `${YT_API}${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    const msg = body?.error?.message || `HTTP ${resp.status}`;
    throw new Error(msg);
  }

  return resp.json();
}

// ── Create playlist ───────────────────────────────────────────────────────────
async function createPlaylist(name, description = "", privacy = "public") {
  const data = await ytFetch("/playlists?part=snippet,status", {
    method: "POST",
    body: JSON.stringify({
      snippet: { title: name, description },
      status: { privacyStatus: privacy }
    })
  });
  return { playlistId: data.id, playlistUrl: `https://www.youtube.com/playlist?list=${data.id}` };
}

// ── Add tracks (with rate limiting) ──────────────────────────────────────────
async function addTracksToPlaylist(playlistId, videoIds, _onProgress) {
  const results = { added: 0, failed: 0, errors: [] };

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    try {
      await ytFetch("/playlistItems?part=snippet", {
        method: "POST",
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: { kind: "youtube#video", videoId }
          }
        })
      });
      results.added++;
    } catch (err) {
      results.failed++;
      results.errors.push({ videoId, error: err.message });
    }

    // Notify popup of progress via storage (can't use direct messaging from SW)
    await chrome.storage.local.set({
      addProgress: { current: i + 1, total: videoIds.length, added: results.added, failed: results.failed }
    });

    // Small delay to avoid quota bursting (YouTube API: 50 units per insert)
    await sleep(150);
  }

  return results;
}

// ── Combined: create + fill ───────────────────────────────────────────────────
async function createAndFillPlaylist(name, description, privacy, videoIds, _tabId) {
  // 1. Create the playlist
  const { playlistId, playlistUrl } = await createPlaylist(name, description, privacy);

  // 2. Add all tracks
  const results = await addTracksToPlaylist(playlistId, videoIds);

  return { playlistId, playlistUrl, ...results };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
