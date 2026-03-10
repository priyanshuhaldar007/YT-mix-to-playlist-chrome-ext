// popup.js — v2 with OAuth + YouTube Data API

let tracks = [];
let selectedPrivacy = "public";
let createdPlaylistUrl = "";
let progressInterval = null;

// ── DOM ───────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const statusDot      = $("statusDot");
const statusText     = $("statusText");
const userPill       = $("userPill");
const userAvatar     = $("userAvatar");
const userName       = $("userName");
const setupBanner    = $("setupBanner");

const signInSection  = $("signInSection");
const mainSection    = $("mainSection");
const progressSection= $("progressSection");
const successSection = $("successSection");

const btnSignIn      = $("btnSignIn");
const btnSignOut     = $("btnSignOut");
const btnScan        = $("btnScan");
const scanLabel      = $("scanLabel");
const scanSpinner    = $("scanSpinner");
const emptyState     = $("emptyState");
const tracksSection  = $("tracksSection");
const tracksList     = $("tracksList");
const countBadge     = $("countBadge");
const playlistName   = $("playlistName");
const privacyRow     = $("privacyRow");
const btnCreate      = $("btnCreate");
const createLabel    = $("createLabel");
const createSpinner  = $("createSpinner");
const btnRescan      = $("btnRescan");
const btnCopyLinks   = $("btnCopyLinks");
const btnCopyTitles  = $("btnCopyTitles");
const btnExportCSV   = $("btnExportCSV");
const btnExportJSON  = $("btnExportJSON");
const progressText   = $("progressText");
const progressCount  = $("progressCount");
const progressFill   = $("progressFill");
const progressStatus = $("progressStatus");
const successSub     = $("successSub");
const playlistUrlBox = $("playlistUrlBox");
const btnOpenPlaylist= $("btnOpenPlaylist");
const btnStartOver   = $("btnStartOver");
const toast          = $("toast");

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  // Check if client_id is still a placeholder
  const mf = await fetch(chrome.runtime.getURL("manifest.json")).then(r => r.json());
  if (!mf.oauth2?.client_id || mf.oauth2.client_id.includes("YOUR_CLIENT_ID")) {
    setupBanner.classList.remove("hidden");
    setStatus("red", "OAuth Client ID not configured.");
    btnSignIn.disabled = true;
    return;
  }

  setStatus("pulse", "Checking sign-in status…");
  const { token } = await bg("GET_AUTH_TOKEN", { interactive: false });

  if (token) {
    await loadUser();
    showScreen("main");
    await checkTab();
  } else {
    setStatus("blue", "Sign in to create playlists automatically.");
    showScreen("signIn");
  }
})();

// ── Auth ──────────────────────────────────────────────────────────────────────
btnSignIn.addEventListener("click", async () => {
  btnSignIn.disabled = true;
  setStatus("pulse", "Waiting for Google sign-in…");

  const { token, error } = await bg("GET_AUTH_TOKEN", { interactive: true });
  if (error || !token) {
    setStatus("red", error || "Sign-in cancelled.");
    btnSignIn.disabled = false;
    return;
  }

  await loadUser();
  showScreen("main");
  await checkTab();
});

btnSignOut.addEventListener("click", async () => {
  await bg("SIGN_OUT");
  userPill.classList.add("hidden");
  btnSignOut.classList.add("hidden");
  showScreen("signIn");
  setStatus("blue", "Signed out.");
});

async function loadUser() {
  const { user } = await bg("GET_USER_INFO");
  if (user) {
    userPill.classList.remove("hidden");
    btnSignOut.classList.remove("hidden");
    userAvatar.src = user.picture || "";
    userName.textContent = user.given_name || user.name || "You";
  }
}

// ── Tab check ─────────────────────────────────────────────────────────────────
async function checkTab() {
  const tab = await getActiveTab();
  if (!tab?.url?.includes("youtube.com")) {
    setStatus("red", "Open a YouTube Mix tab first.");
    return;
  }

  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { action: "CHECK_MIX" });
    if (resp?.isMix) {
      setStatus("green", "Mix detected — ready to scan.");
    } else {
      setStatus("red", "No Mix on this page. Navigate to one.");
      emptyState.classList.remove("hidden");
    }
  } catch {
    setStatus("red", "Reload the YouTube tab, then try again.");
  }

  // Pre-fill name from tab title
  const title = tab.title?.replace(/[-–] YouTube.*$/i, "").trim();
  if (title) playlistName.value = title + " (Saved)";
}

