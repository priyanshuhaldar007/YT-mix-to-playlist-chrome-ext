# 🔧 Setup Guide — Mix→Playlist Extension

Follow these steps **once** to connect the extension to your Google account so it can create playlists automatically.

---

## Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **"New Project"**
3. Name it anything (e.g. `mix-to-playlist`) → click **Create**
4. Make sure the new project is selected in the top dropdown

---

## Step 2 — Enable the YouTube Data API

1. In the left sidebar go to **APIs & Services → Library**
2. Search for **"YouTube Data API v3"**
3. Click it → click **Enable**

---

## Step 3 — Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** → click **Create**
3. Fill in the required fields:
   - **App name**: Mix→Playlist (or anything you like)
   - **User support email**: your Gmail address
   - **Developer contact email**: your Gmail address
4. Click **Save and Continue** through the rest of the steps (Scopes, Test Users)
5. On the **Test Users** page → click **Add Users** → add your own Gmail address
   > ⚠️ This is required while the app is in "Testing" mode. Only added test users can sign in.
6. Click **Save and Continue** → **Back to Dashboard**

---

## Step 4 — Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. For **Application type**, choose **Chrome Extension**
4. For **Item ID**, enter your extension's ID:
   - Open `chrome://extensions` in Chrome
   - Find **Mix→Playlist** and copy the ID (looks like `abcdefghijklmnopqrstuvwxyzabcdef`)
5. Click **Create**
6. A dialog will show your **Client ID** — copy it (looks like `1234567890-abc123.apps.googleusercontent.com`)

---

## Step 5 — Add the Client ID to the Extension

1. Open the `manifest.json` file in the `yt-mix-exporter` folder
2. Find this line:
   ```json
   "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
   ```
3. Replace `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` with the Client ID you just copied:
   ```json
   "client_id": "1234567890-abc123.apps.googleusercontent.com"
   ```
4. Save the file

---

## Step 6 — Reload the Extension

1. Go to `chrome://extensions`
2. Click the **↺ refresh** button on the Mix→Playlist card
3. Open the extension popup — you should now see the **Sign in with Google** button working

---

## ✅ Done!

Once signed in, the flow is fully automatic:

1. Go to any YouTube Mix (`?list=RD...` in the URL)
2. Open the queue panel on the right
3. Click the extension → **Scan Queue**
4. Name your playlist, pick privacy → **Create Playlist on YouTube**
5. The extension creates the playlist and adds every track — then gives you a shareable URL 🎉

---

## 📋 Quota Notes

YouTube Data API gives you **10,000 units/day** for free.  
Each song added costs **50 units**, so you can add ~**200 songs/day** on the free tier.  
For personal use this is more than enough. If you hit limits, wait 24 hours for the quota to reset.

---

## 🔒 Privacy

- The extension only requests the `youtube` scope (manage your YouTube account)
- No data is sent to any third-party servers — everything runs locally in your browser
- You can revoke access at any time via [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
