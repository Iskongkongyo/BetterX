# BetterX

<p align="center">
  <img src="https://img.shields.io/badge/version-3.8.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/platform-Tampermonkey%20%7C%20Violentmonkey-orange.svg" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
</p>

> A userscript that makes browsing X (formerly Twitter) a much better experience: it automatically records every post you scroll past in your timeline, supports search / sorting / notes / favoriting / keyword highlighting, and ships with a range of practical enhancements — post notification subscription management, hiding adult content, interface cleanup and wide-screen layouts, ad blocking, one-click media downloads, default profile tabs and post sorting, automatic long-post expansion, an in-post media grid view, bypassing the age restriction, and a four-language interface.

English | [简体中文](README.md)

---

## ✨ What is BetterX

Have you run into any of these annoyances while browsing X?

- You just scrolled past a post you wanted to see, and now you can never find it again;
- Some accounts post and delete within seconds (a "flash"), so you never even get a chance to read it;
- The timeline is cluttered with ads;
- Replies and the "For You" feed are full of porn and adult-traffic bots;
- Saving images / videos means right-clicking each one individually;
- When you open someone's profile, it always lands on the Posts tab, and you have to manually switch to "Media / Videos" every time;
- To view someone's posts sorted by "Latest" or "Top", you have to fiddle around every time.
- Sensitive content is masked by the age restriction, and clicking "Show more" only pops up a QR code.

**BetterX** solves all of these pain points in one go. It also records the posts you scroll past in the background (everything is stored locally and never uploaded to any server), and provides a draggable side panel so you can easily look back, search, and manage them.

---

## 🚀 Feature Overview

### 📝 Post Recording & Recall

- **Automatic timeline bookmarking**: Automatically captures posts that appear in your timeline (author, text, media, time, link).
- **Full-text search**: Search by author, text, or notes.
- **Sort orders**: *Smart sort* shows pinned, favorited, and quickly-disappeared posts first, then orders the rest by when they were captured. You can also sort by *Recently viewed*, *Recently captured*, *First captured (new→old)*, *First captured (old→new)*, *Appearances*, *By author*, or *By source*. Once a post scrolls into view, its viewed time is recorded so you can find what you just saw.
- **Filters**: *All* / *Unopened* / *Disappeared quickly* / *Favorited* / *Pinned* / *Opened* / *Keyword matches*.
- **Media filters**: *All media* / *With images* / *With video* / *Text only*.
- **Source detection**: Distinguishes *Profile* / *Post details* / *Search page* / *Bookmarks page* / *Notifications page* / *List page*. The panel labels each post with its source, and you can choose to ignore specific sources.

### 🏷️ Organization & Marking

- **Pin / Favorite / Note**: Pin important posts, favorite content you like, and jot down your own notes.
- **Text collapsing**: Long posts are collapsed automatically to keep the panel tidy.
- **Flash alerts**: Posts that are deleted shortly after being posted (*Disappeared quickly*) are specially flagged, and the threshold is configurable.
- **Keyword highlighting & filtering**: Supports plain, **AND multi-word**, and **regex** modes, plus **exclusion terms** (a match hides the post).

### 🛠️ Experience Enhancements

- **Content filtering**: Hides porn, adult-traffic bots, and ads, with intensity levels, a whitelist, and custom block terms.
- **Simplified and wide layout**: Hide the sidebar, promotions, the Messages bar / Grok, and adjust the timeline width.
- **Media download**: One-click download of images, videos, and GIFs; multiple media files can be bundled into a ZIP automatically, with custom file names.
- **Media display optimization**: Shows multiple media items in a grid, and can locally bypass the age-restriction mask.
- **Profile & post enhancements**: Default profile tabs, *Latest / Top* post sorting, and automatic long-post expansion.
- **Notification subscription management**: View, sync, and toggle a user's post notifications directly.

### ⚙️ Interface & Data

- **Four-language interface**: Simplified Chinese, Traditional Chinese, Japanese, and English — either follow the page language automatically or switch manually.
- **Three-view panel**: *Posts*, *Notifications*, and *Settings* are independent; frequently used filters and sorting are grouped on the Posts tab.
- **Flexible badge**: Supports dragging, hiding, a mobile wake handle, and a desktop round badge.
- **Firefox compatibility mode**: One-click switch to compatibility mode when X fails to start properly.
- **Themes & shortcuts**: *Follow system* / *Dark* / *Light*, and `Alt + X` to toggle the panel.
- **Data management**: Import / export backups, auto-clean, and a maximum post count.
- **Local storage**: Posts and settings are stored in your browser locally and are never uploaded to any server.

---

## 📦 Installation