// ── Privacy selector ──────────────────────────────────────────────────────────
privacyRow.querySelectorAll(".privacy-opt").forEach(opt => {
  opt.addEventListener("click", () => {
    privacyRow.querySelectorAll(".privacy-opt").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    selectedPrivacy = opt.dataset.val;
  });
});

// ── Scan ──────────────────────────────────────────────────────────────────────
btnScan.addEventListener("click", doScan);
btnRescan.addEventListener("click", doScan);

async function doScan() {
  const tab = await getActiveTab();
  if (!tab) return;

  setScanLoading(true);
  setStatus("pulse", "Scanning queue…");

  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_QUEUE" });
    tracks = resp?.tracks || [];

    if (tracks.length === 0) {
      setStatus("red", "No tracks found — open the queue panel first.");
      emptyState.classList.remove("hidden");
      tracksSection.classList.add("hidden");
      setScanLoading(false);
      return;
    }

    emptyState.classList.add("hidden");
    tracksSection.classList.remove("hidden");
    renderTracks(tracks);
    setStatus("green", `Found ${tracks.length} track${tracks.length !== 1 ? "s" : ""} — ready to create.`);
  } catch (err) {
    setStatus("red", "Scan failed — reload the YouTube tab.");
    console.error(err);
  }

  setScanLoading(false);
}

// ── Render tracks ─────────────────────────────────────────────────────────────
function renderTracks(list) {
  countBadge.textContent = list.length;
  tracksList.innerHTML = "";
  list.forEach((t, i) => {
    const el = document.createElement("div");
    el.className = "track-item";
    el.innerHTML = `
      <span class="track-num">${i + 1}</span>
      ${t.thumb ? `<img class="track-thumb" src="${t.thumb}" alt="" />` : `<div class="track-ph">🎵</div>`}
      <div class="track-info">
        <div class="track-title" title="${esc(t.title)}">${esc(t.title)}</div>
        ${t.artist ? `<div class="track-artist">${esc(t.artist)}</div>` : ""}
      </div>
      <button class="track-remove" title="Remove" data-idx="${i}">✕</button>
    `;
    tracksList.appendChild(el);
  });
  tracksList.querySelectorAll(".track-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      tracks.splice(parseInt(btn.dataset.idx, 10), 1);
      renderTracks(tracks);
    });
  });
}

// ── Create playlist ───────────────────────────────────────────────────────────
btnCreate.addEventListener("click", async () => {
  if (!tracks.length) return;

  const name = playlistName.value.trim() || "My Mix Playlist";
  const videoIds = tracks.map(t => t.videoId);

  // Switch to progress screen
  showScreen("progress");
  setStatus("pulse", "Creating playlist…");
  progressFill.style.width = "0%";
  progressCount.textContent = `0 / ${videoIds.length}`;
  progressText.textContent = "Creating playlist on YouTube…";

  // Poll chrome.storage for progress updates from background
  await chrome.storage.local.remove("addProgress");
  progressInterval = setInterval(async () => {
    const { addProgress } = await chrome.storage.local.get("addProgress");
    if (addProgress) {
      const pct = Math.round((addProgress.current / addProgress.total) * 100);
      progressFill.style.width = pct + "%";
      progressCount.textContent = `${addProgress.current} / ${addProgress.total}`;
      progressText.textContent = `Adding tracks… (${addProgress.added} added, ${addProgress.failed} failed)`;
    }
  }, 300);

  try {
    const result = await bg("CREATE_AND_FILL_PLAYLIST", {
      name,
      description: `Saved from YouTube Mix on ${new Date().toLocaleDateString()}`,
      privacy: selectedPrivacy,
      videoIds
    });

    clearInterval(progressInterval);
    await chrome.storage.local.remove("addProgress");

    if (result.error) throw new Error(result.error);

    createdPlaylistUrl = result.playlistUrl;
    showScreen("success");
    setStatus("green", "Playlist created successfully!");
    successSub.textContent = `${result.added} track${result.added !== 1 ? "s" : ""} added${result.failed ? `, ${result.failed} failed` : ""}.`;
    playlistUrlBox.textContent = result.playlistUrl;
    progressFill.style.width = "100%";

  } catch (err) {
    clearInterval(progressInterval);
    showScreen("main");
    tracksSection.classList.remove("hidden");
    setStatus("red", "Error: " + (err.message || "Unknown error"));
    console.error(err);
  }
});

