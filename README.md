# Copy Matcher

Compare intended copy against what's actually in a Figma frame — catches typos, missing strings, and copy drift before designs go to engineering.

![copy-matcher screenshot](docs/screenshot.png)

## What it does

- **Paste text** or **upload a Google Doc exported as PDF** as your source of truth
- Point it at a Figma frame URL
- Get a word-level diff showing what's changed, missing, or extra

## Setup

```bash
npm install
```

Create a `.env` file in the project root:

```
VITE_FIGMA_TOKEN=figd_...
```

Then start the dev server:

```bash
npm run dev
```

## Getting a Figma token

1. In Figma, go to **Account Settings** (click your avatar → Settings)
2. Scroll to **Personal access tokens** → **Generate new token**
3. Give it a name, and make sure **File content: Read** scope is checked
4. Copy the token — it won't be shown again

Paste it into the token field in the top-right of the app, or set it in `.env` as shown above. The app saves it to `localStorage` so you only need to enter it once per browser.

## Using the app

### Option 1 — Paste text

Switch to **Paste text** and paste your copy, one string per line.

### Option 2 — Google Doc PDF

1. Open your copy doc in Google Docs
2. **File → Download → PDF Document**
3. Switch to **Google Doc PDF** in the app and drag/drop or upload the file

### Figma frame link

Paste a Figma frame URL (right-click a frame → Copy link). The app extracts all text nodes inside that frame.

### Reading the results

| Color | Meaning |
|---|---|
| 🟡 Yellow (`~`) | String exists in both but the wording differs — word-level diff shown |
| 🔵 Blue (`+`) | In your intended copy but missing from Figma |
| 🔴 Red (`−`) | In Figma but not in your intended copy |

## Development

```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
```

Built with React, Vite, Tailwind CSS 4, and [PDF.js](https://mozilla.github.io/pdf.js/).
