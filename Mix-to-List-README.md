**▶  Mix→List**

YouTube Mix → Playlist Converter  ·  Chrome Extension

Version 2.0  ·  Manifest V3  ·  YouTube Data API v3

## **Overview**
Mix→List is a Chrome extension that converts any YouTube Mix (auto-generated radio playlist) into a real, saved, shareable YouTube playlist — automatically. No manual track-by-track saving required.

Once set up, the flow is: **open a Mix → scan queue → click Create → done.** The extension handles Google sign-in, playlist creation, and adding every track via the YouTube Data API.

### **Features**
- One-click Google OAuth sign-in (no API keys to copy-paste)
- Scans the YouTube queue panel and extracts all loaded tracks
- Creates a real YouTube playlist on your account via the YouTube Data API v3
- Adds every track automatically with a live progress bar
- Choose Public, Unlisted, or Private privacy before creating
- Returns a shareable playlist URL when done
- Export fallbacks: Copy Links, Copy Titles, CSV, JSON
- Works on both youtube.com and music.youtube.com

## **File Structure**

|**File**|**Purpose**|
| :- | :- |
|**manifest.json**|Extension config, permissions, OAuth client ID placeholder|
|**background.js**|Service worker — OAuth token management + all YouTube API calls|
|**content.js**|Injected into YouTube tabs — scrapes the queue panel DOM|
|**popup.html**|Extension popup UI (4 screens: sign-in, scan, progress, success)|
|**popup.js**|Popup logic — auth flow, scanning, track rendering, export|
|**icons/**|Extension icons at 16×16, 48×48, 128×128 px|
|**SETUP.md**|Quick setup reference (this document is the full version)|
|**README.md**|Concise project overview|


# **Setup Guide**
Follow these six steps once. After setup the extension works automatically every time.

|ℹ️  Before you start: make sure the extension is already loaded in Chrome in Developer mode. If not, see the Installation section below first.|
| :- |

## **Step 1 — Create a Google Cloud Project**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in with your Google account.
2. Click the project dropdown at the very top of the page (it may say "Select a project" or show an existing name).
3. In the popup that appears, click "New Project" in the top-right corner.
4. Give the project any name — e.g. mix-to-playlist — then click Create.
5. After a few seconds, use the top dropdown to switch to your new project. Make sure it is selected before continuing.

## **Step 2 — Enable the YouTube Data API**
1. In the left sidebar, click APIs & Services → Library.
2. Search for **YouTube Data API v3** and press Enter.
3. Click the result called "YouTube Data API v3".
4. Click the blue Enable button and wait for it to activate.

## **Step 3 — Configure the OAuth Consent Screen**
This screen tells Google what your app is when users are asked to approve access.

1. In the left sidebar click APIs & Services → OAuth consent screen.
2. Go to Audience tab -> Add Test users(your email address you want to sign-in with to use the extension) or publish it for free to use.
OR 
2. Select External → click Create.
3. Fill in the required fields:
   - **App name:** anything you like, e.g. Mix to Playlist
   - **User support email:** select your Gmail from the dropdown
   - **Developer contact email:** type your Gmail at the bottom of the page
4. Click Save and Continue through the Scopes page without adding anything.
5. On the Test Users page, click + Add Users, enter your Gmail address, and click Add.

|⚠️  This step is critical. While the app is in "Testing" mode, only Gmail addresses listed here can sign in. Add the address you will use to sign into the extension.|
| :- |

1. Click Save and Continue → then Back to Dashboard.

## **Step 4 — Create OAuth 2.0 Credentials**
1. In the left sidebar click APIs & Services → Credentials.
2. Click + Create Credentials at the top → choose OAuth client ID.
3. For Application type, select **Chrome Extension** from the dropdown.
4. For Item ID, you need your extension's ID:
   - Open a new tab and navigate to chrome://extensions
   - Find Mix→List in the list and copy the long ID string below its name
   - It looks like: abcdefghijklmnopqrstuvwxyz123456
   - Paste that ID into the Item ID field in Google Cloud
5. Click Create.
6. A dialog shows your **Client ID** — it looks like: 123456789-xxxxxxxx.apps.googleusercontent.com. Copy it.

## **Step 5 — Add the Client ID to manifest.json**
1. Open the yt-mix-exporter folder on your computer.
2. Open manifest.json in any text editor (Notepad, VS Code, TextEdit, etc.).
3. Find this line near the top:

|"client\_id": "YOUR\_CLIENT\_ID\_HERE.apps.googleusercontent.com"|
| :- |

4. Replace the entire value with the Client ID you copied in Step 4:

|"client\_id": "123456789-xxxxxxxx.apps.googleusercontent.com"|
| :- |

5. Save the file (Ctrl+S on Windows / Cmd+S on Mac).

## **Step 6 — Reload the Extension**
1. Go to chrome://extensions in Chrome.
2. Find Mix→List and click the ↺ refresh icon on its card.
3. Click the extension icon in your Chrome toolbar to open the popup.
4. Click Sign in with Google and sign in with the Gmail you added as a test user.

|✅  Done! After signing in once, the extension remembers your account. You will not need to sign in again unless you explicitly sign out.|
| :- |


# **Installation**
## **Loading the Extension in Chrome**
1. Download the yt-mix-exporter.zip file and unzip it to a permanent folder on your computer.

|⚠️  Do not delete the folder after loading — Chrome loads the extension from this folder live. If you move or delete it, the extension will stop working.|
| :- |

2. Open Chrome and navigate to chrome://extensions
3. Toggle Developer mode ON using the switch in the top-right corner of the page.
4. Click Load unpacked.
5. Select the yt-mix-exporter folder (not the zip file, the folder inside it).
6. The Mix→List extension will appear in the list. Pin it to your toolbar by clicking the puzzle icon → pin icon next to Mix→List.
7. Now follow the Setup Guide above to connect your Google account.

# **How to Use**
1. On YouTube, open any Mix or Radio playlist. The URL will contain 

|https://www.youtube.com/watch?v=...&list=RD...|
| :- |

2. Click the queue icon on the right side of the YouTube player to open the queue panel. Scroll down in the queue to load more tracks before scanning.
3. Click the Mix→List extension icon in your toolbar.
4. Click Scan Queue — your tracks appear in the popup instantly.
5. Edit the playlist name and choose a privacy setting (Public, Unlisted, or Private).
6. Click ✨ Create Playlist on YouTube.
7. Watch the progress bar as each track is added. When complete, a shareable playlist URL appears.
8. Click Open in YouTube to view your new playlist, or click the URL box to copy it.

# **API Quota & Limits**
The YouTube Data API v3 provides 10,000 free units per day per Google Cloud project.

|**Operation**|**Cost**|
| :- | :- |
|Create playlist|50 units|
|Add one track|50 units|
|**Daily free quota**|**10,000 units → ~199 tracks/day**|

For personal use this is more than enough. If you hit the daily limit, wait 24 hours for the quota to reset automatically.

# **Privacy & Permissions**
## **What the Extension Can Access**

|**Permission**|**Why it is needed**|
| :- | :- |
|**activeTab**|Read the URL and title of the current YouTube tab|
|**scripting**|Inject the queue scraper (content.js) into YouTube pages|
|**storage**|Cache progress data between background worker and popup|
|**identity**|Handle Google OAuth token — required to call YouTube API|
|**youtube.com**|Access the YouTube queue panel DOM to extract track info|
|**googleapis.com**|Make authenticated calls to the YouTube Data API v3|

|🔒  No data is sent to any third-party servers. All processing happens locally in your browser. You can revoke access at any time at myaccount.google.com/permissions.|
| :- |