// ── Success screen ────────────────────────────────────────────────────────────
playlistUrlBox.addEventListener("click", async () => {
  await copyText(createdPlaylistUrl);
  showToast("✓ URL copied!");
});

btnOpenPlaylist.addEventListener("click", () => {
  if (createdPlaylistUrl) chrome.tabs.create({ url: createdPlaylistUrl });
});

btnStartOver.addEventListener("click", async () => {
  tracks = [];
  createdPlaylistUrl = "";
  tracksSection.classList.add("hidden");
  emptyState.classList.remove("hidden");
  showScreen("main");
  await checkTab();
});

// ── Export buttons ────────────────────────────────────────────────────────────
btnCopyLinks.addEventListener("click", async () => {
  await copyText(tracks.map(t => t.url).join("\n"));
  showToast("✓ Links copied!");
});
btnCopyTitles.addEventListener("click", async () => {
  await copyText(tracks.map((t, i) => `${i + 1}. ${t.title}${t.artist ? " — " + t.artist : ""}`).join("\n"));
  showToast("✓ Track list copied!");
});
btnExportCSV.addEventListener("click", () => {
  const rows = [["#","Title","Artist","URL","VideoID"], ...tracks.map((t,i) => [i+1, csvEsc(t.title), csvEsc(t.artist), t.url, t.videoId])];
  downloadFile(rows.map(r => r.join(",")).join("\n"), getPlaylistName() + ".csv", "text/csv");
  showToast("✓ CSV downloaded!");
});
btnExportJSON.addEventListener("click", () => {
  downloadFile(JSON.stringify({ name: getPlaylistName(), exportedAt: new Date().toISOString(), trackCount: tracks.length, tracks }, null, 2), getPlaylistName() + ".json", "application/json");
  showToast("✓ JSON downloaded!");
});

// ── Screen management ─────────────────────────────────────────────────────────
function showScreen(name) {
  signInSection.classList.add("hidden");
  mainSection.classList.add("hidden");
  progressSection.classList.add("hidden");
  successSection.classList.add("hidden");
  if (name === "signIn")   { signInSection.classList.remove("hidden"); btnSignOut.classList.add("hidden"); }
  if (name === "main")     { mainSection.classList.remove("hidden"); }
  if (name === "progress") { progressSection.classList.remove("hidden"); }
  if (name === "success")  { successSection.classList.remove("hidden"); }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function bg(action, data = {}) {
  return chrome.runtime.sendMessage({ action, ...data });
}

function getActiveTab() {
  return new Promise(resolve => chrome.tabs.query({ active: true, currentWindow: true }, t => resolve(t[0] || null)));
}

function setStatus(type, text) {
  statusText.textContent = text;
  statusDot.className = "status-dot";
  if (type === "green") statusDot.classList.add("green");
  if (type === "red")   statusDot.classList.add("red");
  if (type === "blue")  statusDot.classList.add("blue");
  if (type === "pulse") statusDot.classList.add("pulse");
}

function setScanLoading(on) {
  btnScan.disabled = on;
  scanLabel.classList.toggle("hidden", on);
  scanSpinner.classList.toggle("hidden", !on);
}

function getPlaylistName() { return playlistName.value.trim() || "My Mix Playlist"; }

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { const ta = Object.assign(document.createElement("textarea"), { value: text }); document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
}

function downloadFile(content, filename, mime) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([content], { type: mime })), download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg; toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function esc(s = "") { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function csvEsc(s = "") { return `"${String(s).replace(/"/g,'""')}"`; }
