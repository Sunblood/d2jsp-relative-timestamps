# d2jsp Relative Timestamps

A Tampermonkey userscript that adds a relative time (e.g. `(3 hours ago)`) next to
[d2jsp](https://forums.d2jsp.org)'s static post timestamps (`Aug 24 2026 02:40pm`).

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Click [this raw script link](https://raw.githubusercontent.com/Sunblood/d2jsp-relative-timestamps/main/d2jsp-relative-timestamps.user.js) and Tampermonkey will prompt to install it.
   - Or manually: Tampermonkey dashboard → Create a new script → paste the contents of [`d2jsp-relative-timestamps.user.js`](d2jsp-relative-timestamps.user.js) → Save.

## How it works

d2jsp post timestamps are rendered server-side as static text (e.g. `<span id="td123">Aug 24 2026 02:40pm</span>`)
with no relative-time indicator on topic pages. This script scans the page for that exact format, appends a
relative-time span after each match, refreshes it every 30 seconds, and watches for dynamically loaded content
(pagination, AJAX-loaded posts) via a `MutationObserver`.

**Known limitation:** relative times are computed assuming the displayed timestamp is in your browser's local
timezone. If d2jsp renders times in a different fixed or account-configured timezone, the relative time will be
off by that offset.

## License

MIT