1. First, install any userscript manager:

   - [Tampermonkey](https://www.tampermonkey.net/) (recommended; Chrome / Edge / Firefox / Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (basic features work; video detail requests on Android Firefox may be limited by the login state)

   Then install it directly from GreasyFork [Better X (BetterX)](https://greasyfork.org/en/scripts/588748) or OpenUserJS [Better X (BetterX)](https://openuserjs.org/scripts/流萤可爱捏/更好的_X（BetterX）).

2. Open [x.com](https://x.com). The app badge appears in the bottom-left/bottom-right corner of the page — click it or press `Alt + X` to expand the panel.

> Supported domains: `x.com` and `twitter.com`.

---

## 📖 Usage Guide

| Feature | How to use it |
| --- | --- |
| Open the panel | Click the page badge, or press `Alt + X` |
| Search / filter / sort | Use the controls at the top of the *Posts* tab to quickly recall posts you have browsed |
| Keywords and exclusions | Add them under *Settings → Keywords and exclusions* |
| Content filtering | Adjust adult-content filtering, the whitelist, etc. under *Settings → Content filtering* |
| Simplified and wide layout | Adjust under *Settings → Simplified and wide layout* |
| Downloads | Manage downloads, the GIF download format, ZIP, and naming rules under *Settings → Downloads* |
| Profile enhancements | Set the default tab, post sorting, and long-post expansion under *Settings → Common features* |
| Other settings | Firefox compatibility, badge, post limit, theme, etc. can be adjusted in their respective settings |

---

## 🔒 Privacy

- Post records, notes, and settings are stored in your browser locally and are **never uploaded to any server**.
- The script only runs on `x.com` / `twitter.com`; network requests are used only for official X features, such as notification management and media downloads.
- "Bypass age restriction" and content filtering only modify the local page display; they **never change account settings, auto-block, or report users**.
- Clearing your browser data may wipe local records, so exporting backups regularly is recommended.

---

## ❓ FAQ

**Q: Why weren't some posts recorded?**
A: BetterX can only record posts that have actually loaded on the page. If a post is missing, also check whether the corresponding source is ignored under *Advanced settings*.

**Q: What should I do if a video download fails or no media can be found?**
A: First make sure you're logged in to X, then try opening or playing the video and retry. If you still can't get the video URL on Android Firefox + Violentmonkey, consider switching to Tampermonkey.

**Q: Why aren't multiple media files sometimes bundled into a ZIP?**
A: When the ZIP option is off, the files are too large, or the total exceeds what the browser can safely handle, BetterX automatically falls back to saving them one by one.

**Q: Why doesn't the video show up after bypassing the age restriction?**
A: Images usually appear immediately; videos require fetching the real media URL first, so scroll to the post or play it once and then try again.

**Q: Firefox gets stuck on the X icon — what should I do?**
A: Turn on *Firefox compatibility (Firefox only)* under *Settings → Other features*. If the panel won't even open, you can force compatibility mode from the userscript manager's menu and refresh the page.

**Q: Do the default profile tab and Top sorting affect account switching?**
A: No. They only apply to regular user profiles; *Top* only applies to post-based profiles and does not affect video, photo, or account-switching pages.

**Q: Why doesn't the wide layout work on the Messages or Settings pages?**
A: Those pages have a different structure from the timeline, so BetterX automatically disables layout adjustments to avoid breaking the page.

**Q: What should I do if content filtering wrongly hides a normal post?**
A: Switch to *Conservative* mode, enable "don't moderate accounts you follow", or add the account to the whitelist.

**Q: Can my data be lost?**
A: Data is stored locally in your browser and may be deleted when you clear browser data, so exporting JSON backups regularly is recommended.

**Q: What happens after the record count exceeds the maximum?**
A: BetterX keeps recording new posts and prioritizes deleting the oldest unfavorited, unpinned records; favorited and pinned posts are kept.

---

## 🙏 Acknowledgements

BetterX references the following MIT-licensed userscripts for parts of its feature implementation and compatibility design. Thanks to the original authors for their open implementations and maintenance:

- [X黄推机器人隐藏器](https://greasyfork.org/zh-CN/scripts/570683-x%E9%BB%84%E6%8E%A8%E6%9C%BA%E5%99%A8%E4%BA%BA%E9%9A%90%E8%97%8F%E5%99%A8) (*X Adult-Spam Bot Hider*) — Referenced ideas for text normalization, whitelisting, scoring, and bot-account characteristics.
- [X (Twitter) 黄推清道夫](https://greasyfork.org/zh-CN/scripts/588348-x-twitter-%E9%BB%84%E6%8E%A8%E6%B8%85%E9%81%93%E5%A4%AB) (*X (Twitter) Adult-Spam Cleaner*) — Referenced ideas for DOM-only hiding, risk reasons, and subtle traffic-diversion templates.
- [X/Twitter Clean-up & Wide Layout Display](https://greasyfork.org/zh-CN/scripts/545419-x-twitter-clean-up-wide-layout-display) — Referenced features for UI cleanup, sidebar control, and widening the timeline.
- [Azuki 的 X/Twitter 媒体批量下载器](https://greasyfork.org/zh-CN/scripts/528890) (*Azuki's X/Twitter Media Batch Downloader*) — Referenced the compatibility approach of requesting single-post details through the script manager to obtain the real video media URL.

---

## 📄 License

This project is open source under the [MIT License](https://opensource.org/licenses/MIT).

---

> BetterX is not affiliated with X Corp. in any way and is for personal learning and experience optimization only. When using this script, please comply with X's Terms of Service and applicable local laws.